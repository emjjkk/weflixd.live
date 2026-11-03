import { NextRequest, NextResponse } from 'next/server';
import { getPersonDetails } from '@/lib/tmdb';
import { tmdbJson } from '@/lib/tmdb-response';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: 'Invalid person identifier' }, { status: 400 });
  }

  try {
    const person = await getPersonDetails(Number(id));
    return person
      ? tmdbJson(person, 3600)
      : NextResponse.json({ error: 'Person not found' }, { status: 404 });
  } catch (err: any) {
    console.error('[API tmdb/person error]:', err);
    return NextResponse.json({ error: err?.message || 'Failed to fetch person' }, { status: 500 });
  }
}