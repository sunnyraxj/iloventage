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
  } from 'firebase/firestore';
  import { db } from '@/firebase/config';
  import type { Product, Category, User, Order } from './types';
  
  // NOTE: This file assumes you have populated your Firestore database
  // with collections named 'products', 'categories', 'users', and 'orders'.
  // The structure of the documents should match the types in src/lib/types.ts.
  // For product images, it's assumed the 'images' field is an array of URLs
  // pointing to images in Firebase Storage.
  
  // Helper to convert Firestore doc to a specific type
  function docToType<T>(doc: any): T {
      const data = doc.data();
      return {
          id: doc.id,
          ...data,
          // Convert Firestore Timestamps to ISO strings
          createdAt: data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
      } as T;
  }
  
  
  // --- Product Functions ---
  export const getProducts = async (): Promise<Product[]> => {
    const productsCol = collection(db, 'products');
    const productsSnapshot = await getDocs(productsCol);
    return productsSnapshot.docs.map(doc => docToType<Product>(doc));
  };
  
  export const getProductBySlug = async (slug: string): Promise<Product | null> => {
    const q = query(collection(db, 'products'), where('slug', '==', slug), limit(1));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }
    return docToType<Product>(querySnapshot.docs[0]);
  };
  
  export const getFeaturedProducts = async (): Promise<Product[]> => {
    const q = query(collection(db, 'products'), where('featured', '==', true));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => docToType<Product>(doc));
  };
  
  export const getProductsByCategory = async (categorySlug: string): Promise<Product[]> => {
      const q = query(collection(db, 'products'), where('category', '==', categorySlug));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => docToType<Product>(doc));
  };
  
  export const addProduct = async (productData: Omit<Product, 'id'>) => {
      const productsCol = collection(db, 'products');
      const docRef = await addDoc(productsCol, {
          ...productData,
          createdAt: serverTimestamp()
      });
      return docRef.id;
  }
  
  export const updateProduct = async (productId: string, productData: Partial<Product>) => {
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, productData);
  }
  
  
  // --- Category Functions ---
  export const getCategories = async (): Promise<Category[]> => {
    const categoriesCol = collection(db, 'categories');
    const categoriesSnapshot = await getDocs(categoriesCol);
    return categoriesSnapshot.docs.map(doc => docToType<Category>(doc));
  };
  
  export const getCategoryBySlug = async (slug: string): Promise<Category | null> => {
      const q = query(collection(db, 'categories'), where('slug', '==', slug), limit(1));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
          return null;
      }
      return docToType<Category>(querySnapshot.docs[0]);
  };
  
  export const addCategory = async (categoryData: { name: string, slug: string }) => {
    const categoriesCol = collection(db, 'categories');
    // Check if category with this slug already exists to prevent duplicates
    const q = query(categoriesCol, where('slug', '==', categoryData.slug), limit(1));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        await addDoc(categoriesCol, {
            ...categoryData,
            image: '', // default empty image
            createdAt: serverTimestamp()
        });
    }
  }

  // --- User Functions ---
  export const getUserById = async (userId: string): Promise<User | null> => {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
          return null;
      }
      return docToType<User>(userSnap);
  }
  
  
  // --- Order Functions ---
  export const getOrders = async (): Promise<Order[]> => {
      const ordersCol = collection(db, 'orders');
      const ordersSnapshot = await getDocs(ordersCol);
      return ordersSnapshot.docs.map(doc => docToType<Order>(doc));
  };
  
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
  
  export const addOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'orderStatus'>): Promise<Order> => {
      const newOrderData = {
          ...orderData,
          createdAt: serverTimestamp(),
          orderStatus: 'Confirmed' as const,
      };
      const docRef = await addDoc(collection(db, "orders"), newOrderData);
  
      return {
          ...orderData,
          id: docRef.id,
          createdAt: new Date().toISOString(),
          orderStatus: 'Confirmed' as const,
      };
  };
