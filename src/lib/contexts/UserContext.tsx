'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useUserSync } from '../hooks/useUserSync';
import type { User, UserPreferences, Profile } from '../types';

interface UserContextType {
  clerkUser: any; // Using any for now to avoid Clerk type conflicts
  dbUser: User | null;
  profile: Profile | null;
  userPreferences: UserPreferences | null;
  isLoaded: boolean;
  isInitialized: boolean;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<UserPreferences | null>;
  trackEvent: (eventName: string, properties?: Record<string, any>) => Promise<boolean>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const userSync = useUserSync();

  return (
    <UserContext.Provider value={userSync}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
}

// Convenience hooks
export function useDbUser() {
  const { dbUser } = useUserContext();
  return dbUser;
}

export function useUserPreferences() {
  const { userPreferences, updatePreferences } = useUserContext();
  return { userPreferences, updatePreferences };
}

export function useAnalytics() {
  const { trackEvent } = useUserContext();
  return { trackEvent };
}
