import { NextResponse } from 'next/server';

const DEFAULT_BROWSER_MAX_AGE_SECONDS = 300;

/**
 * Keep TMDB responses in the browser only. `private` prevents Next/Vercel
 * from turning these responses into shared CDN or ISR cache entries.
 */
export function tmdbJson<T>(data: T, maxAgeSeconds = DEFAULT_BROWSER_MAX_AGE_SECONDS): NextResponse<T> {
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': `private, max-age=${maxAgeSeconds}, stale-while-revalidate=${maxAgeSeconds}`,
    },
  });
}
