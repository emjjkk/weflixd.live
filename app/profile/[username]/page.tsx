import React from 'react';
import UserProfileView from '@/components/UserProfileView';
import type { Metadata } from 'next';

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Profile | Weflixd' };

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  return <UserProfileView username={username} />;
}
