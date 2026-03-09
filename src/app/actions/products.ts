'use server';

import { doc, addDoc, updateDoc, collection, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { revalidatePath } from 'next/cache';
import { type ProductFormValues } from '@/app/admin/products/components/ProductForm';

const createSlug = (name: string) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');


export async function upsertProduct(data: ProductFormValues, productId?: string) {
    try {
        const productData = {
            ...data,
            price: Number(data.price),
            mrp: Number(data.mrp),
            moq: Number(data.moq),
            additionalDetails: data.additionalDetails?.map(d => d.value) || [],
        };

        if (productId) {
            // Update existing product
            const productRef = doc(db, 'products', productId);
            await updateDoc(productRef, productData);
        } else {
            // Create new product
            await addDoc(collection(db, 'products'), {
                ...productData,
                clicks: 0,
                createdAt: serverTimestamp(),
            });
        }

        // Revalidate paths
        revalidatePath('/admin/products');
        revalidatePath('/products');
        const slug = createSlug(data.name);
        revalidatePath(`/products/${slug}`);
        
        // Revalidate category paths
        const categoryRef = doc(db, 'collections', data.collectionId);
        const categorySnap = await getDoc(categoryRef);
        if (categorySnap.exists()) {
            const categoryData = categorySnap.data();
            if(categoryData.name) {
                const categorySlug = createSlug(categoryData.name);
                revalidatePath(`/categories/${categorySlug}`);
            }
        }
        revalidatePath('/categories');


        return { success: true };
    } catch (error) {
        console.error("Failed to upsert product:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, message: `Failed to save product: ${errorMessage}` };
    }
}
