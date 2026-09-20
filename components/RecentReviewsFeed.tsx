'use client';

import React from 'react';
import Link from 'next/link';
import Image from '@/components/RemoteImage';
import { Star, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { useMedia } from '@/context/MediaContext';

export default function RecentReviewsFeed() {
  const { reviews, voteReview } = useMedia();

  return (
    <section className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Recent Reviews From The Community
          </h2>
          <p className="text-xs text-zinc-500">
            Fresh takes, critiques, and logs from film and TV watchers
          </p>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="p-8 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center space-y-3 shadow-xs">
          <div className="inline-flex p-3 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              No community reviews yet
            </p>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              Be the first to rate and log your thoughts on any movie or TV show. Your reviews will appear here in real time.
            </p>
          </div>
          <div className="pt-1">
            <Link
              href="/movie"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white transition-colors"
            >
              Browse Movies to Review
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.slice(0, 4).map(rev => {
          const ratingStars = Math.floor(rev.rating);
          const hasHalfStar = rev.rating % 1 !== 0;

          return (
            <div
              key={rev.id}
              className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between space-y-3 shadow-xs"
            >
              {/* Header: User + Title + Stars */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Link
                    href={`/profile/${rev.username}`}
                    className="relative w-8 h-8 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700 flex-shrink-0"
                  >
                    <Image
                      src={rev.user_avatar || rev.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                      alt={rev.username}
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </Link>
                  <div className="min-w-0">
                    <Link
                      href={`/profile/${rev.username}`}
                      className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:underline truncate block"
                    >
                      @{rev.username}
                    </Link>
                    <p className="text-[11px] text-zinc-400">
                      Watched {rev.watched_date || 'recently'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <Link
                    href={`/${rev.media_type}/${rev.media_id}`}
                    className="text-xs font-bold text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 block truncate max-w-[150px]"
                  >
                    {rev.media_title}
                  </Link>
                  <div className="flex items-center justify-end text-amber-500 mt-0.5">
                    {[...Array(ratingStars)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-500" />
                    ))}
                    {hasHalfStar && <span className="text-[10px] ml-0.5">½</span>}
                    <span className="text-[10px] text-zinc-500 ml-1 font-medium">
                      {rev.rating}/5
                    </span>
                  </div>
                </div>
              </div>

              {/* Review Text */}
              <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300 line-clamp-3">
                &ldquo;{rev.content}&rdquo;
              </p>

              {/* Footer: Votes & Detail Link */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500">
                <div className="flex items-center gap-3">
                  {/* Upvote button */}
                  <button
                    type="button"
                    onClick={() => voteReview(rev.id, 'up')}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${
                      rev.user_vote === 'up'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-semibold'
                        : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${rev.user_vote === 'up' ? 'fill-emerald-600' : ''}`} />
                    <span>{rev.upvotes}</span>
                  </button>

                  {/* Downvote button */}
                  <button
                    type="button"
                    onClick={() => voteReview(rev.id, 'down')}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${
                      rev.user_vote === 'down'
                        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-semibold'
                        : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    <ThumbsDown className={`w-3.5 h-3.5 ${rev.user_vote === 'down' ? 'fill-rose-600' : ''}`} />
                    <span>{rev.downvotes}</span>
                  </button>
                </div>

                <Link
                  href={`/${rev.media_type}/${rev.media_id}`}
                  className="flex items-center gap-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>Join discussion</span>
                </Link>
              </div>
            </div>
          );
        })}
        </div>
      )}
    </section>
  );
}
