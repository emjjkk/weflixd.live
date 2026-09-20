'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from '@/components/RemoteImage';
import { useRouter } from 'next/navigation';
import { Search, Heart, Bookmark, User, Settings, LogOut, Sun, Moon, Menu, X, ChevronDown, Bell } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useModal } from '@/context/ModalContext';
import { MOVIE_GENRES, TV_GENRES, COUNTRIES } from '@/lib/data/genres';
import { MediaItem } from '@/lib/types';
import {Logo} from '@/components/Logo';

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { openSearch } = useModal();

  const [activeDropdown, setActiveDropdown] = useState<'movies' | 'tv' | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const [featuredMovies, setFeaturedMovies] = useState<MediaItem[]>([]);
  const [featuredTV, setFeaturedTV] = useState<MediaItem[]>([]);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Load real featured items from TMDB once on mount
  useEffect(() => {
    setIsMac(navigator.platform.toLowerCase().includes('mac'));
  }, []);

  useEffect(() => {
    fetch('/api/tmdb/discover?type=movie&page=1')
      .then(r => r.json())
      .then(d => {
        if (d?.results) setFeaturedMovies(d.results.slice(0, 5));
      })
      .catch(() => {});

    fetch('/api/tmdb/discover?type=tv&page=1')
      .then(r => r.json())
      .then(d => {
        if (d?.results) setFeaturedTV(d.results.slice(0, 5));
      })
      .catch(() => {});
  }, []);

  const handleMouseEnter = (menu: 'movies' | 'tv') => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setActiveDropdown(menu);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 200);
  };

  // Close profile dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand Logo & Main Nav */}
          <div className="flex items-center gap-8">
            <Link
              href="/"
              id="brand-logo"
              className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 hover:opacity-90 transition-opacity"
            >
              <Logo size={40}/>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/"
                id="nav-home"
                className="px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white rounded-md transition-colors"
              >
                Home
              </Link>

              {/* Movies with full-width dropdown */}
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter('movies')}
                onMouseLeave={handleMouseLeave}
              >
                <Link
                  href="/movie"
                  id="nav-movies"
                  className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeDropdown === 'movies'
                      ? 'text-zinc-950 dark:text-white bg-zinc-100 dark:bg-zinc-800'
                      : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white'
                  }`}
                >
                  Movies
                  <ChevronDown className="w-4 h-4 opacity-60" />
                </Link>
              </div>

              {/* TV Shows with full-width dropdown */}
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter('tv')}
                onMouseLeave={handleMouseLeave}
              >
                <Link
                  href="/tv"
                  id="nav-tv"
                  className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeDropdown === 'tv'
                      ? 'text-zinc-950 dark:text-white bg-zinc-100 dark:bg-zinc-800'
                      : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white'
                  }`}
                >
                  TV Shows
                  <ChevronDown className="w-4 h-4 opacity-60" />
                </Link>
              </div>

              <Link
                href="/people"
                id="nav-people"
                className="px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white rounded-md transition-colors"
              >
                People
              </Link>
            </nav>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {/* Search Button */}
            <button
              id="btn-open-search"
              type="button"
              onClick={openSearch}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                title="Search Weflixd"
            >
              <Search className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
              <span className="hidden sm:inline">Search movies, TV, people...</span>
              <kbd className="hidden lg:inline-block text-[11px] font-mono px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded text-zinc-500">
                {isMac ? '⌘K' : '/'}
              </kbd>
            </button>

            {/* Dark/Light Mode Toggle */}
            <button
              id="btn-theme-toggle"
              type="button"
              onClick={toggleTheme}
              className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* If Logged In */}
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/notifications"
                  id="nav-notifications"
                  className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                </Link>

                {/* Profile Picture with Dropdown */}
                <div className="relative" ref={profileMenuRef}>
                  <button
                    id="btn-profile-dropdown"
                    type="button"
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <div className="relative w-8 h-8 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-200 dark:bg-zinc-800">
                      {user.avatar_url ? (
                        <Image
                          src={user.avatar_url}
                          alt={user.username}
                          fill
                          className="object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <User className="w-4 h-4 m-auto text-zinc-500" />
                      )}
                    </div>
                    <span className="hidden sm:inline text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      {user.username}
                    </span>
                    <ChevronDown className="w-4 h-4 text-zinc-500" />
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileMenuOpen && (
                    <div
                      id="profile-dropdown-menu"
                      className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
                    >
                      <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Signed in as</p>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          @{user.username}
                        </p>
                      </div>

                      <Link
                        href={`/profile/${user.username}`}
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        <User className="w-4 h-4" />
                        Profile
                      </Link>

                      <Link
                        href={`/profile/${user.username}?tab=watchlist`}
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        <Bookmark className="w-4 h-4" />
                        Watchlist
                      </Link>

                      <Link
                        href={`/profile/${user.username}?tab=watched`}
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        <Heart className="w-4 h-4" />
                        Recently Watched
                      </Link>

                      <Link
                        href="/settings"
                        id="nav-settings-link"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>

                      <div className="border-t border-zinc-100 dark:border-zinc-800 my-1" />

                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          logout();
                          router.push('/');
                        }}
                        className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        <LogOut className="w-4 h-4" />
                        Log out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* If Not Logged In */
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  id="nav-login-btn"
                  className="px-3.5 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  id="nav-signup-btn"
                  className="px-3.5 py-1.5 text-sm font-medium text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white rounded-md transition-colors shadow-xs"
                >
                  Sign up
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-zinc-600 dark:text-zinc-400 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Full-width Hover Mega Dropdown for Movies */}
      {activeDropdown === 'movies' && (
        <div
          id="mega-dropdown-movies"
          onMouseEnter={() => handleMouseEnter('movies')}
          onMouseLeave={handleMouseLeave}
          className="hidden md:block absolute top-full left-0 w-full bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-xl py-6 animate-in fade-in slide-in-from-top-1 duration-150 z-50"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="grid grid-cols-12 gap-8">
              {/* Browse by Genre */}
              <div className="col-span-8">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Browse Movies by Genre
                  </h3>
                  <Link
                    href="/movie"
                    className="text-xs font-medium text-zinc-900 dark:text-zinc-100 hover:underline"
                    onClick={() => setActiveDropdown(null)}
                  >
                    View All Movies →
                  </Link>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {MOVIE_GENRES.map(genre => (
                    <Link
                      key={genre.id}
                      href={`/movie?genres=${genre.slug}&page=1`}
                      onClick={() => setActiveDropdown(null)}
                      className="px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                    >
                      {genre.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Browse by Country */}
              <div className="col-span-4 border-l border-zinc-100 dark:border-zinc-800 pl-8">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
                  Browse by Country
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {COUNTRIES.map(country => (
                    <Link
                      key={country.code}
                      href={`/movie?country=${country.code}&page=1`}
                      onClick={() => setActiveDropdown(null)}
                      className="px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                    >
                      {country.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* 5 Featured Movies at the Bottom */}
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
                Featured Movies
              </h4>
              <div className="grid grid-cols-5 gap-4">
                {featuredMovies.map(movie => (
                  <Link
                    key={movie.id}
                    href={`/movie/${movie.id}`}
                    onClick={() => setActiveDropdown(null)}
                    className="group flex gap-3 items-center p-2 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
                  >
                    <div className="relative w-12 h-16 rounded overflow-hidden flex-shrink-0 bg-zinc-200 dark:bg-zinc-800">
                      {movie.poster_path && (
                        <Image
                          src={movie.poster_path}
                          alt={movie.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {movie.title}
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        ★ {movie.vote_average.toFixed(1)} · {movie.release_date?.slice(0, 4)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full-width Hover Mega Dropdown for TV Shows */}
      {activeDropdown === 'tv' && (
        <div
          id="mega-dropdown-tv"
          onMouseEnter={() => handleMouseEnter('tv')}
          onMouseLeave={handleMouseLeave}
          className="hidden md:block absolute top-full left-0 w-full bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-xl py-6 animate-in fade-in slide-in-from-top-1 duration-150 z-50"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="grid grid-cols-12 gap-8">
              {/* Browse TV by Genre */}
              <div className="col-span-8">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Browse TV Shows by Genre
                  </h3>
                  <Link
                    href="/tv"
                    className="text-xs font-medium text-zinc-900 dark:text-zinc-100 hover:underline"
                    onClick={() => setActiveDropdown(null)}
                  >
                    View All TV Shows →
                  </Link>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {TV_GENRES.map(genre => (
                    <Link
                      key={genre.id}
                      href={`/tv?genres=${genre.slug}&page=1`}
                      onClick={() => setActiveDropdown(null)}
                      className="px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                    >
                      {genre.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Browse by Country */}
              <div className="col-span-4 border-l border-zinc-100 dark:border-zinc-800 pl-8">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
                  Browse by Country
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {COUNTRIES.map(country => (
                    <Link
                      key={country.code}
                      href={`/tv?country=${country.code}&page=1`}
                      onClick={() => setActiveDropdown(null)}
                      className="px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                    >
                      {country.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* 5 Featured TV Shows at the Bottom */}
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
                Featured TV Series
              </h4>
              <div className="grid grid-cols-5 gap-4">
                {featuredTV.map(show => (
                  <Link
                    key={show.id}
                    href={`/tv/${show.id}`}
                    onClick={() => setActiveDropdown(null)}
                    className="group flex gap-3 items-center p-2 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
                  >
                    <div className="relative w-12 h-16 rounded overflow-hidden flex-shrink-0 bg-zinc-200 dark:bg-zinc-800">
                      {show.poster_path && (
                        <Image
                          src={show.poster_path}
                          alt={show.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {show.title}
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        ★ {show.vote_average.toFixed(1)} · {show.first_air_date?.slice(0, 4)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-4 space-y-3">
          <Link
            href="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-3 py-2 text-base font-medium text-zinc-800 dark:text-zinc-200 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Home
          </Link>
          <Link
            href="/movie"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-3 py-2 text-base font-medium text-zinc-800 dark:text-zinc-200 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Movies
          </Link>
          <Link
            href="/tv"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-3 py-2 text-base font-medium text-zinc-800 dark:text-zinc-200 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            TV Shows
          </Link>
          <Link
            href="/people"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-3 py-2 text-base font-medium text-zinc-800 dark:text-zinc-200 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            People
          </Link>

          {user ? (
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-1">
              <Link
                href={`/profile/${user.username}`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-base font-medium text-zinc-800 dark:text-zinc-200 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <User className="w-5 h-5 text-amber-500" />
                Profile (@{user.username})
              </Link>
              <Link
                href="/settings"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-base font-medium text-zinc-800 dark:text-zinc-200 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <Settings className="w-5 h-5 text-zinc-500" />
                Settings
              </Link>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                  router.push('/');
                }}
                className="w-full text-left flex items-center gap-2 px-3 py-2 text-base font-medium text-rose-600 dark:text-rose-400 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                <LogOut className="w-5 h-5" />
                Log out
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex gap-2">
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex-1 text-center py-2 text-sm font-medium border border-zinc-300 dark:border-zinc-700 rounded-md"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex-1 text-center py-2 text-sm font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
