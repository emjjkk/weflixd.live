'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from '@/components/RemoteImage';
import Link from 'next/link';
import { Search, X, Film, Tv, Users, User, MessageSquare, Star, ArrowRight } from 'lucide-react';
import { useModal } from '@/context/ModalContext';
import { useMedia } from '@/context/MediaContext';
import { MediaItem, PersonItem } from '@/lib/types';
import { ReviewItem, UserProfile, searchProfilesDB } from '@/lib/supabase';

type SearchTab = 'all' | 'movies' | 'tv' | 'people' | 'profiles' | 'reviews';

export default function SearchOverlay() {
  const { isSearchOpen, openSearch, closeSearch } = useModal();
  const { reviews } = useMedia();

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [movies, setMovies] = useState<MediaItem[]>([]);
  const [tvShows, setTvShows] = useState<MediaItem[]>([]);
  const [people, setPeople] = useState<PersonItem[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [matchingReviews, setMatchingReviews] = useState<ReviewItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input and handle keyboard shortcuts.
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
      // Load initial trending items if results are empty
      if (!query.trim() && movies.length === 0) {
        fetch('/api/tmdb/discover?type=movie&page=1')
          .then(r => r.json())
          .then(d => {
            if (d?.results) setMovies(d.results.slice(0, 4));
          })
          .catch(() => {});
        fetch('/api/tmdb/discover?type=tv&page=1')
          .then(r => r.json())
          .then(d => {
            if (d?.results) setTvShows(d.results.slice(0, 4));
          })
          .catch(() => {});
      }
    } else {
      document.body.style.overflow = 'auto';
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isSearchOpen) closeSearch();
        else openSearch();
      }
      if (e.key === '/' && !isTyping && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        openSearch();
      }
      if (e.key === 'Escape' && isSearchOpen) {
        closeSearch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isSearchOpen, openSearch, closeSearch, query, movies.length]);

  // Live query debounce
  useEffect(() => {
    if (!query.trim()) {
      setMovies([]);
      setTvShows([]);
      setPeople([]);
      setProfiles([]);
      setMatchingReviews([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      const q = query.toLowerCase();

      // Local matching for real reviews
      const localReviews = reviews.filter(
        r => r.media_title?.toLowerCase().includes(q) || r.content?.toLowerCase().includes(q) || r.username?.toLowerCase().includes(q)
      );
      setMatchingReviews(localReviews);

      // Search real TMDB and real Supabase profiles in parallel
      try {
        const [tmdbRes, dbProfiles] = await Promise.all([
          fetch(`/api/tmdb/search?q=${encodeURIComponent(query)}`).then(r => r.ok ? r.json() : null),
          searchProfilesDB(query),
        ]);

        if (tmdbRes) {
          setMovies(tmdbRes.movies || []);
          setTvShows(tmdbRes.tv || []);
          setPeople(tmdbRes.people || []);
        } else {
          setMovies([]);
          setTvShows([]);
          setPeople([]);
        }

        setProfiles(dbProfiles || []);
      } catch (err) {
        console.warn('Search query error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, reviews]);

  if (!isSearchOpen) return null;

  const totalResults =
    movies.length + tvShows.length + people.length + profiles.length + matchingReviews.length;

  return (
    <div
      id="search-overlay"
      className="fixed inset-0 z-50 flex flex-col items-center bg-zinc-950/80 backdrop-blur-md p-4 sm:p-6 md:p-10 animate-in fade-in duration-150 overflow-y-auto"
      onClick={e => {
        if (e.target === e.currentTarget) closeSearch();
      }}
    >
      <div className="w-full max-w-3xl flex flex-col gap-4">
        {/* Floating Search Bar */}
        <div className="relative flex items-center w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-2xl px-4 py-3">
          <Search className="w-5 h-5 text-zinc-400 mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search movies, TV shows, actors, directors, profiles, reviews..."
            className="w-full bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 text-base font-normal outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={closeSearch}
            className="text-xs font-mono px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-700"
          >
            ESC
          </button>
        </div>

        {/* Search Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'all', label: 'All', icon: null, count: totalResults },
            { id: 'movies', label: 'Movies', icon: Film, count: movies.length },
            { id: 'tv', label: 'TV Shows', icon: Tv, count: tvShows.length },
            { id: 'people', label: 'People', icon: Users, count: people.length },
            { id: 'profiles', label: 'Profiles', icon: User, count: profiles.length },
            { id: 'reviews', label: 'Reviews', icon: MessageSquare, count: matchingReviews.length },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as SearchTab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-800'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                <span>{tab.label}</span>
                <span className="opacity-60 text-[10px]">({tab.count})</span>
              </button>
            );
          })}
        </div>

        {/* Live Search Suggestions & Results Container */}
        <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl p-4 sm:p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {isSearching && (
            <p className="text-xs text-zinc-400 animate-pulse">Searching catalog...</p>
          )}

          {/* Idle state when query is empty */}
          {!isSearching && !query.trim() && (
            <div className="py-10 text-center space-y-2">
              <p className="text-zinc-600 dark:text-zinc-300 text-sm font-medium">
                Search Weflixd
              </p>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Find movies, TV series, actors, directors, member profiles, and reviews.
              </p>
            </div>
          )}

          {/* Empty state when query has no results across all tabs */}
          {!isSearching && query.trim() && totalResults === 0 && (
            <div className="py-12 text-center">
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                No results found for &ldquo;{query}&rdquo;.
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                Try searching for titles like &ldquo;Dune&rdquo;, &ldquo;Oppenheimer&rdquo;, or people like &ldquo;Zendaya&rdquo;.
              </p>
            </div>
          )}

          {/* Specific Tab Empty States when totalResults > 0 but selected tab is empty */}
          {!isSearching && query.trim() && totalResults > 0 && activeTab === 'profiles' && profiles.length === 0 && (
            <div className="py-8 text-center space-y-1">
              <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                No member profiles found matching &ldquo;{query}&rdquo;.
              </p>
            </div>
          )}

          {!isSearching && query.trim() && totalResults > 0 && activeTab === 'reviews' && matchingReviews.length === 0 && (
            <div className="py-8 text-center space-y-1">
              <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                No member reviews found matching &ldquo;{query}&rdquo;.
              </p>
            </div>
          )}

          {!isSearching && query.trim() && totalResults > 0 && activeTab === 'movies' && movies.length === 0 && (
            <div className="py-8 text-center space-y-1">
              <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                No movies found matching &ldquo;{query}&rdquo;.
              </p>
            </div>
          )}

          {!isSearching && query.trim() && totalResults > 0 && activeTab === 'tv' && tvShows.length === 0 && (
            <div className="py-8 text-center space-y-1">
              <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                No TV shows found matching &ldquo;{query}&rdquo;.
              </p>
            </div>
          )}

          {!isSearching && query.trim() && totalResults > 0 && activeTab === 'people' && people.length === 0 && (
            <div className="py-8 text-center space-y-1">
              <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                No people or cast found matching &ldquo;{query}&rdquo;.
              </p>
            </div>
          )}

          {/* MOVIES SECTION */}
          {(activeTab === 'all' || activeTab === 'movies') && movies.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  <Film className="w-4 h-4 text-zinc-500" />
                  <span>Movies</span>
                </div>
                {activeTab === 'all' && movies.length > 3 && (
                  <button
                    onClick={() => setActiveTab('movies')}
                    className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                  >
                    See all ({movies.length})
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {movies.slice(0, activeTab === 'all' ? 4 : 20).map(movie => (
                  <Link
                    key={movie.id}
                    href={`/movie/${movie.id}`}
                    onClick={closeSearch}
                    className="group flex items-center gap-3 p-2 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors"
                  >
                    <div className="relative w-12 h-16 rounded overflow-hidden flex-shrink-0 bg-zinc-200 dark:bg-zinc-800">
                      {movie.poster_path && (
                        <Image
                          src={movie.poster_path}
                          alt={movie.title}
                          fill
                          className="object-cover"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {movie.title}
                      </p>
                      <p className="text-xs text-zinc-500 flex items-center gap-1.5 mt-0.5">
                        <span className="flex items-center text-amber-500 font-medium">
                          <Star className="w-3 h-3 fill-amber-500 mr-0.5" />
                          {movie.vote_average.toFixed(1)}
                        </span>
                        <span>·</span>
                        <span>{movie.release_date?.slice(0, 4) || 'Movie'}</span>
                      </p>
                      <p className="text-xs text-zinc-400 truncate mt-0.5">{movie.overview}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* TV SHOWS SECTION */}
          {(activeTab === 'all' || activeTab === 'tv') && tvShows.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  <Tv className="w-4 h-4 text-zinc-500" />
                  <span>TV Shows</span>
                </div>
                {activeTab === 'all' && tvShows.length > 3 && (
                  <button
                    onClick={() => setActiveTab('tv')}
                    className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                  >
                    See all ({tvShows.length})
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tvShows.slice(0, activeTab === 'all' ? 4 : 20).map(show => (
                  <Link
                    key={show.id}
                    href={`/tv/${show.id}`}
                    onClick={closeSearch}
                    className="group flex items-center gap-3 p-2 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors"
                  >
                    <div className="relative w-12 h-16 rounded overflow-hidden flex-shrink-0 bg-zinc-200 dark:bg-zinc-800">
                      {show.poster_path && (
                        <Image
                          src={show.poster_path}
                          alt={show.title}
                          fill
                          className="object-cover"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {show.title}
                      </p>
                      <p className="text-xs text-zinc-500 flex items-center gap-1.5 mt-0.5">
                        <span className="flex items-center text-amber-500 font-medium">
                          <Star className="w-3 h-3 fill-amber-500 mr-0.5" />
                          {show.vote_average.toFixed(1)}
                        </span>
                        <span>·</span>
                        <span>{show.first_air_date?.slice(0, 4) || 'TV'}</span>
                        {show.number_of_seasons && (
                          <span>· {show.number_of_seasons} Seasons</span>
                        )}
                      </p>
                      <p className="text-xs text-zinc-400 truncate mt-0.5">{show.overview}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* PEOPLE SECTION */}
          {(activeTab === 'all' || activeTab === 'people') && people.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  <Users className="w-4 h-4 text-zinc-500" />
                  <span>People</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {people.slice(0, activeTab === 'all' ? 4 : 20).map(person => (
                  <Link
                    key={person.id}
                    href={`/people/${person.id}`}
                    onClick={closeSearch}
                    className="group flex items-center gap-3 p-2 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors"
                  >
                    <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-zinc-200 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                      {person.profile_path ? (
                        <Image
                          src={person.profile_path}
                          alt={person.name}
                          fill
                          className="object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <User className="w-6 h-6 m-auto text-zinc-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {person.name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {person.known_for_department} · Popularity {Math.round(person.popularity)}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* PROFILES SECTION */}
          {(activeTab === 'all' || activeTab === 'profiles') && profiles.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  <User className="w-4 h-4 text-zinc-500" />
                  <span>Profiles</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {profiles.map(profile => (
                  <Link
                    key={profile.id}
                    href={`/profile/${profile.username}`}
                    onClick={closeSearch}
                    className="group flex items-center gap-3 p-2 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors"
                  >
                    <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-zinc-200 dark:border-zinc-700">
                      <Image
                        src={profile.avatar_url}
                        alt={profile.username}
                        fill
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {profile.display_name}
                      </p>
                      <p className="text-xs text-zinc-500">@{profile.username}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* REVIEWS SECTION */}
          {(activeTab === 'all' || activeTab === 'reviews') && matchingReviews.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  <MessageSquare className="w-4 h-4 text-zinc-500" />
                  <span>Reviews</span>
                </div>
              </div>

              <div className="space-y-3">
                {matchingReviews.slice(0, activeTab === 'all' ? 3 : 15).map(rev => (
                  <Link
                    key={rev.id}
                    href={`/${rev.media_type}/${rev.media_id}`}
                    onClick={closeSearch}
                    className="block p-3 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          {rev.media_title}
                        </span>
                        <span className="text-xs text-zinc-400">by @{rev.username}</span>
                      </div>
                      <div className="flex items-center text-amber-500 text-xs font-medium">
                        {'★'.repeat(Math.floor(rev.rating))}
                        <span className="text-zinc-500 ml-1">{rev.rating}/5</span>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2">
                      &ldquo;{rev.content}&rdquo;
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
