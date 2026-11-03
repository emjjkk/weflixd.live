'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import MediaDetailView from './MediaDetailView';
import type { MediaItem } from '@/lib/types';

interface MediaDetailRecoveryProps {
  mediaType: 'movie' | 'tv';
  mediaId: number;
}

export default function MediaDetailRecovery({ mediaType, mediaId }: MediaDetailRecoveryProps) {
  const [media, setMedia] = useState<MediaItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const response = await fetch(`/api/tmdb/${mediaType}/${mediaId}`);
          if (response.ok) {
            const result = (await response.json()) as MediaItem;
            if (!cancelled) {
              setMedia(result);
              setIsLoading(false);
            }
            return;
          }
        } catch {
          // Retry transient network failures below.
        }

        await new Promise(resolve => setTimeout(resolve, 300 * (attempt + 1)));
      }

      if (!cancelled) setIsLoading(false);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [mediaId, mediaType]);

  if (media) return <MediaDetailView media={media} />;

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
      {isLoading ? (
        <p className="text-sm text-zinc-500 animate-pulse">Loading title details...</p>
      ) : (
        <>
          <p className="text-sm text-zinc-500">This title is taking longer than expected.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-sm font-semibold"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </>
      )}
    </div>
  );
}
