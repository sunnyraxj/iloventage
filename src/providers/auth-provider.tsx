'use client';

import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/firebase/config';
import type { User } from '@/lib/types';
import { getUserById } from '@/lib/data';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  login: (email: string, password: string) => Promise<void>;
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
                 // Create a default user profile if one doesn't exist in the DB
                 setUser({
                    id: fbUser.uid,
                    email: fbUser.email || '',
                    name: fbUser.displayName || 'New User',
                    role: 'customer'
                 });
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

  const logout = async () => {
    await signOut(auth);
  };

  const reloadUser = async () => {
    await fetchUser(firebaseUser);
  }

  const value = { user, firebaseUser, login, logout, loading, reloadUser };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
