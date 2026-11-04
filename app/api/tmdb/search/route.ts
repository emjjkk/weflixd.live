import { NextRequest, NextResponse } from 'next/server';
import { searchAll } from '@/lib/tmdb';
import { tmdbJson } from '@/lib/tmdb-response';

export const revalidate = 86400;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  
  try {
    const results = await searchAll(q);
    return tmdbJson(results, 60);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Search failed' }, { status: 500 });
  }
}
