
'use server';

import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { revalidatePath } from 'next/cache';
import type { Category } from '@/lib/types';

export async function createCategory(categoryName: string): Promise<{ success: boolean; message?: string, category?: Category }> {
    if (!categoryName || categoryName.trim() === '') {
        return { success: false, message: 'Category name cannot be empty.' };
    }

    const trimmedName = categoryName.trim();

    try {
        const categoriesRef = collection(db, 'collections');
        const q = query(categoriesRef, where('name', '==', trimmedName));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const existingCategory = querySnapshot.docs[0].data() as Category;
            existingCategory.id = querySnapshot.docs[0].id;
            return { success: false, message: `Category "${trimmedName}" already exists.` };
        }

        const newCategoryData = {
            name: trimmedName,
            description: "",
            createdAt: serverTimestamp(),
        };

        const newCategoryRef = await addDoc(collection(db, 'collections'), newCategoryData);
        
        revalidatePath('/admin/products/new');
        revalidatePath('/admin/products/edit'); 

        return {
            success: true,
            category: {
                id: newCategoryRef.id,
                name: newCategoryData.name,
                slug: trimmedName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
                description: newCategoryData.description,
            }
        };
    } catch (error) {
        console.error("Failed to create category:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, message: `Failed to create category: ${errorMessage}` };
    }
}
