'use client';

import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '@/lib/types';
import { getUserByEmail } from '@/lib/data';

interface AuthContextType {
  user: User | null;
  login: (role: 'admin' | 'customer') => void;
  logout: () => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    } catch (error) {
        console.error("Failed to parse user from localStorage", error);
    } finally {
        setLoading(false);
    }
  }, []);

  const login = (role: 'admin' | 'customer') => {
    const email = role === 'admin' ? 'admin@iloventag.com' : 'customer@iloventag.com';
    const userToLogin = getUserByEmail(email);
    if (userToLogin) {
      setUser(userToLogin);
      localStorage.setItem('user', JSON.stringify(userToLogin));
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const value = { user, login, logout, loading };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
