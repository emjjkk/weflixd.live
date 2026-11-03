import { NextRequest, NextResponse } from 'next/server';
import { getMediaRecommendations } from '@/lib/tmdb';
import { tmdbJson } from '@/lib/tmdb-response';

export async function GET(req: NextRequest) {
  const params = new URL(req.url).searchParams;
  const type = params.get('type');
  const id = params.get('id');

  if ((type !== 'movie' && type !== 'tv') || !id || !/^\d+$/.test(id)) {
    return NextResponse.json({ error: 'Invalid media identifier' }, { status: 400 });
  }

  try {
    return tmdbJson({ results: await getMediaRecommendations(id, type) }, 3600);
  } catch (err: any) {
    console.error('[API tmdb/recommendations error]:', err);
    return NextResponse.json({ error: err?.message || 'Failed to fetch recommendations' }, { status: 500 });
  }
}