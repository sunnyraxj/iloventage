import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/firebase/config';
import { collection, query, where, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

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
            const orderData = orderDoc.data();

            if (orderData.orderStatus !== 'confirmed') {
                const orderRef = orderDoc.ref;
                await updateDoc(orderRef, { 
                    orderStatus: 'confirmed',
                    paymentStatus: 'paid',
                    'razorpay.paymentId': event.payload.payment.entity.id,
                    'razorpay.method': event.payload.payment.entity.method,
                    confirmedAt: serverTimestamp()
                });
                console.log(`Webhook successfully updated order ${orderDoc.id} to confirmed.`);
                revalidatePath(`/dashboard/orders/${orderDoc.id}`);
                revalidatePath('/admin/orders');
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
