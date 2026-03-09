'use server';

import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { revalidatePath } from 'next/cache';
import { type StoreDetails } from '@/lib/types';

export async function updateStoreSettings(data: StoreDetails) {
    try {
        const settingsRef = doc(db, 'settings', 'details');
        
        await setDoc(settingsRef, { storeDetails: data }, { merge: true });

        // Revalidate paths to ensure data is fresh across the app
        revalidatePath('/');
        revalidatePath('/admin/settings');
        revalidatePath('/', 'layout');


        return { success: true };
    } catch (error) {
        console.error("Failed to update store settings:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, message: `Failed to save settings: ${errorMessage}` };
    }
}
