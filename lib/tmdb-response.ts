import { NextResponse } from 'next/server';

const DEFAULT_BROWSER_MAX_AGE_SECONDS = 300;
const CDN_MAX_AGE_SECONDS = 86400;

/**
 * TMDB responses are public and keyed entirely by their request URL, so they
 * can be shared safely by browsers and the Vercel CDN.
 */
export function tmdbJson<T>(data: T, maxAgeSeconds = DEFAULT_BROWSER_MAX_AGE_SECONDS): NextResponse<T> {
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': `public, max-age=${DEFAULT_BROWSER_MAX_AGE_SECONDS}`,
      'Vercel-CDN-Cache-Control': `public, s-maxage=${Math.max(maxAgeSeconds, CDN_MAX_AGE_SECONDS)}, stale-while-revalidate=3600`,
    },
  });
}
