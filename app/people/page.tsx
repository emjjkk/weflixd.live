import React, { Suspense } from 'react';
import PeopleCatalog from '@/components/PeopleCatalog';
import { getPopularPeople } from '@/lib/tmdb';
import type { Metadata } from 'next';
import { createMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = createMetadata({
  title: 'Explore People',
  description: 'Explore actors, directors, writers, and other film and television creators on Weflixd.',
  path: '/people',
});

export default async function PeoplePage() {
  const people = await getPopularPeople();
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto p-8 text-center text-zinc-400">Loading people catalog...</div>}>
      <PeopleCatalog initialPeople={people.results} totalPages={people.total_pages} />
    </Suspense>
  );
}
