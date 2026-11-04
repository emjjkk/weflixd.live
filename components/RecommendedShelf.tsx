'use client';

import React, { useState, useEffect } from 'react';
import HorizontalShelf from './HorizontalShelf';
import { useAuth } from '@/context/AuthContext';
import { useMedia } from '@/context/MediaContext';
import { MediaItem } from '@/lib/types';
import { FavoriteItem, WatchedItem, WatchlistItem } from '@/lib/supabase';
import Link from 'next/link';

type RecommendationSeed = {
  media_id: number;
  media_type: 'movie' | 'tv';
  weight: number;
};

function buildRecommendationSeeds(
  favorites: FavoriteItem[],
  watchedLog: WatchedItem[],
  watchlist: WatchlistItem[]
): RecommendationSeed[] {
  const seeds = new Map<string, RecommendationSeed>();

  const addSeed = (mediaId: number, mediaType: 'movie' | 'tv', weight: number) => {
    const key = `${mediaType}-${mediaId}`;
    const existing = seeds.get(key);
    seeds.set(key, { media_id: mediaId, media_type: mediaType, weight: (existing?.weight || 0) + weight });
  };

  favorites.forEach(item => {
    if (item.media_type !== 'person') addSeed(item.media_id, item.media_type, 5);
  });
  watchedLog.forEach(item => addSeed(item.media_id, item.media_type, item.rating >= 4 ? 4 : item.rating >= 3 ? 2 : 0.5));
  watchlist.forEach(item => addSeed(item.media_id, item.media_type, 3));

  return Array.from(seeds.values()).sort((a, b) => b.weight - a.weight).slice(0, 6);
}

export default function RecommendedShelf() {
  const { user } = useAuth();
  const { watchedLog, watchlist, favorites } = useMedia();
  const [recommended, setRecommended] = useState<MediaItem[]>([]);

  useEffect(() => {
    if (!user) {
      setRecommended([]);
      return;
    }

    let isMounted = true;
    const seeds = buildRecommendationSeeds(favorites, watchedLog, watchlist);
    const excludedIds = new Set(
      [...watchedLog, ...watchlist, ...favorites]
        .filter(item => item.media_type !== 'person')
        .map(item => `${item.media_type}-${item.media_id}`)
    );

    const loadRecommendations = async () => {
      try {
        const responses = await Promise.all(
          seeds.map(seed => fetch(`/api/tmdb/recommendations?type=${seed.media_type}&id=${seed.media_id}`).then(r => r.json()))
        );
        if (!isMounted) return;

        const scores = new Map<string, { item: MediaItem; score: number }>();
        responses.forEach((response, index) => {
          const seed = seeds[index];
          (response?.results || []).forEach((item: MediaItem, resultIndex: number) => {
            const key = `${item.media_type}-${item.id}`;
            if (excludedIds.has(key)) return;
            const score = seed.weight * 100 + item.popularity + Math.max(0, item.vote_average - 6) * 5 - resultIndex;
            const existing = scores.get(key);
            if (!existing || score > existing.score) scores.set(key, { item, score });
          });
        });

        setRecommended(Array.from(scores.values()).sort((a, b) => b.score - a.score).slice(0, 8).map(entry => entry.item));
      } catch {
        if (isMounted) setRecommended([]);
      }
    };

    if (seeds.length > 0) {
      loadRecommendations();
    } else {
      fetch('/api/tmdb/discover?type=movie&page=1&sort_by=popularity.desc')
        .then(response => response.json())
        .then(data => {
          if (isMounted) setRecommended((data?.results || []).slice(0, 8));
        })
        .catch(() => {
          if (isMounted) setRecommended([]);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [user, watchedLog, watchlist, favorites]);

  if (!user) {
    return (
      <section className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Personalized Recommendations
            </h3>
          </div>
          <p className="text-xs text-zinc-500 max-w-md">
            Sign in to start logging what you watch, building your watchlist, and getting custom recommendations tuned to your taste.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/login"
            className="px-4 py-2 text-xs font-semibold rounded-md border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800" prefetch={false}>
            Log in
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 text-xs font-semibold rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white" prefetch={false}>
            Sign up
          </Link>
        </div>
      </section>
    );
  }

  if (recommended.length === 0) {
    return null;
  }

  return (
    <HorizontalShelf
      id="recommended-shelf"
      title={`Recommended for @${user.username}`}
      subtitle="Based on your watched titles, ratings, and active watchlist"
      items={recommended}
    />
  );
}
