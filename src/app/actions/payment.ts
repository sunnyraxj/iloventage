'use server';

import Razorpay from 'razorpay';
import crypto from 'crypto';
import { doc, addDoc, updateDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { revalidatePath } from 'next/cache';
import type { CartItem, OrderAddress } from '@/lib/types';

interface PaymentVerificationData {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

interface OrderCreationData {
    userId: string | null;
    guestEmail?: string;
    items: CartItem[];
    total: number;
    shipping: number;
    address: OrderAddress;
}

const razorpay = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});


export async function createOrderAndInitiatePayment(orderData: OrderCreationData) {
    const ordersCol = collection(db, 'orders');
    const orderCountSnapshot = await getDocs(ordersCol);
    const orderNumber = (orderCountSnapshot.size + 1).toString().padStart(6, '0');

    const newOrderData = {
        ...orderData,
        orderNumber,
        orderStatus: 'pending' as const,
        paymentStatus: 'unpaid' as const,
        createdAt: serverTimestamp(),
        razorpay: {
            orderId: '',
            paymentId: '',
            method: '',
        },
    };
    const docRef = await addDoc(ordersCol, newOrderData);

    try {
        const options = {
            amount: Math.round(orderData.total * 100),
            currency: "INR",
            receipt: docRef.id
        };
        const razorpayOrder = await razorpay.orders.create(options);

        await updateDoc(docRef, { 'razorpay.orderId': razorpayOrder.id });

        return {
            success: true,
            orderId: docRef.id,
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
        };
    } catch (error) {
        await updateDoc(docRef, { orderStatus: 'cancelled', paymentStatus: 'unpaid' });
        console.error("Razorpay order creation failed:", error);
        const errorMessage = error instanceof Error ? error.message : 'Could not create Razorpay order.';
        return { success: false, message: errorMessage };
    }
}


export async function verifyPaymentAndUpdateOrder(
    verificationData: PaymentVerificationData
): Promise<{success: boolean, message?: string, orderId?: string}> {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = verificationData;
    
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(body.toString())
        .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, where('razorpay.orderId', '==', razorpay_order_id));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.error(`Payment verification successful but no order found for Razorpay order ID: ${razorpay_order_id}`);
            return { success: false, message: 'Order not found.' };
        }

        const orderDoc = querySnapshot.docs[0];
        if (orderDoc.data().orderStatus !== 'confirmed') {
            await updateDoc(orderDoc.ref, {
                orderStatus: 'confirmed',
                paymentStatus: 'paid',
                'razorpay.paymentId': razorpay_payment_id,
            });
            revalidatePath(`/dashboard/orders/${orderDoc.id}`);
        }

        return { success: true, orderId: orderDoc.id };
    } else {
        return { success: false, message: 'Payment verification failed.' };
    }
}
