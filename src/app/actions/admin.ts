'use server';

import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { revalidatePath } from 'next/cache';

export async function updateOrderStatus(orderId: string, status: string) {
    try {
        if (!['shipped', 'delivered'].includes(status)) {
            throw new Error('Admins can only update status to "shipped" or "delivered".');
        }

        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, {
            orderStatus: status,
        });

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
