import { NextRequest, NextResponse } from 'next/server';
import { getPopularPeople, searchPeople } from '@/lib/tmdb';
import { tmdbJson } from '@/lib/tmdb-response';

export async function GET(req: NextRequest) {
  const page = Math.max(1, Number(new URL(req.url).searchParams.get('page') || '1'));
  const query = new URL(req.url).searchParams.get('query')?.trim() || '';

  try {
    return tmdbJson(query ? await searchPeople(query, page) : await getPopularPeople(page), query ? 60 : 300);
  } catch (err: any) {
    console.error('[API tmdb/people error]:', err);
    return NextResponse.json({ error: err?.message || 'Failed to fetch people' }, { status: 500 });
  }
}