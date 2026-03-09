'use client';

import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/firebase/config';
import type { User } from '@/lib/types';
import { getUserById } from '@/lib/data';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  login: (role: 'admin' | 'customer') => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        // Fetch user profile from Firestore to get role
        const userProfile = await getUserById(fbUser.uid);
        if (userProfile) {
            setUser(userProfile);
        } else {
            // This can happen if the user is in Auth but not in the 'users' collection yet
            // For this demo, we'll create a default user object.
             setUser({
                id: fbUser.uid,
                email: fbUser.email || '',
                name: fbUser.displayName || 'Demo User',
                role: 'customer' // default role
             });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (role: 'admin' | 'customer') => {
    // For demo purposes, using hardcoded credentials.
    // In a real app, you would have a proper login form.
    // IMPORTANT: Make sure these users exist in your Firebase Authentication.
    const email = role === 'admin' ? 'admin@iloventag.com' : 'customer@iloventag.com';
    const password = 'password'; // Use a strong password in production

    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = { user, firebaseUser, login, logout, loading };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
