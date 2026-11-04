import { NextRequest, NextResponse } from 'next/server';
import { getMediaDetails } from '@/lib/tmdb';
import { tmdbJson } from '@/lib/tmdb-response';

export const revalidate = 86400;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const { type, id } = await params;
  if ((type !== 'movie' && type !== 'tv') || !/^\d+$/.test(id)) {
    return NextResponse.json({ error: 'Invalid media identifier' }, { status: 400 });
  }

  try {
    const media = await getMediaDetails(Number(id), type);
    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }
    return tmdbJson(media, 3600);
  } catch (err: any) {
    console.error('[API tmdb/details error]:', err);
    return NextResponse.json({ error: err?.message || 'Failed to fetch media details' }, { status: 500 });
  }
}