import React from 'react';
import MediaDetailPageClient from '@/components/MediaDetailPageClient';
import type { Metadata } from 'next';

interface TVPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'TV show details | Weflixd' };

export default function TVDetailPage() {
  return <MediaDetailPageClient mediaType="tv" />;
}
