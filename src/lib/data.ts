
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
    
    // Add slug for products and categories if name exists
    if (processedData.name && (doc.ref.parent.id === 'products' || doc.ref.parent.id === 'collections')) {
      processedData.slug = createSlug(processedData.name);
    }
    
    return processedData as T;
}
  
// --- Product Functions ---
export const getProducts = async (): Promise<Product[]> => {
    const productsCol = collection(db, 'products');
    const q = query(productsCol, where('isVisible', '==', true));
    const productsSnapshot = await getDocs(q);
    return productsSnapshot.docs.map(doc => docToType<Product>(doc));
};
  
export const getProductBySlug = async (slug: string): Promise<Product | null> => {
    const productsCol = collection(db, 'products');
    const productsSnapshot = await getDocs(productsCol);
    const products = productsSnapshot.docs.map(doc => docToType<Product>(doc));
    const product = products.find(p => p.slug === slug);
    return product || null;
};

export const getProductById = async (id: string): Promise<Product | null> => {
    const productRef = doc(db, 'products', id);
    const productSnap = await getDoc(productRef);
    if (!productSnap.exists()) {
        return null;
    }
    return docToType<Product>(productSnap);
};

export const getProductsByCollectionId = async (collectionId: string): Promise<Product[]> => {
    const q = query(collection(db, 'products'), where('collectionId', '==', collectionId), where('isVisible', '==', true));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => docToType<Product>(doc));
};

// --- Category Functions ---
export const getCategories = async (): Promise<Category[]> => {
    const categoriesCol = collection(db, 'collections');
    const categoriesSnapshot = await getDocs(categoriesCol);
    const categories = categoriesSnapshot.docs.map(doc => docToType<Category>(doc));

    const productsQuery = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const productsSnapshot = await getDocs(productsQuery);
    const products = productsSnapshot.docs.map(doc => docToType<Product>(doc));

    const categoryImageMap = new Map<string, string>();
    for (const product of products) {
        if (!categoryImageMap.has(product.collectionId)) {
            const imageUrl = product.variants?.[0]?.imageUrls?.[0];
            if (imageUrl) {
                categoryImageMap.set(product.collectionId, imageUrl);
            }
        }
    }

    return categories.map(category => ({
        ...category,
        imageUrl: category.imageUrl || categoryImageMap.get(category.id) || '',
    }));
};
  
export const getCategoryBySlug = async (slug: string): Promise<Category | null> => {
    const categoriesSnapshot = await getDocs(collection(db, 'collections'));
    const categories = categoriesSnapshot.docs.map(doc => docToType<Category>(doc));
    const category = categories.find(c => c.slug === slug);

    if (!category) {
        return null;
    }
    
    if (category.imageUrl) {
        return category;
    }

    const productsQuery = query(
        collection(db, 'products'),
        where('collectionId', '==', category.id),
        where('isVisible', '==', true),
        orderBy('createdAt', 'desc'),
        limit(1)
    );
    const productsSnapshot = await getDocs(productsQuery);

    if (!productsSnapshot.empty) {
        const latestProduct = docToType<Product>(productsSnapshot.docs[0]);
        category.imageUrl = latestProduct.variants?.[0]?.imageUrls?.[0] || '';
    } else {
        category.imageUrl = '';
    }

    return category;
};

export const getCategoryById = async (id: string): Promise<Category | null> => {
    const categoryRef = doc(db, 'collections', id);
    const categorySnap = await getDoc(categoryRef);
    if (!categorySnap.exists()) {
        return null;
    }
    return docToType<Category>(categorySnap);
};
  
// --- User Functions ---
export const getUserById = async (userId: string): Promise<User | null> => {
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
}

export const addAddress = async (userId: string, addressData: Omit<UserAddress, 'id' | 'userId'>): Promise<string> => {
    const addressesCol = collection(db, 'users', userId, 'addresses');
    const docRef = await addDoc(addressesCol, { ...addressData, userId });
    return docRef.id;
}
  
// --- Order Functions ---
export const getOrdersByUserId = async (userId: string): Promise<Order[]> => {
    const q = query(collection(db, 'orders'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => docToType<Order>(doc));
};
  
export const getOrderById = async (id: string): Promise<Order | null> => {
    const orderRef = doc(db, 'orders', id);
    const orderSnap = await getDoc(orderRef);
    if (!orderSnap.exists()) {
        return null;
    }
    return docToType<Order>(orderSnap);
};

export const hasConfirmedOrders = async (): Promise<boolean> => {
    const q = query(collection(db, 'orders'), where('orderStatus', '==', 'confirmed'), limit(1));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
};

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
export const getStoreSettings = async (): Promise<StoreSettings | null> => {
    const settingsRef = doc(db, 'settings', 'details');
    const settingsSnap = await getDoc(settingsRef);
    if (!settingsSnap.exists()) {
        console.warn("Store settings not found in Firestore. Using default/hardcoded values.");
        return {
            id: 'default',
            storeDetails: {
                name: 'My Store',
                heroImageUrl: 'https://picsum.photos/seed/1/1920/1080',
                logoUrl: '',
                email: 'contact@example.com',
                phone: '123-456-7890',
                address: '123 Main Street',
                city: 'Mumbai',
                state: 'Maharashtra',
                pincode: '400001',
            },
            shippingSettings: {
                belowThresholdRate: 50,
                freeShippingThreshold: 1000,
            }
        };
    }
    return docToType<StoreSettings>(settingsSnap);
};


// --- Admin Functions ---

export const getAllProducts = async (): Promise<Product[]> => {
    const productsCol = collection(db, 'products');
    const productsSnapshot = await getDocs(productsCol);
    return productsSnapshot.docs.map(doc => docToType<Product>(doc));
};

export const getAllOrders = async (): Promise<Order[]> => {
    const ordersCol = collection(db, 'orders');
    const ordersSnapshot = await getDocs(ordersCol);
    return ordersSnapshot.docs.map(doc => docToType<Order>(doc));
}

export const getAllUsers = async (): Promise<User[]> => {
    const usersCol = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCol);
    return usersSnapshot.docs.map(doc => docToType<User>(doc));
}
