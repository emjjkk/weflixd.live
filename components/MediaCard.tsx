'use client';

import React from 'react';
import Image from '@/components/RemoteImage';
import { Star, Bookmark, Eye, Check } from 'lucide-react';
import { MediaItem } from '@/lib/types';
import { useModal } from '@/context/ModalContext';
import { useMedia } from '@/context/MediaContext';
import { useAuth } from '@/context/AuthContext';

interface MediaCardProps {
  media: MediaItem;
  className?: string;
  showQuickViewOnClick?: boolean;
}

export default function MediaCard({ media, className = '', showQuickViewOnClick = true }: MediaCardProps) {
  const { openQuickView, openAuthPrompt } = useModal();
  const { isWatchlisted, toggleWatchlist, isWatched } = useMedia();
  const { user } = useAuth();

  const inWatchlist = isWatchlisted(media.id, media.media_type);
  const watched = isWatched(media.id, media.media_type);
  const year = (media.release_date || media.first_air_date || '').slice(0, 4);
  const ratingOutOfFive = (media.vote_average / 2).toFixed(1);

  const handleClick = async (e: React.MouseEvent) => {
    if (showQuickViewOnClick) {
      e.preventDefault();
      if (media.overview) {
        openQuickView(media);
        return;
      }

      try {
        const response = await fetch(`/api/tmdb/${media.media_type}/${media.id}`);
        if (response.ok) {
          const detailedMedia = (await response.json()) as MediaItem | null;
          if (detailedMedia) {
            openQuickView(detailedMedia);
            return;
          }
        }
      } catch {
        // Open the saved summary if the detail request is unavailable.
      }

      openQuickView(media);
    }
  };

  const handleWatchlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      openAuthPrompt('Sign in to browse 1000+ movies and TV shows and add titles to your personal watchlist.');
      return;
    }
    toggleWatchlist(media);
  };

  return (
    <div
      id={`media-card-${media.media_type}-${media.id}`}
      onClick={handleClick}
      className={`group relative flex flex-col cursor-pointer transition-all duration-200 ${className}`}
    >
      {/* Poster Container */}
      <div className="relative aspect-[2/3] w-full rounded-md overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 group-hover:border-zinc-300 dark:group-hover:border-zinc-700 shadow-xs">
        {media.poster_path ? (
          <Image
            src={media.poster_path}
            alt={media.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-zinc-400 p-2 text-center">
            {media.title}
          </div>
        )}

        {/* Top Badges: Media Type & Watched Status */}
        <div className="absolute top-2 left-2 flex items-center gap-1 z-10">
          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-950/70 text-zinc-200 backdrop-blur-xs">
            {media.media_type === 'movie' ? 'Movie' : 'TV'}
          </span>
          {watched && (
            <span className="p-1 rounded bg-emerald-600/90 text-white backdrop-blur-xs" title="Logged as watched">
              <Check className="w-3 h-3" />
            </span>
          )}
        </div>

        {/* Top-Right Quick Watchlist Toggle Button */}
        <button
          type="button"
          onClick={handleWatchlistClick}
          className={`absolute top-2 right-2 p-1.5 rounded-md backdrop-blur-sm z-10 transition-colors ${
            inWatchlist
              ? 'bg-amber-500 text-white'
              : 'bg-zinc-950/60 text-zinc-300 hover:text-white opacity-0 group-hover:opacity-100'
          }`}
          title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
        >
          <Bookmark className={`w-3.5 h-3.5 ${inWatchlist ? 'fill-white' : ''}`} />
        </button>

        {/* Quick View Hover Indicator */}
        <div className="absolute inset-0 bg-zinc-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded bg-zinc-900/90 text-white border border-zinc-700 shadow-lg">
            <Eye className="w-3.5 h-3.5" />
            Quick View
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="mt-2 space-y-0.5">
        <h4 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {media.title}
        </h4>
        <div className="flex items-center justify-between text-[11px] text-zinc-500">
          <span>{year || '—'}</span>
          <div
            className="flex items-center gap-1 font-medium text-zinc-700 dark:text-zinc-300"
            title="TMDB Rating"
          >
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tight">TMDB</span>
            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
            <span>{ratingOutOfFive}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
