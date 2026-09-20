'use client';

import React, { useEffect, useState } from 'react';
import Image from '@/components/RemoteImage';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, User, X } from 'lucide-react';
import { PersonItem } from '@/lib/types';

interface PeopleCatalogProps {
  initialPeople: PersonItem[];
  totalPages?: number;
}

export default function PeopleCatalog({ initialPeople, totalPages = 1 }: PeopleCatalogProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get('page') || '1');
  const [query, setQuery] = useState('');
  const [people, setPeople] = useState(initialPeople);
  const [pageCount, setPageCount] = useState(totalPages);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query.trim() && currentPage === 1) {
      setPeople(initialPeople);
      setPageCount(totalPages);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    const params = new URLSearchParams({ page: String(currentPage) });
    if (query.trim()) params.set('query', query.trim());
    fetch(`/api/tmdb/people?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        setPeople(Array.isArray(data.results) ? data.results : []);
        setPageCount(data.total_pages || 1);
      })
      .catch(() => {
        if (isMounted) setPeople([]);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentPage, initialPeople, totalPages, query]);

  const updatePage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) params.delete('page');
    else params.set('page', String(page));
    router.push(`/people${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (currentPage !== 1) updatePage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
          Personalities & Cast
        </h1>
        <p className="text-sm text-zinc-500">
          Search actors, directors, writers, and cinema creators.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          placeholder="Search actors, directors, writers..."
          className="w-full pl-9 pr-8 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              if (currentPage !== 1) updatePage(1);
            }}
            className="absolute right-2.5 top-2.5 p-0.5 text-zinc-400 hover:text-zinc-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* People Grid */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 border-2 border-zinc-900 dark:border-zinc-100 border-t-transparent animate-spin rounded-full" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
          {people.map(person => (
          <Link
            key={person.id}
            href={`/people/${person.id}`}
            className="group flex flex-col p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-xs"
          >
            <div className="relative w-full aspect-square rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 mx-auto">
              {person.profile_path ? (
                <Image
                  src={person.profile_path}
                  alt={person.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <User className="w-12 h-12 m-auto text-zinc-400" />
              )}
            </div>

            <div className="mt-3 text-center">
              <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {person.name}
              </h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                {person.known_for_department}
              </p>
              {person.known_for && person.known_for.length > 0 && (
                <p className="text-[10px] text-zinc-400 truncate mt-1">
                  {person.known_for.map(k => k.title).join(', ')}
                </p>
              )}
            </div>
            </Link>
          ))}
        </div>
      )}

      <div className="flex items-center justify-center gap-3 pt-6 border-t border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          disabled={currentPage <= 1 || isLoading}
          onClick={() => updatePage(currentPage - 1)}
          className="px-3 py-1.5 text-xs font-medium rounded-md border border-zinc-200 dark:border-zinc-800 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          Previous
        </button>
        <span className="text-xs text-zinc-500">Page {currentPage} of {pageCount}</span>
        <button
          type="button"
          disabled={currentPage >= pageCount || isLoading}
          onClick={() => updatePage(currentPage + 1)}
          className="px-3 py-1.5 text-xs font-medium rounded-md border border-zinc-200 dark:border-zinc-800 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          Next
        </button>
      </div>
    </div>
  );
}
