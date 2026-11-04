'use client';

import React from 'react';
import UserProfileView from '@/components/UserProfileView';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function CurrentUserProfilePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-zinc-400">
        Loading profile...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-center space-y-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Sign in to view your profile</h2>
        <p className="text-xs text-zinc-500">
          Create an account with Discord or Google to keep your movie log, watchlist, and favorites.
          Sign in or create an account to keep your movie log, watchlist, and favorites.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link
            href="/login"
            className="px-4 py-2 text-xs font-semibold rounded-md border border-zinc-300 dark:border-zinc-700" prefetch={false}>
            Log in
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 text-xs font-semibold rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900" prefetch={false}>
            Sign up
          </Link>
        </div>
      </div>
    );
  }

  return <UserProfileView username={user.username} />;
}
