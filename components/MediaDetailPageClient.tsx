'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import MediaDetailView from './MediaDetailView';
import MediaDetailRecovery from './MediaDetailRecovery';
import type { MediaItem } from '@/lib/types';

export default function MediaDetailPageClient({ mediaType }: { mediaType: 'movie' | 'tv' }) {
  const { id } = useParams<{ id: string }>();
  const [media, setMedia] = useState<MediaItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!/^\d+$/.test(id)) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    fetch(`/api/tmdb/${mediaType}/${id}`)
      .then(response => (response.ok ? response.json() as Promise<MediaItem> : null))
      .then(result => {
        if (cancelled) return;
        setMedia(result);
        setIsLoading(false);
      })
      .catch(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, mediaType]);

  if (media) return <MediaDetailView media={media} />;
  if (!isLoading && /^\d+$/.test(id)) return <MediaDetailRecovery mediaType={mediaType} mediaId={Number(id)} />;

  return <div className="min-h-[60vh] flex items-center justify-center text-sm text-zinc-500">Loading title details...</div>;
}