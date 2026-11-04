'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MOVIE_GENRES, TV_GENRES } from '@/lib/data/genres';

export default function GenresGrid() {
  const [tab, setTab] = useState<'movie' | 'tv'>('movie');
  const genres = tab === 'movie' ? MOVIE_GENRES : TV_GENRES;

  return (
    <section className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Browse by Genre
          </h2>
          <p className="text-xs text-zinc-500">
            Discover films and television by your favorite storytelling style
          </p>
        </div>

        <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800 rounded-md">
          <button
            type="button"
            onClick={() => setTab('movie')}
            className={`px-3 py-1 text-xs font-semibold rounded ${
              tab === 'movie'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Movies
          </button>
          <button
            type="button"
            onClick={() => setTab('tv')}
            className={`px-3 py-1 text-xs font-semibold rounded ${
              tab === 'tv'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            TV Shows
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
        {genres.map(genre => (
          <Link
            key={genre.id}
            href={`/${tab}?genres=${genre.slug}&page=1`}
            className="flex items-center justify-center p-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium text-zinc-800 dark:text-zinc-200 transition-colors shadow-xs" prefetch={false}>
            {genre.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
