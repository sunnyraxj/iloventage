
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


export async function createOrderAndInitiatePayment(orderData: OrderCreationData) {
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        const errorMessage = "Razorpay API keys are not configured on the server. Please contact support.";
        console.error(errorMessage);
        return { success: false, message: errorMessage };
    }

    const razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
    });

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
        
        let errorMessage = 'Could not create Razorpay order.';
        // Check for Razorpay's specific error structure
        if (typeof error === 'object' && error !== null && 'error' in error) {
            const razorpayError = (error as any).error;
            if (razorpayError && typeof razorpayError.description === 'string') {
                errorMessage = razorpayError.description;
            }
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }

        return { success: false, message: errorMessage };
    }
}


export async function verifyPaymentAndUpdateOrder(
    verificationData: PaymentVerificationData
): Promise<{success: boolean, message?: string, orderId?: string}> {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = verificationData;
    
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
        const errorMessage = "Razorpay secret key is not configured on the server. Payment cannot be verified.";
        console.error(errorMessage);
        return { success: false, message: errorMessage };
    }
    
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
        .createHmac('sha256', keySecret)
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
        
        // Update payment status on client-side for immediate user feedback.
        // The webhook will be the source of truth for confirming the order.
        await updateDoc(orderDoc.ref, {
            paymentStatus: 'paid',
            'razorpay.paymentId': razorpay_payment_id,
        });
        revalidatePath(`/dashboard/orders/${orderDoc.id}`);

        return { success: true, orderId: orderDoc.id };
    } else {
        return { success: false, message: 'Payment verification failed.' };
    }
}
