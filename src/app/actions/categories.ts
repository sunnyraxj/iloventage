
'use server';

import { doc, addDoc, updateDoc, deleteDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { revalidatePath } from 'next/cache';
import { type CategoryFormValues } from '@/app/admin/categories/components/CategoryForm';

const createSlug = (name: string) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

export async function upsertCategory(data: CategoryFormValues, categoryId?: string) {
    try {
        const categoryData = { ...data };

        if (categoryId) {
            const categoryRef = doc(db, 'collections', categoryId);
            await updateDoc(categoryRef, categoryData);
        } else {
            await addDoc(collection(db, 'collections'), {
                ...categoryData,
                createdAt: serverTimestamp(),
            });
        }

        revalidatePath('/admin/categories');
        revalidatePath('/categories');
        const slug = createSlug(data.name);
        revalidatePath(`/categories/${slug}`);
        revalidatePath('/'); // Homepage uses categories

        return { success: true };
    } catch (error) {
        console.error("Failed to upsert category:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, message: `Failed to save category: ${errorMessage}` };
    }
}

export async function deleteCategory(categoryId: string) {
    try {
        await deleteDoc(doc(db, 'collections', categoryId));

        revalidatePath('/admin/categories');
        revalidatePath('/categories');
        revalidatePath('/');

        return { success: true };
    } catch (error) {
        console.error("Failed to delete category:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, message: `Failed to delete category: ${errorMessage}` };
    }
}
