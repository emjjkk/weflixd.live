import React, { Suspense } from 'react';
import MediaCatalog from '@/components/MediaCatalog';
import { TV_GENRES } from '@/lib/data/genres';
import { getPopularTV } from '@/lib/tmdb';
import type { Metadata } from 'next';
import { createMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = createMetadata({
  title: 'Explore TV Shows',
  description: 'Discover popular TV shows, new series, genres, ratings, reviews, and watchlists on Weflixd.',
  path: '/tv',
});

export default async function TVShowsPage() {
  const popular = await getPopularTV();

  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto p-8 text-center text-zinc-400">Loading TV catalog...</div>}>
      <MediaCatalog
        type="tv"
        title="Explore TV Shows"
        description="Discover prestige dramas, comedy series, sci-fi epics, and limited releases."
        genres={TV_GENRES}
        initialItems={popular.results}
        totalPages={popular.total_pages || 1}
      />
    </Suspense>
  );
}
