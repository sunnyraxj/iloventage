'use server';

import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { revalidatePath } from 'next/cache';
import type { UserAddress } from '@/lib/types';

// Omit id because it's auto-generated, omit userId because it's passed separately
export type AddressFormValues = Omit<UserAddress, 'id' | 'userId'>;

export async function addAddress(userId: string, addressData: AddressFormValues) {
    try {
        const addressesRef = collection(db, 'users', userId, 'addresses');
        await addDoc(addressesRef, addressData);
        revalidatePath('/dashboard/addresses');
        revalidatePath('/checkout');
        return { success: true };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, message: `Failed to add address: ${errorMessage}` };
    }
}

export async function updateAddress(userId: string, addressId: string, addressData: AddressFormValues) {
    try {
        const addressRef = doc(db, 'users', userId, 'addresses', addressId);
        await updateDoc(addressRef, addressData);
        revalidatePath('/dashboard/addresses');
        revalidatePath('/checkout');
        return { success: true };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, message: `Failed to update address: ${errorMessage}` };
    }
}

export async function deleteAddress(userId: string, addressId: string) {
    try {
        const addressRef = doc(db, 'users', userId, 'addresses', addressId);
        await deleteDoc(addressRef);
        revalidatePath('/dashboard/addresses');
        revalidatePath('/checkout');
        return { success: true };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, message: `Failed to delete address: ${errorMessage}` };
    }
}
