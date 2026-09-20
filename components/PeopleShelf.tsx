'use client';

import React, { useRef } from 'react';
import Image from '@/components/RemoteImage';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, User } from 'lucide-react';
import { PersonItem } from '@/lib/types';

interface PeopleShelfProps {
  title: string;
  people: PersonItem[];
}

export default function PeopleShelf({ title, people }: PeopleShelfProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, clientWidth } = scrollContainerRef.current;
    const scrollAmount = clientWidth * 0.75;
    scrollContainerRef.current.scrollTo({
      left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <section className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {title}
        </h2>
        <div className="flex items-center gap-2">
          <Link
            href="/people"
            className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white mr-2 transition-colors"
          >
            Explore all people →
          </Link>
          <button
            type="button"
            onClick={() => scroll('left')}
            className="p-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            className="p-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto pb-3 pt-1 no-scrollbar scroll-smooth"
      >
        {people.map(person => (
          <Link
            key={person.id}
            href={`/people/${person.id}`}
            className="group flex flex-col items-center justify-center text-center w-28 sm:w-32 flex-shrink-0"
          >
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 group-hover:border-zinc-400 dark:group-hover:border-zinc-500 transition-colors shadow-xs flex items-center justify-center">
              {person.profile_path ? (
                <Image
                  src={person.profile_path}
                  alt={person.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <User className="w-10 h-10 m-auto text-zinc-400" />
              )}
            </div>
            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mt-2 truncate w-full group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {person.name}
            </p>
            <p className="text-[11px] text-zinc-500 truncate w-full">
              {person.known_for_department}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
