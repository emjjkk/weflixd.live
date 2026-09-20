'use client';

import React, { useEffect } from 'react';
import Image from '@/components/RemoteImage';
import Link from 'next/link';
import { X, Star, Bookmark, Check, ArrowRight, Eye, Play, ExternalLink } from 'lucide-react';
import { useModal } from '@/context/ModalContext';
import { useMedia } from '@/context/MediaContext';
import { useAuth } from '@/context/AuthContext';
import { derivePalette } from '@/lib/media-utils';
import { getWatchProviderUrl } from '@/lib/providers';

export default function QuickViewModal() {
  const { quickViewItem, closeQuickView, openLogWatched, openTrailer, openAuthPrompt, showToast } = useModal();
  const { isWatchlisted, toggleWatchlist, isWatched, getReviewsForMedia } = useMedia();
  const { user } = useAuth();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeQuickView();
    };
    if (quickViewItem) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [quickViewItem, closeQuickView]);

  if (!quickViewItem) return null;

  const inWatchlist = isWatchlisted(quickViewItem.id, quickViewItem.media_type);
  const watched = isWatched(quickViewItem.id, quickViewItem.media_type);
  const palette = derivePalette(quickViewItem);
  const year = (quickViewItem.release_date || quickViewItem.first_air_date || '').slice(0, 4);
  const detailLink = `/${quickViewItem.media_type}/${quickViewItem.id}`;
  const providers = quickViewItem.watch_providers;

  // Community / Site rating calculation
  const reviews = getReviewsForMedia(quickViewItem.id, quickViewItem.media_type);
  const ratedReviews = reviews.filter(r => typeof r.rating === 'number' && r.rating > 0);
  const siteAverage =
    ratedReviews.length > 0
      ? (ratedReviews.reduce((sum, r) => sum + r.rating, 0) / ratedReviews.length).toFixed(1)
      : null;

  const handleWatchlist = () => {
    if (!user) {
      closeQuickView();
      openAuthPrompt('Sign in to browse 1000+ movies and TV shows and add titles to your personal watchlist.');
      return;
    }
    toggleWatchlist(quickViewItem);
    showToast(inWatchlist ? 'Removed from your watchlist.' : 'Added to your watchlist.');
  };

  const handleWatched = () => {
    if (!user) {
      closeQuickView();
      openAuthPrompt("Sign in to browse 1000+ movies and TV shows and log what you've watched.");
      return;
    }
    closeQuickView();
    openLogWatched(quickViewItem);
  };

  return (
    <div
      id="quick-view-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-150"
      onClick={e => {
        if (e.target === e.currentTarget) closeQuickView();
      }}
    >
      <div className="relative w-full max-w-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 my-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={closeQuickView}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/80 hover:bg-white text-zinc-900 dark:bg-zinc-900/60 dark:hover:bg-zinc-900 dark:text-white backdrop-blur-sm transition-colors shadow-xs"
          title="Close modal (Esc)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Backdrop Banner */}
        <div className="relative w-full h-56 sm:h-72 bg-zinc-100 dark:bg-zinc-900">
          {quickViewItem.backdrop_path ? (
            <Image
              src={quickViewItem.backdrop_path}
              alt={quickViewItem.title}
              fill
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-600">
              No Backdrop
            </div>
          )}
          {/* Subtle gradient overlay to smoothly transition into content */}
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent dark:from-zinc-900 dark:via-zinc-900/40 dark:to-transparent" />

          {/* Quick trailer button if trailer exists */}
          {quickViewItem.trailers && quickViewItem.trailers.length > 0 && (
            <button
              type="button"
              onClick={() => openTrailer(quickViewItem.trailers![0].key)}
              className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/90 hover:bg-white text-zinc-900 dark:bg-zinc-900/80 dark:hover:bg-zinc-900 dark:text-white text-xs font-semibold backdrop-blur-sm border border-zinc-200 dark:border-zinc-700 shadow-xs transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Watch Trailer
            </button>
          )}
        </div>

        {/* Content Section */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Poster Thumbnail */}
            <div className="relative -mt-20 sm:-mt-24 w-28 sm:w-36 aspect-[2/3] rounded-lg overflow-hidden border-2 border-white dark:border-zinc-900 shadow-xl flex-shrink-0 bg-zinc-100 dark:bg-zinc-800">
              {quickViewItem.poster_path && (
                <Image
                  src={quickViewItem.poster_path}
                  alt={quickViewItem.title}
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>

            {/* Header info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs uppercase font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                  {quickViewItem.media_type === 'movie' ? 'Movie' : 'TV Series'}
                </span>
                {year && <span className="text-xs text-zinc-500">{year}</span>}
                {quickViewItem.runtime && (
                  <span className="text-xs text-zinc-500">· {quickViewItem.runtime}m</span>
                )}
                {quickViewItem.number_of_seasons && (
                  <span className="text-xs text-zinc-500">
                    · {quickViewItem.number_of_seasons} Seasons
                  </span>
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl font-regular text-zinc-900 dark:text-zinc-50 mt-1 tracking-tight">
                {quickViewItem.title}
              </h2>

              {quickViewItem.tagline && (
                <p className="text-xs italic text-zinc-500 mt-1">&ldquo;{quickViewItem.tagline}&rdquo;</p>
              )}

              {/* Rating and Genres */}
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                {/* TMDB Rating */}
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700"
                  title="TMDB Rating"
                >
                  <span className="text-[10px] font-black uppercase tracking-wider px-1 py-0.5 rounded bg-amber-500 text-zinc-950">
                    TMDB
                  </span>
                  <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                    <Star className="w-3.5 h-3.5 fill-amber-500" />
                    <span>{quickViewItem.vote_average ? quickViewItem.vote_average.toFixed(1) : '—'}</span>
                    <span className="text-[10px] text-zinc-400 font-normal">/ 10</span>
                  </div>
                  <span className="text-[10px] text-zinc-400">
                    ({quickViewItem.vote_count ? quickViewItem.vote_count.toLocaleString() : 0})
                  </span>
                </div>

                {/* Site Community Rating */}
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700"
                  title="Weflixd Member Rating"
                >
                  <span className="text-[10px] font-black uppercase tracking-wider px-1 py-0.5 rounded bg-blue-500 text-white">
                    Weflixd
                  </span>
                  {siteAverage ? (
                    <div className="flex items-center gap-1 text-blue-500 dark:text-blue-400 font-bold text-xs">
                      <Star className="w-3.5 h-3.5 fill-blue-500" />
                      <span>{siteAverage}</span>
                      <span className="text-[10px] text-zinc-400 font-normal">/ 5</span>
                      <span className="text-[10px] text-zinc-400 font-normal">({ratedReviews.length})</span>
                    </div>
                  ) : (
                    <span className="text-zinc-400 text-xs">No reviews</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {quickViewItem.genres?.map(g => (
                    <span
                      key={g.id}
                      className="text-xs font-medium px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                    >
                      {g.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Overview */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Overview
            </h3>
            <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {quickViewItem.overview}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Watchlist button */}
              <button
                type="button"
                id="modal-btn-watchlist"
                onClick={handleWatchlist}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
                  inWatchlist
                    ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400'
                    : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${inWatchlist ? 'fill-amber-500' : ''}`} />
                {inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
              </button>

              {/* I've Watched This button */}
              <button
                type="button"
                id="modal-btn-watched"
                onClick={handleWatched}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
                  watched
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {watched ? <Check className="w-4 h-4 text-emerald-500" /> : <Eye className="w-4 h-4" />}
                {watched ? "Watched (Edit Log)" : "I've Watched This"}
              </button>
            </div>

            {/* Learn More button */}
            <Link
              href={detailLink}
              id="modal-btn-learn-more"
              onClick={closeQuickView}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-md text-white shadow-xs transition-opacity hover:opacity-90"
              style={{ backgroundColor: palette.dominant }}
            >
              <span>Learn More</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
