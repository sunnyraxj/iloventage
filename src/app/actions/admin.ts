'use server';

import { doc, updateDoc, serverTimestamp, runTransaction, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { revalidatePath } from 'next/cache';
import Razorpay from 'razorpay';
import type { Order, Product } from '@/lib/types';

export async function updateOrderStatus(orderId: string, status: string) {
    try {
        if (!['shipped', 'delivered'].includes(status)) {
            throw new Error('Admins can only update status to "shipped" or "delivered".');
        }

        const orderRef = doc(db, 'orders', orderId);
        
        const updateData: { [key: string]: any } = {
            orderStatus: status,
        };

        if (status === 'shipped') {
            updateData.shippedAt = serverTimestamp();
        } else if (status === 'delivered') {
            updateData.deliveredAt = serverTimestamp();
        }

        await updateDoc(orderRef, updateData);

        // Revalidate paths to ensure data is fresh
        revalidatePath('/admin/orders');
        revalidatePath(`/dashboard/orders/${orderId}`);
        revalidatePath('/admin');


        return { success: true };
    } catch (error) {
        console.error("Failed to update order status:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, message: `Failed to update status: ${errorMessage}` };
    }
}


export async function verifyPaymentStatusFromAdmin(orderId: string) {
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        return { success: false, message: "Razorpay keys are not configured on the server." };
    }

    try {
        const orderRef = doc(db, 'orders', orderId);
        const orderSnap = await getDoc(orderRef);

        if (!orderSnap.exists()) {
            return { success: false, message: 'Order not found.' };
        }

        const orderData = orderSnap.data() as Order;

        if (orderData.orderStatus !== 'pending') {
            return { success: false, message: `Order is already processed. Status: ${orderData.orderStatus}` };
        }

        const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

        const razorpayOrderId = orderData.razorpay.orderId;
        const paymentData = await razorpay.orders.fetchPayments(razorpayOrderId);

        const successfulPayment = paymentData.items.find(p => p.status === 'captured');

        if (!successfulPayment) {
            return { success: false, message: 'Payment not successful on Razorpay. Status might be pending or failed.' };
        }

        await runTransaction(db, async (transaction) => {
            for (const item of orderData.items) {
                const productRef = doc(db, 'products', item.productId);
                const productSnap = await transaction.get(productRef);

                if (!productSnap.exists()) {
                    throw new Error(`Product with ID ${item.productId} not found.`);
                }
                
                const productData = productSnap.data() as Product;
                const updatedVariants = productData.variants.map(variant => {
                    if (variant.color === item.color) {
                        const updatedSizes = variant.sizes.map(size => {
                            if (size.size === item.size) {
                                const newStock = size.stock - item.quantity;
                                if (newStock < 0) {
                                    throw new Error(`Not enough stock for ${productData.name} (${variant.color}, ${size.size}).`);
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

            transaction.update(orderRef, {
                orderStatus: 'confirmed',
                paymentStatus: 'paid',
                'razorpay.paymentId': successfulPayment.id,
                'razorpay.method': successfulPayment.method,
                confirmedAt: serverTimestamp(),
            });
        });

        revalidatePath('/admin/orders');
        revalidatePath(`/dashboard/orders/${orderId}`);
        revalidatePath('/admin');
        
        return { success: true, message: 'Payment verified and order confirmed successfully.' };

    } catch (error) {
        console.error("Failed to verify payment status:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, message: `Verification failed: ${errorMessage}` };
    }
}
