'use client';

import React, { useState, useEffect } from 'react';
import Image from '@/components/RemoteImage';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Play, Bookmark, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { MediaItem } from '@/lib/types';
import { useModal } from '@/context/ModalContext';
import { useMedia } from '@/context/MediaContext';
import { useAuth } from '@/context/AuthContext';
import { derivePalette } from '@/lib/media-utils';

interface HeroBannerProps {
  items: MediaItem[];
}

export default function HeroBanner({ items }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { openQuickView, openTrailer, openAuthPrompt } = useModal();
  const { isWatchlisted, toggleWatchlist } = useMedia();
  const { user } = useAuth();

  const featuredList = items.length > 0 ? items.slice(0, 5) : [];
  const currentItem = featuredList[currentIndex];

  useEffect(() => {
    if (isPaused || featuredList.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % featuredList.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [isPaused, featuredList.length]);

  if (!currentItem) return null;

  const inWatchlist = isWatchlisted(currentItem.id, currentItem.media_type);
  const palette = derivePalette(currentItem);
  const year = (currentItem.release_date || currentItem.first_air_date || '').slice(0, 4);
  const ratingOutOfFive = (currentItem.vote_average / 2).toFixed(1);
  const detailLink = `/${currentItem.media_type}/${currentItem.id}`;

  const nextSlide = () => setCurrentIndex(prev => (prev + 1) % featuredList.length);
  const prevSlide = () => setCurrentIndex(prev => (prev - 1 + featuredList.length) % featuredList.length);

  return (
    <div
      id="homepage-hero-banner"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full h-[50vh] md:h-[90vh] overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white select-none transition-colors duration-200"
    >
      {/* Background Backdrops with Crossfade Animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentItem.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute inset-0"
        >
          {currentItem.backdrop_path && (
            <Image
              src={currentItem.backdrop_path}
              alt={currentItem.title}
              fill
              priority
              className="object-cover object-top opacity-60 dark:opacity-55"
              referrerPolicy="no-referrer"
            />
          )}
          {/* Light/Dark Mode Gradient Masks */}
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-50 via-zinc-50/50 to-transparent dark:from-zinc-950 dark:via-zinc-950/80 dark:to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-50 via-transparent to-transparent dark:from-zinc-950 dark:via-transparent dark:to-zinc-950/30" />
        </motion.div>
      </AnimatePresence>

      {/* Main Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-16 sm:pb-20">
        <div className="max-w-2xl space-y-4">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs uppercase font-bold tracking-wider px-2.5 py-1 rounded text-white shadow-xs"
              style={{ backgroundColor: palette.dominant }}
            >
              Trending Now
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-regular tracking-tight leading-tight text-zinc-900 dark:text-white">
            {currentItem.title}
          </h1>

          <div className="flex items-center gap-3">
            <span className="text-xs uppercase font-semibold px-2 py-0.5 rounded bg-zinc-900/10 dark:bg-white/10 backdrop-blur-sm text-zinc-700 dark:text-zinc-300">
              {currentItem.media_type === 'movie' ? 'Movie' : 'TV Series'}
            </span>
            <div
              className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/70 dark:bg-black/40 border border-zinc-200 dark:border-white/10 backdrop-blur-sm text-xs font-semibold text-zinc-800 dark:text-zinc-100"
              title="TMDB Rating"
            >
              <span className="text-[10px] font-black uppercase tracking-wider px-1 py-0.2 rounded text-blue-500">
                TMDB
              </span>
              <div className="flex items-center gap-1 text-blue-500 dark:text-blue-400">
                <Star className="w-3.5 h-3.5 fill-blue-500 dark:fill-blue-400" />
                <span>{ratingOutOfFive} / 5</span>
              </div>
            </div>
            {year && <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{year}</span>}
          </div>

          {/* Tagline / Overview */}
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 line-clamp-3 leading-relaxed max-w-xl">
            {currentItem.overview}
          </p>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2 flex-wrap">
            {/* Quick View Button */}
            <button
              type="button"
              id="hero-quick-view-btn"
              onClick={() => openQuickView(currentItem)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold text-white transition-opacity hover:opacity-95 shadow-md"
              style={{ backgroundColor: palette.dominant }}
            >
              <Eye className="w-4 h-4" />
              <span>Learn More</span>
            </button>

            {/* Watch Trailer */}
            {currentItem.trailers && currentItem.trailers.length > 0 && (
              <button
                type="button"
                id="hero-watch-trailer-btn"
                onClick={() => openTrailer(currentItem.trailers![0].key)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold bg-zinc-900/10 hover:bg-zinc-900/15 text-zinc-900 dark:bg-white/15 dark:hover:bg-white/25 dark:text-white backdrop-blur-sm border border-zinc-300 dark:border-white/20 transition-colors"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Trailer</span>
              </button>
            )}

            {/* Watchlist Toggle */}
            <button
              type="button"
              id="hero-watchlist-btn"
              onClick={() => {
                if (!user) {
                  openAuthPrompt(
                    'Sign in to browse 1000+ movies and TV shows and save titles to your personal watchlist.'
                  );
                  return;
                }
                toggleWatchlist(currentItem);
              }}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-md text-sm font-medium border backdrop-blur-sm transition-colors ${
                inWatchlist
                  ? 'bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300'
                  : 'bg-zinc-900/5 border-zinc-300 text-zinc-800 hover:bg-zinc-900/10 dark:bg-white/10 dark:border-white/20 dark:text-zinc-200 dark:hover:bg-white/20'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${inWatchlist ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">
                {inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
              </span>
            </button>
          </div>
        </div>

        {/* Carousel Indicators & Arrows */}
        <div className="absolute bottom-6 right-4 sm:right-8 flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            {featuredList.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentIndex === idx
                    ? 'w-8 bg-zinc-900 dark:bg-white'
                    : 'w-2 bg-zinc-900/30 hover:bg-zinc-900/50 dark:bg-white/40 dark:hover:bg-white/70'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={prevSlide}
              className="p-1.5 rounded-md bg-zinc-900/10 hover:bg-zinc-900/20 text-zinc-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white backdrop-blur-xs transition-colors"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              className="p-1.5 rounded-md bg-zinc-900/10 hover:bg-zinc-900/20 text-zinc-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white backdrop-blur-xs transition-colors"
              aria-label="Next slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
