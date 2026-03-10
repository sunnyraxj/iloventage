'use server';

import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { revalidatePath } from 'next/cache';
import { type StoreDetails, type ShippingSettings } from '@/lib/types';

export async function updateStoreSettings(data: { storeDetails: StoreDetails, shippingSettings: ShippingSettings }) {
    try {
        const settingsRef = doc(db, 'settings', 'details');
        
        await setDoc(settingsRef, {
             storeDetails: data.storeDetails, 
             shippingSettings: data.shippingSettings 
        }, { merge: true });

        // Revalidate paths to ensure data is fresh across the app
        revalidatePath('/');
        revalidatePath('/admin/settings');
        revalidatePath('/cart');
        revalidatePath('/checkout');
        revalidatePath('/', 'layout');


        return { success: true };
    } catch (error) {
        console.error("Failed to update store settings:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, message: `Failed to save settings: ${errorMessage}` };
    }
}
