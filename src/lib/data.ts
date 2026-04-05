

import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    query,
    where,
    limit,
    serverTimestamp,
    DocumentData,
    Timestamp,
    orderBy,
  } from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { Product, Category, User, Order, UserAddress, OrderItem, OrderAddress, StoreSettings } from './types';
import { cache } from 'react';
  
const createSlug = (name: string) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

function docToType<T>(doc: DocumentData): T {
    const data = doc.data();
    const id = doc.id;

    // Create a new object to avoid mutating the original data
    const processedData: { [key: string]: any } = { id };

    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const value = data[key];
            if (value instanceof Timestamp) {
                processedData[key] = value.toDate().toISOString();
            } else {
                processedData[key] = value;
            }
        }
    }
    
    // Specifically for products, clean up the variants data structure to ensure imageUrls is always string[].
    if (doc.ref.parent.id === 'products' && processedData.variants && Array.isArray(processedData.variants)) {
        processedData.variants = processedData.variants.map((variant: any) => {
            if (variant.imageUrls && Array.isArray(variant.imageUrls)) {
                return {
                    ...variant,
                    imageUrls: variant.imageUrls.map((img: any) => {
                        if (typeof img === 'object' && img !== null && typeof img.value === 'string') {
                            return img.value;
                        }
                        return img;
                    }).filter((img: any) => typeof img === 'string')
                };
            }
            return variant;
        });
    }
    
    // Add slug for products and categories if name exists and it's not already there
    if (processedData.name && !processedData.slug && (doc.ref.parent.id === 'products' || doc.ref.parent.id === 'collections')) {
      processedData.slug = createSlug(processedData.name);
    }
    
    return processedData as T;
}
  
// --- Product Functions ---
export const getProducts = cache(async (options?: { limit?: number }): Promise<Product[]> => {
    const productsCol = collection(db, 'products');
    let q = query(productsCol, orderBy('createdAt', 'desc'));
    if (options?.limit) {
        q = query(q, limit(options.limit));
    }
    const productsSnapshot = await getDocs(q);
    const products = productsSnapshot.docs.map(doc => docToType<Product>(doc));
    
    return products;
});
  
export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
    const q = query(collection(db, 'products'), where('slug', '==', slug), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return null;
    }
    return docToType<Product>(snapshot.docs[0]);
});

export const getProductById = cache(async (id: string): Promise<Product | null> => {
    const productRef = doc(db, 'products', id);
    const productSnap = await getDoc(productRef);
    if (!productSnap.exists()) {
        return null;
    }
    return docToType<Product>(productSnap);
});

export const getProductsByCollectionId = cache(async (collectionId: string, options?: { limit?: number }): Promise<Product[]> => {
    let q = query(collection(db, 'products'), 
        where('collectionIds', 'array-contains', collectionId)
    );
    if (options?.limit) {
        q = query(q, limit(options.limit));
    }
    const querySnapshot = await getDocs(q);
    const products = querySnapshot.docs.map(doc => docToType<Product>(doc));

    return products;
});

// --- Category Functions ---
export const getCategories = cache(async (): Promise<Category[]> => {
    const categoriesCol = collection(db, 'collections');
    const categoriesSnapshot = await getDocs(categoriesCol);
    const categories = categoriesSnapshot.docs.map(doc => docToType<Category>(doc));

    // Return categories and let the UI handle image fallbacks.
    // This avoids fetching all products which is a major performance bottleneck.
    return categories.map(category => ({
        ...category,
        imageUrl: category.imageUrl || `https://picsum.photos/seed/${category.id}/400/400`,
    }));
});
  
export const getCategoryBySlug = cache(async (slug: string): Promise<Category | null> => {
    const q = query(collection(db, 'collections'), where('slug', '==', slug), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return null;
    }
    const category = docToType<Category>(snapshot.docs[0]);

    // Add a fallback imageUrl if one doesn't exist, without an extra DB call.
    category.imageUrl = category.imageUrl || `https://picsum.photos/seed/${category.id}/400/400`;

    return category;
});

export const getCategoryById = cache(async (id: string): Promise<Category | null> => {
    const categoryRef = doc(db, 'collections', id);
    const categorySnap = await getDoc(categoryRef);
    if (!categorySnap.exists()) {
        return null;
    }
    return docToType<Category>(categorySnap);
});
  
// --- User Functions ---
export const getUserById = cache(async (userId: string): Promise<User | null> => {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
        return null;
    }
    const user = docToType<User>(userSnap);

    const addressesCol = collection(db, 'users', userId, 'addresses');
    const addressesSnapshot = await getDocs(addressesCol);
    user.addresses = addressesSnapshot.docs.map(doc => docToType<UserAddress>(doc));

    return user;
})

