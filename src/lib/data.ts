
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
  } from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { Product, Category, User, Order, UserAddress, OrderItem, OrderAddress } from './types';
  
const createSlug = (name: string) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

function docToType<T>(doc: DocumentData): T {
    const data = doc.data();
    const result: { [key: string]: any } = { id: doc.id };

    for (const key in data) {
        if (data.hasOwnProperty(key)) {
            const value = data[key];
            if (value instanceof Timestamp) {
                result[key] = value.toDate().toISOString();
            } else {
                result[key] = value;
            }
        }
    }
    
    // Add slug for products and categories if name exists
    if (data.name && (doc.ref.parent.id === 'products' || doc.ref.parent.id === 'collections')) {
      result.slug = createSlug(data.name);
    }
    
    return result as T;
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
    return categoriesSnapshot.docs.map(doc => docToType<Category>(doc));
};
  
export const getCategoryBySlug = async (slug: string): Promise<Category | null> => {
    const categoriesSnapshot = await getDocs(collection(db, 'collections'));
    const categories = categoriesSnapshot.docs.map(doc => docToType<Category>(doc));
    const category = categories.find(c => c.slug === slug);
    return category || null;
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
