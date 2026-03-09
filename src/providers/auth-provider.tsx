'use client';

import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signOut, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  updateProfile,
  type User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase/config';
import type { User } from '@/lib/types';
import { getUserById } from '@/lib/data';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => void;
  loading: boolean;
  reloadUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async (fbUser: FirebaseUser | null) => {
    if (fbUser) {
        try {
            const userProfile = await getUserById(fbUser.uid);
            if (userProfile) {
                setUser(userProfile);
            } else {
                 // This case might happen if DB entry creation fails after signup.
                 // We can create it here as a fallback.
                 const userRef = doc(db, 'users', fbUser.uid);
                 const newUser: User = {
                    id: fbUser.uid,
                    email: fbUser.email || '',
                    name: fbUser.displayName || 'New User',
                    role: 'customer',
                    photoURL: fbUser.photoURL || '',
                 };
                 await setDoc(userRef, { 
                    email: newUser.email, 
                    name: newUser.name, 
                    photoURL: newUser.photoURL,
                    role: newUser.role,
                });
                 setUser(newUser);
            }
        } catch (error) {
            console.error("AuthProvider: Failed to fetch user profile:", error);
            // Fallback to a minimal user object on error
            setUser({
                id: fbUser.uid,
                email: fbUser.email || '',
                name: fbUser.displayName || 'New User',
                role: 'customer'
             });
        }
    } else {
        setUser(null);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      await fetchUser(fbUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (name: string, email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const fbUser = userCredential.user;

    await updateProfile(fbUser, { displayName: name });
    
    // Create user document in Firestore
    const userRef = doc(db, 'users', fbUser.uid);
    await setDoc(userRef, {
        name: name,
        email: fbUser.email,
        photoURL: fbUser.photoURL,
        role: 'customer',
    });
    
    // Manually trigger a user fetch to update the context state immediately
    await fetchUser(fbUser);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const fbUser = result.user;

    // Check if user exists in DB, if not create them
    const userRef = doc(db, 'users', fbUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        await setDoc(userRef, {
            name: fbUser.displayName,
            email: fbUser.email,
            photoURL: fbUser.photoURL,
            role: 'customer',
        });
    }
    // Manually trigger a user fetch to update the context state immediately
    await fetchUser(fbUser);
  };


  const logout = async () => {
    await signOut(auth);
  };

  const reloadUser = async () => {
    await fetchUser(firebaseUser);
  }

  const value = { user, firebaseUser, login, signup, signInWithGoogle, logout, loading, reloadUser };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
