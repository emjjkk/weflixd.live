'use client';

import React, { useState } from 'react';
import Image from '@/components/RemoteImage';
import Link from 'next/link';
import { User, ArrowUpDown, Calendar, MapPin, Briefcase, Heart } from 'lucide-react';
import { PersonItem, FilmographyCredit } from '@/lib/types';
import HorizontalShelf from './HorizontalShelf';
import { useAuth } from '@/context/AuthContext';
import { useMedia } from '@/context/MediaContext';
import { useModal } from '@/context/ModalContext';

interface PersonDetailViewProps {
  person: PersonItem;
}

export default function PersonDetailView({ person }: PersonDetailViewProps) {
  const { user } = useAuth();
  const { isPersonFavorite, togglePersonFavorite } = useMedia();
  const { openAuthPrompt, showToast } = useModal();
  const [sortKey, setSortKey] = useState<'date' | 'popularity'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [filterType, setFilterType] = useState<'all' | 'movie' | 'tv'>('all');
  const [bioExpanded, setBioExpanded] = useState(false);
  const favorited = isPersonFavorite(person.id);

  const handleFavorite = () => {
    if (!user) {
      openAuthPrompt('Sign in to save actors, directors, and other people to your favorites.');
      return;
    }
    togglePersonFavorite(person);
    showToast(favorited ? 'Removed from your favorites.' : 'Added to your favorites.');
  };

  // Sorting filmography
  const rawFilmography: FilmographyCredit[] = (person.filmography && person.filmography.length > 0)
    ? person.filmography
    : [
        ...(person.credits?.cast || []).map(c => ({
          id: c.id,
          title: c.title,
          character: 'Cast',
          release_date: c.release_date || c.first_air_date,
          poster_path: c.poster_path,
          media_type: c.media_type,
          popularity: c.popularity,
          vote_average: c.vote_average,
        })),
        ...(person.credits?.crew || []).map(c => ({
          id: c.id,
          title: c.title,
          character: 'Crew',
          release_date: c.release_date || c.first_air_date,
          poster_path: c.poster_path,
          media_type: c.media_type,
          popularity: c.popularity,
          vote_average: c.vote_average,
        })),
      ];

  const filmography = [...rawFilmography];

  const filteredFilmography = filmography.filter(credit => {
    if (filterType === 'all') return true;
    return credit.media_type === filterType;
  });

  filteredFilmography.sort((a, b) => {
    if (sortKey === 'date') {
      const dateA = a.release_date || '';
      const dateB = b.release_date || '';
      return sortOrder === 'desc' ? dateB.localeCompare(dateA) : dateA.localeCompare(dateB);
    } else {
      const popA = a.popularity || 0;
      const popB = b.popularity || 0;
      return sortOrder === 'desc' ? popB - popA : popA - popB;
    }
  });

  const toggleSort = (key: 'date' | 'popularity') => {
    if (sortKey === key) {
      setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-12">
      {/* Bio and Header Section */}
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Profile photo */}
        <div className="relative w-44 sm:w-56 aspect-[2/3] rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 shadow-lg flex-shrink-0">
          {person.profile_path ? (
            <Image
              src={person.profile_path}
              alt={person.name}
              fill
              priority
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-400">
              <User className="w-16 h-16" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {person.known_for_department}
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
              {person.name}
            </h1>
            <button
              type="button"
              onClick={handleFavorite}
              className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md border transition-colors ${favorited ? 'bg-rose-600 border-rose-500 text-white' : 'border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
            >
              <Heart className={`w-4 h-4 ${favorited ? 'fill-white' : ''}`} />
              {favorited ? 'Favorited' : 'Favorite'}
            </button>
          </div>

          {/* Quick facts */}
          <div className="flex flex-wrap gap-4 text-xs text-zinc-600 dark:text-zinc-400 py-1">
            {person.birthday && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                <span>Born {person.birthday}</span>
              </div>
            )}
            {person.place_of_birth && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                <span>{person.place_of_birth}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-zinc-400" />
              <span>Department: {person.known_for_department}</span>
            </div>
          </div>

          {/* Bio */}
          {person.biography && (
            <div className="space-y-1 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Biography
              </h3>
              <p
                className={`text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 ${
                  !bioExpanded ? 'line-clamp-4' : ''
                }`}
              >
                {person.biography}
              </p>
              {person.biography.length > 250 && (
                <button
                  type="button"
                  onClick={() => setBioExpanded(!bioExpanded)}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline pt-1"
                >
                  {bioExpanded ? 'Show less' : 'Read full biography'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Horizontal list of movies and TV shows they are known for */}
      {person.known_for && person.known_for.length > 0 && (
        <HorizontalShelf
          title={`Known For`}
          subtitle={`Prominent works featuring ${person.name}`}
          items={person.known_for}
        />
      )}

      {/* Filmography Table Section */}
      <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Filmography & Credits
            </h2>
            <p className="text-xs text-zinc-500">
              Complete career catalog ({filteredFilmography.length} titles)
            </p>
          </div>

          {/* Filter & Sort Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Type filter */}
            <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800 rounded-md">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 text-xs font-medium rounded ${
                  filterType === 'all'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-500'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterType('movie')}
                className={`px-2.5 py-1 text-xs font-medium rounded ${
                  filterType === 'movie'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-500'
                }`}
              >
                Movies
              </button>
              <button
                type="button"
                onClick={() => setFilterType('tv')}
                className={`px-2.5 py-1 text-xs font-medium rounded ${
                  filterType === 'tv'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-500'
                }`}
              >
                TV
              </button>
            </div>

            {/* Sort toggles */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => toggleSort('date')}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                  sortKey === 'date'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <span>Release Date</span>
                <ArrowUpDown className="w-3 h-3" />
              </button>

              <button
                type="button"
                onClick={() => toggleSort('popularity')}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                  sortKey === 'popularity'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <span>Popularity</span>
                <ArrowUpDown className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Filmography Table */}
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4 w-14">Poster</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Character / Role</th>
                <th className="py-3 px-4 w-28">Type</th>
                <th className="py-3 px-4 w-28 text-right">Year</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredFilmography.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-500">
                    No filmography titles found for this category.
                  </td>
                </tr>
              ) : (
                filteredFilmography.map((credit, idx) => {
                  const link = `/${credit.media_type}/${credit.id}`;
                  return (
                    <tr
                      key={`${credit.media_type}-${credit.id}-${credit.character || credit.job || idx}`}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
                    >
                      {/* Poster */}
                      <td className="py-2.5 px-4">
                        <Link href={link} className="block relative w-9 h-13 rounded overflow-hidden bg-zinc-200 dark:bg-zinc-800 flex-shrink-0">
                          {credit.poster_path ? (
                            <Image
                              src={credit.poster_path}
                              alt={credit.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform"
                              referrerPolicy="no-referrer"
                            />
                          ) : null}
                        </Link>
                      </td>

                      {/* Title */}
                      <td className="py-2.5 px-4 font-semibold text-zinc-900 dark:text-zinc-100">
                        <Link href={link} className="hover:text-blue-600 dark:hover:text-blue-400">
                          {credit.title}
                        </Link>
                      </td>

                      {/* Character Name / Role */}
                      <td className="py-2.5 px-4 text-zinc-600 dark:text-zinc-400">
                        {credit.character || credit.job || 'Self / Appearance'}
                      </td>

                      {/* Type */}
                      <td className="py-2.5 px-4">
                        <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                          {credit.media_type === 'movie' ? 'Movie' : 'TV Series'}
                        </span>
                      </td>

                      {/* Release Date */}
                      <td className="py-2.5 px-4 text-right font-mono text-zinc-500">
                        {credit.release_date?.slice(0, 4) || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
