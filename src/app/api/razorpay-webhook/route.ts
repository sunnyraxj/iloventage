import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/firebase/config';
import { collection, query, where, getDocs, runTransaction, doc, serverTimestamp } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import type { Order, Product } from '@/lib/types';

// This is the background task that will process the order.
async function handleOrderPaid(payload: any) {
    try {
        const razorpayOrderId = payload.order.entity.id;
        
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, where('razorpay.orderId', '==', razorpayOrderId));
        
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.warn(`Webhook processed for non-existent order. Razorpay ID: ${razorpayOrderId}`);
            // No need to throw error, just log and exit.
            return;
        }

        const orderDoc = querySnapshot.docs[0];
        const orderData = orderDoc.data() as Order;

        // Idempotency check: If order is already confirmed, do nothing.
        if (orderData.orderStatus === 'confirmed') {
            console.log(`Webhook ignored: Order ${orderDoc.id} already confirmed.`);
            return;
        }

        // Use a transaction to ensure atomicity of stock reduction and order update.
        await runTransaction(db, async (transaction) => {
            // 1. Update stock for each item in the order
            for (const item of orderData.items) {
                const productRef = doc(db, 'products', item.productId);
                const productSnap = await transaction.get(productRef);

                if (!productSnap.exists()) {
                    throw new Error(`Webhook Error: Product with ID ${item.productId} not found.`);
                }

                const productData = productSnap.data() as Product;

                const updatedVariants = productData.variants.map(variant => {
                    if (variant.color === item.color) {
                        const updatedSizes = variant.sizes.map(size => {
                            if (size.size === item.size) {
                                const newStock = size.stock - item.quantity;
                                if (newStock < 0) {
                                    // This is a critical error, the transaction will fail and roll back.
                                    throw new Error(`Webhook Error: Not enough stock for ${productData.name} (${variant.color}, ${size.size}).`);
                                }
                                return { ...size, stock: newStock };
                            }
                            return size;
                        });
                        return { ...variant, sizes: updatedSizes };
                    }
                    return variant;
                });

                transaction.update(productRef, { variants: updatedVariants });
            }

            // 2. Update the order status to confirmed
            transaction.update(orderDoc.ref, { 
                orderStatus: 'confirmed',
                paymentStatus: 'paid',
                'razorpay.paymentId': payload.payment.entity.id,
                'razorpay.method': payload.payment.entity.method,
                confirmedAt: serverTimestamp()
            });
        });
        
        console.log(`Webhook success: Order ${orderDoc.id} confirmed and stock updated.`);
        
        // 3. Revalidate paths to reflect changes in the UI
        revalidatePath(`/dashboard/orders/${orderDoc.id}`);
        revalidatePath('/admin/orders');
        revalidatePath('/products', 'layout');

    } catch (error) {
        console.error("Webhook handler for 'order.paid' failed during background processing:", error);
        // We log the error but don't throw it, as this is a background task.
        // The serverless function has already responded to Razorpay.
    }
}


export async function POST(req: Request) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
        console.error("RAZORPAY_WEBHOOK_SECRET is not set.");
        return new NextResponse('Internal Server Error: Webhook secret not configured.', { status: 500 });
    }
    
    // 1. Get raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
        return new NextResponse('Signature missing', { status: 400 });
    }

    // 2. Verify signature
    try {
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body)
            .digest('hex');

        if (expectedSignature !== signature) {
            return new NextResponse('Invalid signature', { status: 400 });
        }
    } catch (error) {
        console.error("Error during signature verification:", error);
        return new NextResponse('Internal Server Error during signature verification.', { status: 500 });
    }
    
    // 3. Parse event and trigger background processing
    try {
        const event = JSON.parse(body);

        if (event.event === 'order.paid') {
            // Don't await this. This lets the function respond immediately.
            handleOrderPaid(event.payload);
        }
    } catch (error) {
        console.error("Error parsing webhook body or triggering handler:", error);
        // Still respond with 200, as the request from Razorpay was received.
        // The issue is on our end, but we don't want Razorpay to retry.
    }

    // 4. Respond immediately to Razorpay
    return NextResponse.json({ status: 'ok' });
}
