
'use server';

import { doc, addDoc, updateDoc, collection, serverTimestamp, getDoc, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import { db, storage } from '@/firebase/config';
import { ref, deleteObject } from 'firebase/storage';
import { revalidatePath } from 'next/cache';
import { type ProductFormValues } from '@/app/admin/products/components/ProductForm';

const createSlug = (name: string) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');


export async function upsertProduct(data: ProductFormValues, productId?: string) {
    try {
        // Find or create category
        let collectionId: string;
        const categoriesRef = collection(db, 'collections');
        const categoryQuery = query(categoriesRef, where('name', '==', data.categoryName));
        const querySnapshot = await getDocs(categoryQuery);

        if (!querySnapshot.empty) {
            collectionId = querySnapshot.docs[0].id;
        } else {
            const newCategoryData = {
                name: data.categoryName,
                description: "",
                createdAt: serverTimestamp(),
            };
            const newCategoryRef = await addDoc(collection(db, 'collections'), newCategoryData);
            collectionId = newCategoryRef.id;
        }

        const { categoryName, ...productDataInput } = data;

        const productData = {
            ...productDataInput,
            collectionId, // Use the resolved collectionId
            price: Number(data.price),
            mrp: Number(data.mrp),
            moq: Number(data.moq),
            additionalDetails: data.additionalDetails?.map(d => d.value) || [],
            variants: data.variants.map(variant => ({
                ...variant,
                // Ensure imageUrls are stored as a clean array of strings
                imageUrls: variant.imageUrls.map(image => image.value)
            }))
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
        const newCategorySlug = createSlug(data.categoryName);
        revalidatePath(`/categories/${newCategorySlug}`);
        revalidatePath('/categories');
        revalidatePath('/'); // Homepage uses categories


        return { success: true };
    } catch (error) {
        console.error("Failed to upsert product:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, message: `Failed to save product: ${errorMessage}` };
    }
}


export async function deleteProduct(productId: string) {
    try {
        const productRef = doc(db, 'products', productId);
        const productSnap = await getDoc(productRef);

        if (!productSnap.exists()) {
            return { success: false, message: 'Product not found.' };
        }

        const productData = productSnap.data();
        const imageUrlsToDelete: string[] = [];

        if (productData.variants) {
            for (const variant of productData.variants) {
                if (variant.imageUrls && Array.isArray(variant.imageUrls)) {
                    imageUrlsToDelete.push(...variant.imageUrls);
                }
            }
        }
        
        // Delete images from Storage
        for (const url of imageUrlsToDelete) {
            if (url.includes('firebasestorage.googleapis.com') || url.includes('storage.googleapis.com')) {
                try {
                    const imageRef = ref(storage, url);
                    await deleteObject(imageRef);
                } catch (error: any) {
                    if (error.code !== 'storage/object-not-found') {
                        console.warn(`Failed to delete image ${url}:`, error);
                    }
                }
            }
        }

        // Delete product document from Firestore
        await deleteDoc(productRef);
        
        revalidatePath('/admin/products');
        revalidatePath('/products');
        revalidatePath('/');
        revalidatePath('/categories', 'layout');


        return { success: true };
    } catch (error) {
        console.error("Failed to delete product:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, message: `Failed to delete product: ${errorMessage}` };
    }
}
