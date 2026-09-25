'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, UserProfile, fetchUserProfileDB, upsertUserProfileDB } from '@/lib/supabase';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, username?: string, displayName?: string) => Promise<void>;
  loginWithDiscord: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function isDiscordAvatarUrl(value: string): boolean {
  try {
    const hostname = new URL(value).hostname;
    return hostname === 'cdn.discordapp.com' || hostname === 'media.discordapp.net' || hostname === 'discordapp.com';
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const profileRequestRef = useRef(0);

  const getFallbackProfile = (authUser: User): UserProfile => {
    const metadata = authUser.user_metadata || {};
    return {
      id: authUser.id,
      username:
        metadata.preferred_username ||
        metadata.user_name ||
        metadata.username ||
        metadata.full_name?.toLowerCase().replace(/\s+/g, '_') ||
        authUser.email?.split('@')[0] ||
        'watcher',
      display_name:
        metadata.display_name ||
        metadata.full_name ||
        metadata.name ||
        metadata.custom_claims?.global_name ||
        'Watcher',
      avatar_url: metadata.avatar_url || metadata.picture || '',
      bio: metadata.bio || 'Movie & TV show enthusiast on Weflixd.',
      provider:
        authUser.app_metadata?.provider === 'discord'
          ? 'discord'
          : authUser.app_metadata?.provider || 'email',
      created_at: authUser.created_at,
    };
  };

  const syncProfile = useCallback(async (authUser: User) => {
    const client = supabase;
    if (!client) return;

    const requestId = ++profileRequestRef.current;
    const dbProfile = await fetchUserProfileDB(authUser.id);

    if (requestId !== profileRequestRef.current) return;

    const fallbackProfile = getFallbackProfile(authUser);
    const profile = dbProfile || fallbackProfile;

    if (!dbProfile) {
      await upsertUserProfileDB(profile);
    }

    if (requestId === profileRequestRef.current) {
      if (dbProfile) {
        const discordAvatarChanged =
          fallbackProfile.provider === 'discord' &&
          Boolean(fallbackProfile.avatar_url) &&
          (!dbProfile.avatar_url || isDiscordAvatarUrl(dbProfile.avatar_url)) &&
          dbProfile.avatar_url !== fallbackProfile.avatar_url;
        const metadataProfile = {
          ...dbProfile,
          username: dbProfile.username || fallbackProfile.username,
          display_name: dbProfile.display_name || fallbackProfile.display_name,
          avatar_url: discordAvatarChanged ? fallbackProfile.avatar_url : dbProfile.avatar_url || fallbackProfile.avatar_url,
          bio: dbProfile.bio || fallbackProfile.bio,
          provider: dbProfile.provider || fallbackProfile.provider,
        };

        setUser(metadataProfile);

        if (discordAvatarChanged) {
          void upsertUserProfileDB({ ...dbProfile, avatar_url: metadataProfile.avatar_url });
        }

        const authMeta = authUser.user_metadata || {};
        const needsMetadataSync =
          (authMeta.username ?? '') !== metadataProfile.username ||
          (authMeta.display_name ?? '') !== metadataProfile.display_name ||
          (authMeta.avatar_url ?? '') !== metadataProfile.avatar_url ||
          (authMeta.bio ?? '') !== metadataProfile.bio;

        if (needsMetadataSync) {
          try {
            await client.auth.updateUser({
              data: {
                username: metadataProfile.username,
                display_name: metadataProfile.display_name,
                avatar_url: metadataProfile.avatar_url,
                bio: metadataProfile.bio,
              },
            });
          } catch {
            // ignore metadata sync failures; DB is the source of truth.
          }
        }
        return;
      }

      setUser(profile);
    }
  }, []);

  useEffect(() => {
    // Clean up any legacy manual localStorage user session keys
    try {
      localStorage.removeItem('watchers_user');
    } catch {
      // ignore
    }

    if (!supabase) {
      setIsLoading(false);
      return;
    }

    // Load active session from Supabase
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      try {
        if (session?.user) {
          await syncProfile(session.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.warn('Error fetching Supabase session user profile:', err);
      } finally {
        setIsLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && ['INITIAL_SESSION', 'SIGNED_IN', 'TOKEN_REFRESHED'].includes(event)) {
        void syncProfile(session.user);
      } else if (event === 'SIGNED_OUT') {
        profileRequestRef.current += 1;
        setUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [syncProfile]);

  const loginWithEmail = async (email: string, password: string) => {
    setIsLoading(true);
    if (!supabase) {
      setIsLoading(false);
      throw new Error('Supabase client is not configured.');
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw error;
      }

      if (data?.user) {
        await syncProfile(data.user);
      }
    } catch (err) {
      setIsLoading(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    username?: string,
    displayName?: string
  ) => {
    setIsLoading(true);
    if (!supabase) {
      setIsLoading(false);
      throw new Error('Supabase client is not configured.');
    }

    try {
      const cleanEmail = email.trim();
      const cleanUsername = (username || cleanEmail.split('@')[0])
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '');
      const cleanDisplayName = (displayName || cleanUsername || 'Watcher').trim();

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            username: cleanUsername,
            display_name: cleanDisplayName,
          },
        },
      });

      if (error) {
        throw error;
      }

      let sessionUser = data.user;

      // Direct sign-in to skip verification
      if (!data.session && sessionUser) {
        try {
          const signInRes = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });
          if (signInRes.data?.user) {
            sessionUser = signInRes.data.user;
          }
        } catch {
          // Continue with sessionUser
        }
      }

      if (sessionUser) {
        const profile: UserProfile = {
          id: sessionUser.id,
          username: cleanUsername || 'watcher',
          display_name: cleanDisplayName || 'Watcher',
          avatar_url: '',
          bio: 'Movie & TV show enthusiast on Weflixd.',
          provider: 'email',
          created_at: sessionUser.created_at || new Date().toISOString(),
        };

        const savedProfile = await upsertUserProfileDB(profile);
        if (!savedProfile) {
          throw new Error('Your account was created, but your profile could not be saved.');
        }

        try {
          await supabase.auth.updateUser({
            data: {
              username: savedProfile.username,
              display_name: savedProfile.display_name,
              avatar_url: savedProfile.avatar_url,
              bio: savedProfile.bio,
            },
          });
        } catch {
          // Keep the database profile as the canonical source of truth.
        }

        profileRequestRef.current += 1;
        setUser(savedProfile);
      }
    } catch (err) {
      setIsLoading(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithDiscord = async () => {
    setIsLoading(true);
    if (!supabase) {
      setIsLoading(false);
      throw new Error('Supabase client is not configured.');
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
        },
      });
      if (error) {
        throw error;
      }
    } catch (err) {
      setIsLoading(false);
      console.error('Supabase Discord OAuth error:', err);
      throw err;
    }
  };

  const logout = async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }
    setUser(null);
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<boolean> => {
    if (!user) return false;
    const updated = { ...user, ...updates };

    if (supabase && user.id) {
      try {
        const savedProfile = await upsertUserProfileDB({
          id: user.id,
          username: updated.username,
          display_name: updated.display_name,
          avatar_url: updated.avatar_url,
          banner_image: updated.banner_image,
          bio: updated.bio,
          provider: updated.provider,
        });
        if (!savedProfile) return false;

        profileRequestRef.current += 1;
        setUser(savedProfile);

        // Keep auth metadata aligned with the persisted profile so session hydration
        // does not fall back to stale default values after a refresh or page hop.
        await supabase.auth.updateUser({
          data: {
            username: savedProfile.username,
            display_name: savedProfile.display_name,
            avatar_url: savedProfile.avatar_url,
            banner_image: savedProfile.banner_image || '',
            bio: savedProfile.bio,
          },
        }).catch(() => {});

        return true;
      } catch (err) {
        console.warn('Failed to save profile updates to database:', err);
        return false;
      }
    }
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        loginWithEmail,
        signUpWithEmail,
        loginWithDiscord,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
