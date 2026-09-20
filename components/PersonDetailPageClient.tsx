'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import PersonDetailView from './PersonDetailView';
import type { PersonItem } from '@/lib/types';

export default function PersonDetailPageClient() {
  const { id } = useParams<{ id: string }>();
  const [person, setPerson] = useState<PersonItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!/^\d+$/.test(id)) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    fetch(`/api/tmdb/people/${id}`)
      .then(response => (response.ok ? response.json() as Promise<PersonItem> : null))
      .then(result => {
        if (cancelled) return;
        setPerson(result);
        setIsLoading(false);
      })
      .catch(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (person) return <PersonDetailView person={person} />;
  return <div className="min-h-[60vh] flex items-center justify-center text-sm text-zinc-500">{isLoading ? 'Loading person details...' : 'Person not found.'}</div>;
}