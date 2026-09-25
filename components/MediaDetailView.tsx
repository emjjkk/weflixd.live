'use client';

import React, { useState } from 'react';
import Image from '@/components/RemoteImage';
import Link from 'next/link';
import {
  Star,
  Bookmark,
  Eye,
  Heart,
  Share2,
  Play,
  User,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Plus,
  ExternalLink,
} from 'lucide-react';
import { MediaItem } from '@/lib/types';
import { useModal } from '@/context/ModalContext';
import { useMedia } from '@/context/MediaContext';
import { useAuth } from '@/context/AuthContext';
import { derivePalette } from '@/lib/media-utils';
import { getWatchProviderUrl } from '@/lib/providers';
import HorizontalShelf from './HorizontalShelf';

interface MediaDetailViewProps {
  media: MediaItem;
}

export default function MediaDetailView({ media }: MediaDetailViewProps) {
  const { openLogWatched, openShare, openTrailer, openAuthPrompt, showToast } = useModal();
  const { isWatchlisted, toggleWatchlist, isFavorite, toggleFavorite, isWatched, getReviewsForMedia, voteReview } =
    useMedia();
  const { user } = useAuth();

  const inWatchlist = isWatchlisted(media.id, media.media_type);
  const favorited = isFavorite(media.id, media.media_type);
  const watched = isWatched(media.id, media.media_type);
  const palette = derivePalette(media);

  const year = (media.release_date || media.first_air_date || '').slice(0, 4);
  const reviews = getReviewsForMedia(media.id, media.media_type);
  const ratedReviews = reviews.filter(r => typeof r.rating === 'number' && r.rating > 0);
  const siteAverage =
    ratedReviews.length > 0
      ? (ratedReviews.reduce((sum, r) => sum + r.rating, 0) / ratedReviews.length).toFixed(1)
      : null;
  const providers = media.watch_providers;

  const handleWatchlistClick = () => {
    if (!user) {
      openAuthPrompt('Sign in to browse 1000+ movies and TV shows and save them to your personal watchlist.');
      return;
    }
    toggleWatchlist(media);
    showToast(inWatchlist ? 'Removed from your watchlist.' : 'Added to your watchlist.');
  };

  const handleWatchedClick = () => {
    if (!user) {
      openAuthPrompt("Sign in to browse 1000+ movies and TV shows and log what you've watched.");
      return;
    }
    openLogWatched(media);
  };

  const handleFavoriteClick = () => {
    if (!user) {
      openAuthPrompt('Sign in to browse 1000+ movies and TV shows and mark your favorite titles.');
      return;
    }
    toggleFavorite(media);
    showToast(favorited ? 'Removed from your favorites.' : 'Added to your favorites.');
  };

  const handleAddReviewClick = () => {
    if (!user) {
      openAuthPrompt('Sign in to browse 1000+ movies and TV shows, rate titles, and write reviews.');
      return;
    }
    openLogWatched(media);
  };

  const handleVoteReviewClick = (reviewId: string, direction: 'up' | 'down') => {
    if (!user) {
      openAuthPrompt('Sign in to browse 1000+ movies and TV shows and vote on community reviews.');
      return;
    }
    voteReview(reviewId, direction);
  };

  return (
    <div className="w-full pb-20">
      {/* 1. Backdrop Banner with Dynamic Color Grading based on palette */}
      <div className="relative w-full h-[380px] sm:h-[480px] lg:h-[540px] bg-zinc-100 dark:bg-zinc-950 overflow-hidden transition-colors duration-200">
        {media.backdrop_path ? (
          <Image
            src={media.backdrop_path}
            alt={media.title}
            fill
            priority
            className="object-cover object-top opacity-55 dark:opacity-60"
            referrerPolicy="no-referrer"
          />
        ) : null}

        {/* Dynamic color grading overlay using movie's palette */}
        <div
          className="absolute inset-0 opacity-20 dark:opacity-40 mix-blend-color"
          style={{ backgroundColor: palette.dominant }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-50 via-zinc-50/70 to-transparent dark:from-zinc-950 dark:via-zinc-950/60 dark:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-50/80 via-transparent to-transparent dark:from-zinc-950/80 dark:via-transparent dark:to-transparent" />
      </div>

      {/* Main Container Overlapping Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-40 sm:-mt-52 relative z-10 space-y-10">
        {/* Header Block: Poster + Metadata + Actions */}
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
          {/* Poster */}
          <div className="relative w-44 sm:w-56 md:w-64 aspect-[2/3] rounded-xl overflow-hidden border-2 border-white dark:border-zinc-800 shadow-2xl flex-shrink-0 bg-zinc-100 dark:bg-zinc-900">
            {media.poster_path ? (
              <Image
                src={media.poster_path}
                alt={media.title}
                fill
                priority
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-500">
                {media.title}
              </div>
            )}
          </div>

          {/* Title, Tagline, Stats, and Action Buttons */}
          <div className="flex-1 min-w-0 space-y-4 text-zinc-800 dark:text-zinc-100">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span
                className="uppercase font-bold tracking-wider px-2 py-0.5 rounded text-white shadow-xs"
                style={{ backgroundColor: palette.dominant }}
              >
                {media.media_type === 'movie' ? 'Movie' : 'TV Series'}
              </span>
              {year && <span className="text-zinc-600 dark:text-zinc-300 font-medium">{year}</span>}
              {media.runtime && <span className="text-zinc-500 dark:text-zinc-400">· {media.runtime} min</span>}
              {media.number_of_seasons && (
                <span className="text-zinc-500 dark:text-zinc-400">· {media.number_of_seasons} Seasons</span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-white">
              {media.title}
            </h1>

            {media.tagline && (
              <p className="text-sm italic text-zinc-600 dark:text-zinc-300">&ldquo;{media.tagline}&rdquo;</p>
            )}

            {/* Ratings and Genres */}
            <div className="flex items-center gap-3 flex-wrap pt-1">
              {/* TMDB Rating */}
              <div
                id="rating-badge-tmdb"
                className="flex items-center gap-2 bg-white/80 dark:bg-black/50 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-white/15 backdrop-blur-sm shadow-xs"
                title={`TMDB Rating: ${media.vote_average ? media.vote_average.toFixed(1) : '—'} / 10 based on ${media.vote_count ? media.vote_count.toLocaleString() : 0} votes`}
              >
                <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500 text-zinc-950">
                  TMDB
                </span>
                <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400 font-bold text-sm">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{media.vote_average ? media.vote_average.toFixed(1) : '—'}</span>
                  <span className="text-zinc-500 dark:text-zinc-400 text-xs font-normal">/ 10</span>
                </div>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal">
                  ({media.vote_count ? media.vote_count.toLocaleString() : 0})
                </span>
              </div>

              {/* Site Community Rating */}
              <a
                id="rating-badge-site"
                href="#reviews-section"
                className="flex items-center gap-2 bg-white/80 hover:bg-white dark:bg-black/50 dark:hover:bg-black/70 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-white/15 backdrop-blur-sm transition-colors group cursor-pointer shadow-xs"
                title={
                  siteAverage
                    ? `Weflixd Community Rating: ${siteAverage} / 5 based on ${ratedReviews.length} member reviews`
                    : 'No member reviews on Weflixd yet. Click to rate!'
                }
              >
                <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500 text-white">
                  Weflixd
                </span>
                {siteAverage ? (
                  <>
                    <div className="flex items-center gap-1 text-blue-500 dark:text-blue-400 font-bold text-sm">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{siteAverage}</span>
                      <span className="text-zinc-500 dark:text-zinc-400 text-xs font-normal">/ 5</span>
                    </div>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                      ({ratedReviews.length} {ratedReviews.length === 1 ? 'site review' : 'site reviews'})
                    </span>
                  </>
                ) : (
                  <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 text-xs">
                    <Star className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                    <span>No site reviews</span>
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium underline underline-offset-2 ml-0.5">
                      Rate
                    </span>
                  </div>
                )}
              </a>

              {/* Genres */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {media.genres?.map(g => (
                  <span
                    key={g.id}
                    className="text-xs font-medium px-2.5 py-1 rounded bg-zinc-900/5 dark:bg-zinc-800/80 backdrop-blur-xs text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-white/10"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons: Add to Watchlist, I've Watched This, Favorite, Share */}
            <div className="flex items-center gap-2.5 flex-wrap pt-3">
              {/* Watchlist */}
              <button
                type="button"
                id="btn-detail-watchlist"
                onClick={handleWatchlistClick}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md border transition-colors ${
                  inWatchlist
                    ? 'bg-amber-500 border-amber-400 text-white shadow-xs'
                    : 'bg-white/80 hover:bg-white text-zinc-800 border-zinc-200 dark:bg-white/10 dark:hover:bg-white/20 dark:border-white/20 dark:text-white backdrop-blur-sm shadow-xs'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${inWatchlist ? 'fill-white' : ''}`} />
                <span>{inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}</span>
              </button>

              {/* I've Watched This */}
              <button
                type="button"
                id="btn-detail-watched"
                onClick={handleWatchedClick}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md border transition-colors ${
                  watched
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-xs'
                    : 'bg-white/80 hover:bg-white text-zinc-800 border-zinc-200 dark:bg-white/10 dark:hover:bg-white/20 dark:border-white/20 dark:text-white backdrop-blur-sm shadow-xs'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>{watched ? 'Watched (Edit Log)' : "I've Watched This"}</span>
              </button>

              {/* Favorite */}
              <button
                type="button"
                id="btn-detail-favorite"
                onClick={handleFavoriteClick}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-md border transition-colors ${
                  favorited
                    ? 'bg-rose-600 border-rose-500 text-white shadow-xs'
                    : 'bg-white/80 hover:bg-white text-zinc-800 border-zinc-200 dark:bg-white/10 dark:hover:bg-white/20 dark:border-white/20 dark:text-white backdrop-blur-sm shadow-xs'
                }`}
                title={favorited ? 'Remove Favorite' : 'Favorite'}
              >
                <Heart className={`w-4 h-4 ${favorited ? 'fill-white' : ''}`} />
                <span className="hidden sm:inline">{favorited ? 'Favorited' : 'Favorite'}</span>
              </button>

              {/* Share */}
              <button
                type="button"
                id="btn-detail-share"
                onClick={() => openShare(media)}
                className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-md bg-white/80 hover:bg-white text-zinc-800 border border-zinc-200 dark:bg-white/10 dark:hover:bg-white/20 dark:border-white/20 dark:text-white backdrop-blur-sm shadow-xs transition-colors"
                title="Share this title"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </div>
        </div>

        {/* Overview section */}
        <section className="space-y-3 pt-4">
          <h2 className="text-base font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
            Overview
          </h2>
          <p className="text-base leading-relaxed text-zinc-700 dark:text-zinc-300 max-w-4xl">
            {media.overview}
          </p>
        </section>

        {/* Available Watch Providers (JustWatch Integration) */}
        <section className="space-y-3 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Where to Watch
            </h2>
            <span className="text-xs text-zinc-400">Powered by JustWatch</span>
          </div>

          {providers && (providers.flatrate?.length || providers.rent?.length || providers.buy?.length) ? (
            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Stream */}
                {providers.flatrate && providers.flatrate.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Stream Subscription</p>
                    <div className="flex flex-wrap gap-2">
                      {providers.flatrate.map(p => {
                        const targetUrl =
                          p.url || getWatchProviderUrl(p.provider_name, media.title, media.media_type, providers.link);
                        return (
                          <a
                            key={p.provider_id}
                            href={targetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`Watch ${media.title} on ${p.provider_name} (opens in new tab)`}
                            className="group flex items-center gap-2 px-2.5 py-1.5 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 rounded-md border border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 shadow-xs transition-all"
                          >
                            <div className="relative w-5 h-5 rounded overflow-hidden flex-shrink-0">
                              <Image
                                src={p.logo_path}
                                alt={p.provider_name}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {p.provider_name}
                            </span>
                            <ExternalLink className="w-3 h-3 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition-colors opacity-70 group-hover:opacity-100" />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Rent */}
                {providers.rent && providers.rent.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Rent</p>
                    <div className="flex flex-wrap gap-2">
                      {providers.rent.map(p => {
                        const targetUrl =
                          p.url || getWatchProviderUrl(p.provider_name, media.title, media.media_type, providers.link);
                        return (
                          <a
                            key={p.provider_id}
                            href={targetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`Rent ${media.title} on ${p.provider_name} (opens in new tab)`}
                            className="group flex items-center gap-2 px-2.5 py-1.5 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 rounded-md border border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 shadow-xs transition-all"
                          >
                            <div className="relative w-5 h-5 rounded overflow-hidden flex-shrink-0">
                              <Image
                                src={p.logo_path}
                                alt={p.provider_name}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {p.provider_name}
                            </span>
                            <ExternalLink className="w-3 h-3 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition-colors opacity-70 group-hover:opacity-100" />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Buy */}
                {providers.buy && providers.buy.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Buy</p>
                    <div className="flex flex-wrap gap-2">
                      {providers.buy.map(p => {
                        const targetUrl =
                          p.url || getWatchProviderUrl(p.provider_name, media.title, media.media_type, providers.link);
                        return (
                          <a
                            key={p.provider_id}
                            href={targetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`Buy ${media.title} on ${p.provider_name} (opens in new tab)`}
                            className="group flex items-center gap-2 px-2.5 py-1.5 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 rounded-md border border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 shadow-xs transition-all"
                          >
                            <div className="relative w-5 h-5 rounded overflow-hidden flex-shrink-0">
                              <Image
                                src={p.logo_path}
                                alt={p.provider_name}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {p.provider_name}
                            </span>
                            <ExternalLink className="w-3 h-3 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition-colors opacity-70 group-hover:opacity-100" />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {providers.link && (
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                  <a
                    href={providers.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <span>View all streaming, rental & purchase options on JustWatch</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <span className="text-[11px] text-zinc-400">Availability varies by country & region</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-zinc-500">
              Not currently streaming on standard providers in your region. Check local cinema listings or physical formats.
            </p>
          )}
        </section>

        {/* Trailers Section */}
        {media.trailers && media.trailers.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-base font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Trailers & Videos
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {media.trailers.map(trailer => (
                <div
                  key={trailer.id}
                  onClick={() => openTrailer(trailer.key)}
                  className="group relative cursor-pointer aspect-video rounded-lg overflow-hidden bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm"
                >
                  <Image
                    src={`https://img.youtube.com/vi/${trailer.key}/hqdefault.jpg`}
                    alt={trailer.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300 opacity-80"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="p-3 rounded-full bg-red-600 group-hover:bg-red-500 text-white shadow-lg transition-transform group-hover:scale-110">
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute bottom-2.5 left-3 right-3 text-white">
                    <p className="text-xs font-semibold truncate">{trailer.name}</p>
                    <p className="text-[10px] text-zinc-400">{trailer.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Cast: Horizontal list with photo, real name, and character name, linking to /people/<person_id> */}
        {media.cast && media.cast.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                Top Cast
              </h2>
              <Link
                href="/people"
                className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              >
                View all actors →
              </Link>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar">
              {media.cast.map(person => (
                <Link
                  key={person.id}
                  href={`/people/${person.id}`}
                  className="group flex flex-col w-28 sm:w-32 flex-shrink-0"
                >
                  <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden bg-zinc-200 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 group-hover:border-zinc-400 transition-colors shadow-xs">
                    {person.profile_path ? (
                      <Image
                        src={person.profile_path}
                        alt={person.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-8 h-8 text-zinc-400" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mt-2 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {person.name}
                  </p>
                  <p className="text-[11px] text-zinc-500 truncate">
                    {person.character || 'Cast'}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Reviews Section: Letterboxd style with upvotes/downvotes and add review button */}
        <section id="reviews-section" className="space-y-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  Reviews & Ratings
                </h2>
                {siteAverage && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    <Star className="w-3 h-3 fill-blue-500" />
                    {siteAverage} / 5 site average
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500">
                {reviews.length} member review{reviews.length === 1 ? '' : 's'} on Weflixd
              </p>
            </div>

            <button
              type="button"
              id="btn-add-review"
              onClick={handleAddReviewClick}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-white transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Log / Add Review</span>
            </button>
          </div>

          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map(rev => (
                <div
                  key={rev.id}
                  className="p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/profile/${rev.username}`}
                        className="relative w-9 h-9 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700 flex-shrink-0"
                      >
                        <Image
                          src={rev.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                          alt={rev.username}
                          fill
                          className="object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </Link>
                      <div>
                        <Link
                          href={`/profile/${rev.username}`}
                          className="text-xs font-bold text-zinc-900 dark:text-zinc-100 hover:underline"
                        >
                          @{rev.username}
                        </Link>
                        <p className="text-[11px] text-zinc-400">
                          Watched on {rev.watched_date || 'recent date'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center text-amber-500 text-xs font-semibold">
                      {'★'.repeat(Math.floor(rev.rating))}
                      <span className="text-zinc-600 dark:text-zinc-400 ml-1.5">
                        {rev.rating}/5
                      </span>
                    </div>
                  </div>

                  <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                    {rev.content}
                  </p>

                  <div className="flex items-center gap-4 pt-2 text-xs text-zinc-500">
                    {/* Upvote */}
                    <button
                      type="button"
                      onClick={() => handleVoteReviewClick(rev.id, 'up')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                        rev.user_vote === 'up'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-semibold'
                          : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      <ThumbsUp
                        className={`w-3.5 h-3.5 ${rev.user_vote === 'up' ? 'fill-emerald-600' : ''}`}
                      />
                      <span>{rev.upvotes}</span>
                    </button>

                    {/* Downvote */}
                    <button
                      type="button"
                      onClick={() => handleVoteReviewClick(rev.id, 'down')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                        rev.user_vote === 'down'
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-semibold'
                          : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      <ThumbsDown
                        className={`w-3.5 h-3.5 ${rev.user_vote === 'down' ? 'fill-rose-600' : ''}`}
                      />
                      <span>{rev.downvotes}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2">
              <MessageSquare className="w-8 h-8 text-zinc-400 mx-auto" />
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                No reviews yet
              </p>
              <p className="text-xs text-zinc-500">Be the first to rate and review {media.title}!</p>
              <button
                type="button"
                onClick={handleAddReviewClick}
                className="px-4 py-2 mt-2 text-xs font-semibold rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
              >
                Write Review
              </button>
            </div>
          )}
        </section>

        {/* More Like This (TMDB Recommendations) */}
        {media.recommendations && media.recommendations.length > 0 && (
          <section className="pt-6">
            <HorizontalShelf
              id="recommendations-shelf"
              title="More Like This"
              subtitle={`Recommended for viewers who enjoyed ${media.title}`}
              items={media.recommendations}
            />
          </section>
        )}
      </div>
    </div>
  );
}