export const addAddress = async (userId: string, addressData: Omit<UserAddress, 'id' | 'userId'>): Promise<string> => {
    const addressesCol = collection(db, 'users', userId, 'addresses');
    const docRef = await addDoc(addressesCol, { ...addressData, userId });
    return docRef.id;
}
  
// --- Order Functions ---
export const getOrdersByUserId = cache(async (userId: string): Promise<Order[]> => {
    const q = query(collection(db, 'orders'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => docToType<Order>(doc));
});
  
export const getOrderById = cache(async (id: string): Promise<Order | null> => {
    const orderRef = doc(db, 'orders', id);
    const orderSnap = await getDoc(orderRef);
    if (!orderSnap.exists()) {
        return null;
    }
    return docToType<Order>(orderSnap);
});

export const getConfirmedOrdersCount = cache(async (): Promise<number> => {
    const q = query(collection(db, 'orders'), where('orderStatus', '==', 'confirmed'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
});

interface OrderPayload {
    userId: string | null;
    guestEmail?: string;
    items: OrderItem[];
    address: OrderAddress;
    total: number;
    shipping: number;
    razorpay: {
        orderId: string;
        paymentId: string;
        method: string;
    };
}
  
export const createOrder = async (orderPayload: OrderPayload): Promise<Order> => {
    const ordersCol = collection(db, 'orders');
    const orderCountSnapshot = await getDocs(ordersCol);
    const orderNumber = (orderCountSnapshot.size + 1).toString().padStart(6, '0');

    const newOrderData = {
        ...orderPayload,
        orderNumber,
        orderStatus: 'confirmed' as const,
        paymentStatus: 'paid' as const,
        createdAt: serverTimestamp(),
        confirmedAt: serverTimestamp(),
    };

    const docRef = await addDoc(ordersCol, newOrderData);
  
    return {
        id: docRef.id,
        ...newOrderData,
        createdAt: new Date().toISOString(),
        confirmedAt: new Date().toISOString(),
    };
};

// --- Settings Functions ---
export const getStoreSettings = cache(async (): Promise<StoreSettings | null> => {
    const settingsRef = doc(db, 'settings', 'details');
    const settingsSnap = await getDoc(settingsRef);
    if (!settingsSnap.exists()) {
        console.warn("Store settings not found in Firestore. Using default/hardcoded values.");
        return {
            id: 'default',
            storeDetails: {
                name: 'My Store',
                heroImageUrl: 'https://picsum.photos/seed/hero/1920/1080',
                heroVideoUrl: '',
                logoUrl: 'https://picsum.photos/seed/logo/200/200',
                email: 'contact@example.com',
                phone: '123-456-7890',
                address: '123 Main Street',
                city: 'Mumbai',
                state: 'Maharashtra',
                pincode: '400001',
                heroSubtitle: 'Latest Collection',
                heroTitle: 'Timeless Vintage,<br /> Modern Style.',
            },
            shippingSettings: {
                belowThresholdRate: 50,
                freeShippingThreshold: 1000,
            }
        };
    }
    const settingsData = docToType<StoreSettings>(settingsSnap);
    
    // Also provide defaults if the settings doc exists but the fields don't
    if (settingsData.storeDetails) {
        if (!settingsData.storeDetails.heroSubtitle) {
            settingsData.storeDetails.heroSubtitle = 'Latest Collection';
        }
        if (!settingsData.storeDetails.heroTitle) {
            settingsData.storeDetails.heroTitle = 'Timeless Vintage,<br /> Modern Style.';
        }
    }

    return settingsData;
});


// --- Admin Functions ---

export const getAllProducts = cache(async (): Promise<Product[]> => {
    const productsCol = collection(db, 'products');
    const q = query(productsCol, orderBy('createdAt', 'desc'));
    const productsSnapshot = await getDocs(q);
    return productsSnapshot.docs.map(doc => docToType<Product>(doc));
});

export const getAllOrders = cache(async (): Promise<Order[]> => {
    const ordersCol = collection(db, 'orders');
    const ordersSnapshot = await getDocs(ordersCol);
    return ordersSnapshot.docs.map(doc => docToType<Order>(doc));
})

export const getAllUsers = cache(async (): Promise<User[]> => {
    const usersCol = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCol);
    return usersSnapshot.docs.map(doc => docToType<User>(doc));
})
