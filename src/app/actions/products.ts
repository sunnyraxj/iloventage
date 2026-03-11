'use server';

import { doc, addDoc, updateDoc, collection, serverTimestamp, getDoc, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import { db, storage } from '@/firebase/config';
import { ref, deleteObject } from 'firebase/storage';
import { revalidatePath } from 'next/cache';
import { type ProductFormValues } from '@/app/admin/products/components/ProductForm';
import type { Product } from '@/lib/types';

const createSlug = (name: string) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');


export async function upsertProduct(data: ProductFormValues, productId?: string) {
    try {
        const slug = createSlug(data.name);
        const productData = {
            ...data,
            brand: data.brand || 'ILV',
            slug: slug,
            price: Number(data.price),
            mrp: Number(data.mrp),
            moq: Number(data.moq),
            additionalDetails: data.additionalDetails?.map(d => d.value) || [],
            variants: data.variants.map(variant => ({
                ...variant,
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
        revalidatePath('/products');
        revalidatePath(`/products/${slug}`);
        
        // Revalidate category paths
        const category = await getDoc(doc(db, 'collections', data.collectionId));
        if(category.exists()) {
            const categoryData = category.data();
            if (categoryData.slug) {
                revalidatePath(`/categories/${categoryData.slug}`);
            }
        }
        revalidatePath('/categories');
        revalidatePath('/');


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

export async function replaceProductImage(productId: string, variantColor: string, oldImageUrl: string, newImageUrl: string) {
    try {
        const productRef = doc(db, 'products', productId);
        const productSnap = await getDoc(productRef);
        if (!productSnap.exists()) {
            throw new Error('Product not found');
        }
        const productData = productSnap.data() as Product;

        const updatedVariants = productData.variants.map(variant => {
            if (variant.color === variantColor) {
                 const urls = variant.imageUrls.map(url => (typeof url === 'object' && url !== null ? (url as any).value : url) as string);
                return {
                    ...variant,
                    imageUrls: urls.map(url => url === oldImageUrl ? newImageUrl : url),
                };
            }
            return variant;
        });

        await updateDoc(productRef, { variants: updatedVariants });

        if (oldImageUrl.includes('firebasestorage.googleapis.com')) {
            try {
                const oldImageRef = ref(storage, oldImageUrl);
                await deleteObject(oldImageRef);
            } catch (deleteError: any) {
                 if (deleteError.code !== 'storage/object-not-found') {
                    console.warn(`Failed to delete old image ${oldImageUrl}, but proceeding as update was successful.`, deleteError);
                 }
            }
        }
        
        revalidatePath(`/admin/products/edit/${productId}`);
        revalidatePath(`/admin/products`);
        revalidatePath(`/products/${productData.slug}`);

        return { success: true };
    } catch (error) {
        console.error("Failed to replace image URL:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { success: false, message: `Failed to replace image URL: ${errorMessage}` };
    }
}
