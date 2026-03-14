import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/firebase/config';
import { collection, query, where, getDocs, updateDoc, serverTimestamp, runTransaction, doc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import type { Order, Product } from '@/lib/types';

export async function POST(req: Request) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
        console.error("RAZORPAY_WEBHOOK_SECRET is not set.");
        return NextResponse.json({ error: 'Internal Server Error: Webhook secret not configured.' }, { status: 500 });
    }

    const signature = req.headers.get('x-razorpay-signature');
    const body = await req.text();

    if (!signature) {
        return NextResponse.json({ error: 'Signature missing' }, { status: 400 });
    }

    try {
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body)
            .digest('hex');

        if (expectedSignature !== signature) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }
    } catch (error) {
        console.error("Error during signature verification:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
    
    const event = JSON.parse(body);

    if (event.event === 'order.paid') {
        try {
            const razorpayOrderId = event.payload.order.entity.id;
            
            const ordersRef = collection(db, 'orders');
            const q = query(ordersRef, where('razorpay.orderId', '==', razorpayOrderId));
            
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                console.warn(`Webhook received for non-existent order with Razorpay ID: ${razorpayOrderId}`);
                return NextResponse.json({ status: 'ok, order not found' });
            }

            const orderDoc = querySnapshot.docs[0];
            const orderData = orderDoc.data() as Order;

            if (orderData.orderStatus !== 'confirmed') {
                await runTransaction(db, async (transaction) => {
                    // Update stock for each item in the order
                    for (const item of orderData.items) {
                        const productRef = doc(db, 'products', item.productId);
                        const productSnap = await transaction.get(productRef);

                        if (!productSnap.exists()) {
                            throw new Error(`Webhook: Product with ID ${item.productId} not found.`);
                        }

                        const productData = productSnap.data() as Product;

                        const updatedVariants = productData.variants.map(variant => {
                            if (variant.color === item.color) {
                                const updatedSizes = variant.sizes.map(size => {
                                    if (size.size === item.size) {
                                        const newStock = size.stock - item.quantity;
                                        if (newStock < 0) {
                                            throw new Error(`Webhook: Not enough stock for ${productData.name} (${variant.color}, ${size.size}).`);
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

                    // Update the order status to confirmed
                    transaction.update(orderDoc.ref, { 
                        orderStatus: 'confirmed',
                        paymentStatus: 'paid',
                        'razorpay.paymentId': event.payload.payment.entity.id,
                        'razorpay.method': event.payload.payment.entity.method,
                        confirmedAt: serverTimestamp()
                    });
                });
                
                console.log(`Webhook successfully updated order ${orderDoc.id} to confirmed and adjusted stock.`);
                
                revalidatePath(`/dashboard/orders/${orderDoc.id}`);
                revalidatePath('/admin/orders');
                revalidatePath('/products', 'layout');

            } else {
                console.log(`Webhook ignored for already confirmed order ${orderDoc.id}.`);
            }

        } catch (error) {
            console.error("Webhook handler for 'order.paid':", error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return NextResponse.json({ error: 'Webhook handler failed', details: errorMessage }, { status: 500 });
        }
    }
    
    return NextResponse.json({ status: 'ok' });
}
