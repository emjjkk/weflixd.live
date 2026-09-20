'use client';

import React, { useState, useEffect } from 'react';
import Image from '@/components/RemoteImage';
import { X, Star, Heart, Calendar, Check } from 'lucide-react';
import { useModal } from '@/context/ModalContext';
import { useMedia } from '@/context/MediaContext';
import { useAuth } from '@/context/AuthContext';
import { derivePalette } from '@/lib/media-utils';

export default function LogWatchedModal() {
  const { logWatchedItem, closeLogWatched, openAuthPrompt, showToast } = useModal();
  const { logWatched, getWatchedItem, toggleFavorite, isFavorite } = useMedia();
  const { user } = useAuth();

  const [rating, setRating] = useState<number>(4);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [watchedDate, setWatchedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [reviewText, setReviewText] = useState<string>('');
  const [markFavorite, setMarkFavorite] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  useEffect(() => {
    if (logWatchedItem) {
      const existing = getWatchedItem(logWatchedItem.id, logWatchedItem.media_type);
      if (existing) {
        setRating(existing.rating);
        setWatchedDate(existing.watched_date);
        setReviewText(existing.review || '');
      } else {
        setRating(4);
        setWatchedDate(new Date().toISOString().split('T')[0]);
        setReviewText('');
      }
      setMarkFavorite(isFavorite(logWatchedItem.id, logWatchedItem.media_type));
      setIsSaved(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [logWatchedItem, getWatchedItem, isFavorite]);

  if (!logWatchedItem) return null;

  const palette = derivePalette(logWatchedItem);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      closeLogWatched();
      openAuthPrompt("Sign in to browse 1000+ movies and TV shows and log what you've watched.");
      return;
    }

    const saved = await logWatched(logWatchedItem, rating, watchedDate, reviewText);
    if (!saved) {
      showToast('Could not save your watchlog. Please try again.');
      return;
    }

    if (markFavorite && !isFavorite(logWatchedItem.id, logWatchedItem.media_type)) {
      toggleFavorite(logWatchedItem);
    } else if (!markFavorite && isFavorite(logWatchedItem.id, logWatchedItem.media_type)) {
      toggleFavorite(logWatchedItem);
    }

    showToast(reviewText.trim() ? 'Rating and review saved successfully.' : 'Rating saved successfully.');
    setIsSaved(true);
    setTimeout(() => {
      closeLogWatched();
    }, 600);
  };

  return (
    <div
      id="log-watched-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={e => {
        if (e.target === e.currentTarget) closeLogWatched();
      }}
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 my-auto p-6 sm:p-8">
        <button
          type="button"
          onClick={closeLogWatched}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-md"
        >
          <X className="w-5 h-5" />
        </button>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Header with poster and title */}
          <div className="flex gap-4 items-center">
            <div className="relative w-16 h-24 rounded overflow-hidden flex-shrink-0 bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
              {logWatchedItem.poster_path && (
                <Image
                  src={logWatchedItem.poster_path}
                  alt={logWatchedItem.title}
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase font-semibold text-zinc-400">Log & Rate</p>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 truncate">
                {logWatchedItem.title}
              </h2>
              <p className="text-xs text-zinc-500">
                {(logWatchedItem.release_date || logWatchedItem.first_air_date || '').slice(0, 4)} ·{' '}
                {logWatchedItem.media_type === 'movie' ? 'Movie' : 'TV Series'}
              </p>
            </div>
          </div>

          {/* Rating out of 5 stars */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Your Rating ({rating} / 5)
            </label>
            <div className="flex items-center gap-1.5 py-1">
              {[1, 2, 3, 4, 5].map(starIndex => {
                const active = (hoverRating !== null ? hoverRating : rating) >= starIndex;
                return (
                  <button
                    key={starIndex}
                    type="button"
                    onClick={() => setRating(starIndex)}
                    onMouseEnter={() => setHoverRating(starIndex)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-1 rounded hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        active ? 'text-amber-400 fill-amber-400' : 'text-zinc-300 dark:text-zinc-700'
                      }`}
                    />
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setRating(0.5)}
                className="text-xs text-zinc-400 ml-2 hover:text-zinc-600"
              >
                0.5
              </button>
            </div>
          </div>

          {/* Watched Date */}
          <div className="space-y-2">
            <label
              htmlFor="watched-date"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
            >
              Watched on
            </label>
            <div className="relative">
              <input
                id="watched-date"
                type="date"
                value={watchedDate}
                onChange={e => setWatchedDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-zinc-100 outline-none focus:border-blue-500"
                required
              />
              <Calendar className="absolute right-3 top-2.5 w-4 h-4 text-zinc-400 pointer-events-none" />
            </div>
          </div>

          {/* Review / Commentary */}
          <div className="space-y-2">
            <label
              htmlFor="review-content"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
            >
              Review / Thoughts (Optional)
            </label>
            <textarea
              id="review-content"
              rows={4}
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              placeholder="What did you think? Share thoughts on the cinematography, acting, pacing..."
              className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none focus:border-blue-500"
            />
          </div>

          {/* Favorite Toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMarkFavorite(!markFavorite)}
              className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-md border transition-colors ${
                markFavorite
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400'
                  : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              <Heart className={`w-4 h-4 ${markFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
              {markFavorite ? 'Favorited' : 'Add to Favorites'}
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={closeLogWatched}
              className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-save-log"
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-md text-white transition-opacity hover:opacity-95"
              style={{ backgroundColor: palette.dominant }}
            >
              {isSaved ? <Check className="w-4 h-4" /> : null}
              <span>{isSaved ? 'Saved to Log!' : 'Save Log'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
