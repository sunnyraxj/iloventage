'use server';

import Razorpay from 'razorpay';
import crypto from 'crypto';
import { addOrder } from '@/lib/data';
import type { CartItem, User, Order } from '@/lib/types';

interface PaymentVerificationData {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

interface OrderCreationData {
    user: User;
    items: CartItem[];
    totalPrice: number;
    shippingAddress: {
        name: string;
        address: string;
        city: string;
        zip: string;
        country: string;
    }
}

const razorpay = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function initiatePayment(amount: number) {
    const options = {
        amount: Math.round(amount * 100), // amount in the smallest currency unit
        currency: "INR",
        receipt: `receipt_order_${new Date().getTime()}`
    };

    try {
        const order = await razorpay.orders.create(options);
        return order;
    } catch (error) {
        console.error("Razorpay order creation failed:", error);
        throw new Error("Could not create Razorpay order.");
    }
}


export async function verifyAndCreateOrder(
    verificationData: PaymentVerificationData,
    orderData: OrderCreationData
) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = verificationData;
    const { user, items, totalPrice, shippingAddress } = orderData;
    
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(body.toString())
        .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
        // Payment is authentic, create order in DB
        const newOrder = addOrder({
            userId: user.id,
            products: items.map(i => ({ product: i.product, quantity: i.quantity })),
            totalPrice: totalPrice,
            shippingAddress: shippingAddress,
            paymentId: razorpay_payment_id,
        });

        return { success: true, orderId: newOrder.id };
    } else {
        return { success: false, message: 'Payment verification failed.' };
    }
}
