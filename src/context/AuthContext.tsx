import React, { useState, useEffect, useCallback } from 'react';
import type { User as CustomUser, UserRole } from '@/types';
import { listenForAuthChanges } from '@/services/firebase-services';
import { AuthContext, type AuthContextType } from './AuthContextType'; // Import from our new file

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = useCallback((newUser: CustomUser) => {
    setUser(newUser);
    localStorage.setItem('fixedFundingUser', JSON.stringify(newUser));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('fixedFundingUser');
  }, []);
useEffect(() => {
  const unsubscribe = listenForAuthChanges((firebaseUser) => {
    if (firebaseUser) {
      setUser(firebaseUser as unknown as CustomUser);
    } else {
      const savedUser = localStorage.getItem('fixedFundingUser');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      } else {
        setUser(null); // Explicitly set null if no user found
      }
    }
    // CRITICAL: Ensure this is called every single time
    setIsLoading(false); 
  });

  return unsubscribe;
}, []);

  const hasRole = useCallback((roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  }, [user]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}