import React from 'react';
import PersonDetailPageClient from '@/components/PersonDetailPageClient';
import type { Metadata } from 'next';

interface PersonPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'People | Weflixd' };

export default function PersonPage() {
  return <PersonDetailPageClient />;
}
