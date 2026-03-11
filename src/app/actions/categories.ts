
'use server';

import { collection, addDoc, doc, updateDoc, getDoc, deleteDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db, storage } from '@/firebase/config';
import { ref, deleteObject } from 'firebase/storage';
import { revalidatePath } from 'next/cache';

// This type will be defined in the form component, not here.
// But the action needs to know the shape of the data.
interface CategoryFormData {
    name: string;
    description?: string;
    imageUrl?: string;
}

const createSlug = (name: string) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

export async function upsertCategory(data: CategoryFormData, categoryId?: string) {
    try {
        const categoriesRef = collection(db, 'collections');
        const slug = createSlug(data.name);

        const q = query(categoriesRef, where('slug', '==', slug));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const isSameCategory = categoryId && querySnapshot.docs[0].id === categoryId;
            if (!isSameCategory) {
                 return { success: false, message: `Category "${data.name}" already exists.` };
            }
        }

        const categoryData = {
            ...data,
            slug: slug,
        };

        if (categoryId) {
            const categoryRef = doc(db, 'collections', categoryId);
            await updateDoc(categoryRef, categoryData);
        } else {
            await addDoc(collection(db, 'collections'), {
                ...categoryData,
                createdAt: serverTimestamp(),
            });
        }

        revalidatePath('/admin/products/new');
        revalidatePath('/admin/products/edit', 'page');
        revalidatePath('/', 'layout');
        revalidatePath('/categories', 'layout');
        
        return { success: true };
    } catch (error) {
        console.error("Failed to upsert category:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, message: `Failed to save category: ${errorMessage}` };
    }
}


export async function deleteCategory(categoryId: string) {
    try {
        const categoryRef = doc(db, 'collections', categoryId);
        const categorySnap = await getDoc(categoryRef);

        if (!categorySnap.exists()) {
            return { success: false, message: 'Category not found.' };
        }

        const categoryData = categorySnap.data();

        if (categoryData.imageUrl && (categoryData.imageUrl.includes('firebasestorage.googleapis.com') || categoryData.imageUrl.includes('storage.googleapis.com'))) {
            try {
                const imageRef = ref(storage, categoryData.imageUrl);
                await deleteObject(imageRef);
            } catch (error: any) {
                if (error.code !== 'storage/object-not-found') {
                    console.warn(`Failed to delete image ${categoryData.imageUrl}:`, error);
                }
            }
        }

        await deleteDoc(categoryRef);
        
        revalidatePath('/admin/products', 'layout');
        revalidatePath('/', 'layout');

        return { success: true };
    } catch (error) {
        console.error("Failed to delete category:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, message: `Failed to delete category: ${errorMessage}` };
    }
}
