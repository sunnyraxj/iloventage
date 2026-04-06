
'use server';

import Razorpay from 'razorpay';
import crypto from 'crypto';
import { doc, setDoc, collection, serverTimestamp, query, where, getDocs, runTransaction } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { revalidatePath } from 'next/cache';
import type { CartItem, OrderAddress, Order, Product } from '@/lib/types';

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

    if (!keyId) {
        const errorMessage = "Razorpay Key ID (NEXT_PUBLIC_RAZORPAY_KEY_ID) is not configured on the server. Please check your environment variables.";
        console.error(errorMessage);
        return { success: false, message: errorMessage };
    }
    if (!keySecret) {
        const errorMessage = "Razorpay Key Secret (RAZORPAY_KEY_SECRET) is not configured on the server. Please check your environment variables.";
        console.error(errorMessage);
        return { success: false, message: errorMessage };
    }

    const razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
    });
    
    // Create a new document reference with a unique ID up front
    const orderDocRef = doc(collection(db, 'orders'));

    let razorpayOrder;
    try {
        const options = {
            amount: Math.round(orderData.total * 100),
            currency: "INR",
            receipt: orderDocRef.id // Use the generated ID as the receipt
        };
        razorpayOrder = await razorpay.orders.create(options);
    } catch (error) {
        console.error("Razorpay order creation failed:", error);
        
        let errorMessage = 'Could not create Razorpay order.';
        if (typeof error === 'object' && error !== null && 'error' in error) {
            const razorpayError = (error as any).error;
            if (razorpayError && typeof razorpayError.description === 'string') {
                errorMessage = razorpayError.description;
                if (errorMessage.toLowerCase().includes('authentication failed')) {
                    errorMessage = 'Authentication failed. Please ensure your Razorpay Key ID and Key Secret are correctly set in your environment variables.';
                }
            }
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }

        return { success: false, message: errorMessage };
    }
    
    // Now that the Razorpay order is created, create the Firestore document.
    try {
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
                orderId: razorpayOrder.id, // Include the ID from the start
                paymentId: '',
                method: '',
            },
        };
        
        await setDoc(orderDocRef, newOrderData);

        return {
            success: true,
            orderId: orderDocRef.id,
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
        };
    } catch (dbError) {
        // This is a critical failure state. The payment order exists but our DB record failed to be created.
        // We must log this for manual reconciliation.
        console.error("CRITICAL: Firestore order creation failed AFTER Razorpay order was created.", {
            firestoreOrderId: orderDocRef.id,
            razorpayOrderId: razorpayOrder.id,
            error: dbError
        });
        const errorMessage = dbError instanceof Error ? dbError.message : 'Could not save order to database.';
        return { success: false, message: `Failed to save order details. Please contact support with Razorpay Order ID: ${razorpayOrder.id}` };
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
        try {
            const ordersRef = collection(db, 'orders');
            const q = query(ordersRef, where('razorpay.orderId', '==', razorpay_order_id));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                console.error(`Payment verification successful but no order found for Razorpay order ID: ${razorpay_order_id}`);
                return { success: false, message: 'Order not found.' };
            }

            const orderDoc = querySnapshot.docs[0];
            const orderData = orderDoc.data() as Order;
            
            // Don't update stock if order is already confirmed to avoid double reduction
            if (orderData.orderStatus === 'confirmed') {
                console.log(`Order ${orderDoc.id} already confirmed. Skipping stock update.`);
                return { success: true, orderId: orderDoc.id };
            }

            await runTransaction(db, async (transaction) => {
                // Update stock for each item in the order
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

                // Update the order status to confirmed
                transaction.update(orderDoc.ref, {
                    orderStatus: 'confirmed',
                    paymentStatus: 'paid',
                    'razorpay.paymentId': razorpay_payment_id,
                    confirmedAt: serverTimestamp(),
                });
            });
            
            // Revalidate paths to ensure data is fresh
            revalidatePath(`/dashboard/orders/${orderDoc.id}`);
            revalidatePath('/admin/orders');
            revalidatePath('/admin');
            revalidatePath('/products', 'layout');


            return { success: true, orderId: orderDoc.id };

        } catch (error) {
            console.error("Payment verification and stock update failed:", error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during payment verification.';
            return { success: false, message: errorMessage };
        }
    } else {
        console.error("Razorpay signature verification failed. This might be due to a mismatched webhook secret or an attempt at fraud.");
        return { success: false, message: 'Payment verification failed. If you are the admin, please check your Razorpay webhook secret.' };
    }
}
