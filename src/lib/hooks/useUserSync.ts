'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { DatabaseService } from '../services/database';
import type { User, UserPreferences } from '../types';

export function useUserSync() {
  const { user: clerkUser, isLoaded } = useUser();
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    async function syncUser() {
      if (!isLoaded || !clerkUser) {
        setIsInitialized(true);
        return;
      }

      try {
        // Create or update user in Supabase
        const userData = {
          email: clerkUser.primaryEmailAddress?.emailAddress || '',
          first_name: clerkUser.firstName || '',
          last_name: clerkUser.lastName || '',
          avatar_url: clerkUser.imageUrl || '',
        };

        const user = await DatabaseService.createOrUpdateUser(clerkUser.id, userData);
        setDbUser(user);

        // Load user preferences
        if (user) {
          const preferences = await DatabaseService.getUserPreferences(user.id);
          setUserPreferences(preferences);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Error syncing user:', error);
        setIsInitialized(true);
      }
    }

    syncUser();
  }, [clerkUser, isLoaded]);

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!dbUser) return null;

    try {
      const updatedPreferences = await DatabaseService.updateUserPreferences(
        dbUser.id,
        updates
      );
      setUserPreferences(updatedPreferences);
      return updatedPreferences;
    } catch (error) {
      console.error('Error updating preferences:', error);
      return null;
    }
  };

  const trackEvent = async (eventName: string, properties?: Record<string, any>) => {
    if (!dbUser) return false;

    try {
      await DatabaseService.trackEvent({
        user_id: dbUser.id,
        event_name: eventName,
        properties,
        page_url: window?.location?.href,
        user_agent: navigator?.userAgent,
      });
      return true;
    } catch (error) {
      console.error('Error tracking event:', error);
      return false;
    }
  };

  return {
    clerkUser,
    dbUser,
    userPreferences,
    isLoaded,
    isInitialized,
    updatePreferences,
    trackEvent,
  };
}