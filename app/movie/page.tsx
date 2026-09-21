import React, { Suspense } from 'react';
import MediaCatalog from '@/components/MediaCatalog';
import { MOVIE_GENRES } from '@/lib/data/genres';
import { getPopularMovies } from '@/lib/tmdb';
import type { Metadata } from 'next';
import { createMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = createMetadata({
  title: 'Explore Movies',
  description: 'Browse popular movies, new releases, genres, ratings, reviews, and watchlists on Weflixd.',
  path: '/movie',
});

export default async function MoviesPage() {
  const popular = await getPopularMovies();

  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto p-8 text-center text-zinc-400">Loading movies catalog...</div>}>
      <MediaCatalog
        type="movie"
        title="Explore Movies"
        description="Browse, filter, and track feature films from across cinematic history."
        genres={MOVIE_GENRES}
        initialItems={popular.results}
        totalPages={popular.total_pages || 1}
      />
    </Suspense>
  );
}
