import React from 'react';
import MediaDetailPageClient from '@/components/MediaDetailPageClient';
import type { Metadata } from 'next';

interface MoviePageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-static';
export const metadata: Metadata = { title: 'Movie details | Weflixd' };

export default function MovieDetailPage() {
  return <MediaDetailPageClient mediaType="movie" />;
}
