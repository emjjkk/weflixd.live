import { MediaItem, PersonItem, Genre, WatchProvidersResult, FilmographyCredit } from '@/lib/types';
import { MOVIE_GENRES, TV_GENRES } from '@/lib/data/genres';
import { getCached, getStaleCached, setCached, checkRateLimit } from '@/lib/redis-cache';
import { getWatchProviderUrl } from '@/lib/providers';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMG_BASE = 'https://image.tmdb.org/t/p';
const inFlightRequests = new Map<string, Promise<unknown>>();

export function getTMDBImageUrl(path: string | null, size: 'w300' | 'w500' | 'w780' | 'original' = 'w780'): string {
  if (!path) return 'https://picsum.photos/seed/movieplaceholder/780/1170';
  if (path.startsWith('http')) return path;
  return `${TMDB_IMG_BASE}/${size}${path}`;
}

// Derive a theme color palette based on movie genres or id
export function derivePalette(media: Partial<MediaItem>): { dominant: string; accent: string; text: string } {
  if (media.palette) return media.palette;
  const genres = media.genres || [];
  const genreNames = genres.map(g => g.name.toLowerCase());
  const genreIds = media.genre_ids || [];

  if (genreNames.includes('sci-fi') || genreIds.includes(878) || genreIds.includes(10765)) {
    return { dominant: '#0284c7', accent: '#38bdf8', text: '#ffffff' }; // sky/cyan
  }
  if (genreNames.includes('action') || genreIds.includes(28) || genreIds.includes(10759)) {
    return { dominant: '#dc2626', accent: '#ef4444', text: '#ffffff' }; // crimson
  }
  if (genreNames.includes('drama') || genreIds.includes(18)) {
    return { dominant: '#d97706', accent: '#f59e0b', text: '#ffffff' }; // warm amber
  }
  if (genreNames.includes('animation') || genreIds.includes(16)) {
    return { dominant: '#7c3aed', accent: '#a78bfa', text: '#ffffff' }; // purple
  }
  if (genreNames.includes('horror') || genreIds.includes(27)) {
    return { dominant: '#991b1b', accent: '#f87171', text: '#ffffff' }; // blood red
  }
  if (genreNames.includes('comedy') || genreIds.includes(35)) {
    return { dominant: '#059669', accent: '#34d399', text: '#ffffff' }; // emerald
  }
  return { dominant: '#2563eb', accent: '#60a5fa', text: '#ffffff' };
}

async function fetchFromTMDB<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T | null> {
  const apiKey = process.env.TMDB_API_KEY?.trim().replace(/^(['"])(.*)\1$/, '$2');
  if (!apiKey) return null;

  const queryParams = new URLSearchParams();
  // Support both v3 api_key query param and v4 Bearer token
  if (apiKey.startsWith('ey') || apiKey.length > 50) {
    // bearer token
  } else {
    queryParams.set('api_key', apiKey);
  }

  for (const [key, val] of Object.entries(params)) {
    queryParams.set(key, String(val));
  }

  const url = `${TMDB_BASE_URL}${endpoint}?${queryParams.toString()}`;
  const cacheKey = `tmdb:${endpoint}:${queryParams.toString()}`;

  const cached = await getCached<T>(cacheKey);
  if (cached) return cached;

  const inFlight = inFlightRequests.get(cacheKey) as Promise<T | null> | undefined;
  if (inFlight) return inFlight;

  const request = fetchFreshFromTMDB<T>(endpoint, params, cacheKey, url, apiKey);
  inFlightRequests.set(cacheKey, request);

  try {
    return await request;
  } finally {
    inFlightRequests.delete(cacheKey);
  }
}

async function fetchFreshFromTMDB<T>(
  endpoint: string,
  _params: Record<string, string | number>,
  cacheKey: string,
  url: string,
  apiKey: string
): Promise<T | null> {
  const stale = getStaleCached<T>(cacheKey);

  if (!checkRateLimit()) {
    console.warn('[TMDB] Rate limit exceeded, serving from fallback');
    return stale;
  }

  try {
    const headers: Record<string, string> = { 'Accept': 'application/json' };
    if (apiKey.startsWith('ey') || apiKey.length > 50) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const res = await fetch(url, { headers, cache: 'no-store' });
      if (res.ok) {
        const data = await res.json() as T;
        await setCached(cacheKey, data, 3600);
        return data;
      }
      console.warn(`[TMDB] HTTP ${res.status} for ${endpoint} (attempt ${attempt + 1})`);
      if (res.status !== 429 && res.status < 500) return stale;
      if (attempt < 2) {
        await new Promise(resolve => setTimeout(resolve, 300 * (attempt + 1)));
      }
    }
    return stale;
  } catch (err) {
    console.warn('[TMDB] Fetch error:', err);
    return stale;
  }
}

// Formatting TMDB raw response into MediaItem
function formatTMDBItem(raw: any, type: 'movie' | 'tv'): MediaItem {
  const isMovie = type === 'movie' || Boolean(raw.title);
  const mediaType: 'movie' | 'tv' = isMovie ? 'movie' : 'tv';
  
  const item: MediaItem = {
    id: raw.id,
    title: raw.title || raw.name || 'Untitled',
    name: raw.name || raw.title,
    original_title: raw.original_title,
    original_name: raw.original_name,
    overview: raw.overview || 'No overview available.',
    poster_path: raw.poster_path ? getTMDBImageUrl(raw.poster_path, 'w780') : null,
    backdrop_path: raw.backdrop_path ? getTMDBImageUrl(raw.backdrop_path, 'original') : null,
    release_date: raw.release_date || raw.first_air_date,
    first_air_date: raw.first_air_date,
    vote_average: Number((raw.vote_average || 0).toFixed(1)),
    vote_count: raw.vote_count || 0,
    popularity: raw.popularity || 0,
    genre_ids: raw.genre_ids || (raw.genres ? raw.genres.map((g: any) => g.id) : []),
    genres: raw.genres || [],
    media_type: mediaType,
    runtime: raw.runtime,
    number_of_seasons: raw.number_of_seasons,
    number_of_episodes: raw.number_of_episodes,
    status: raw.status,
    tagline: raw.tagline,
    original_language: raw.original_language,
    origin_country: raw.origin_country || [],
    budget: raw.budget,
    revenue: raw.revenue,
  };

  if (raw.credits) {
    item.cast = (raw.credits.cast || []).slice(0, 10).map((c: any) => ({
      id: c.id,
      name: c.name,
      character: c.character,
      profile_path: c.profile_path ? getTMDBImageUrl(c.profile_path, 'w300') : null,
      order: c.order,
    }));
  }

  if (raw.videos?.results) {
    item.trailers = raw.videos.results
      .filter((v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'))
      .map((v: any) => ({
        id: v.id,
        key: v.key,
        name: v.name,
        site: v.site,
        type: v.type,
        official: v.official,
      }));
  }

  if (raw['watch/providers']?.results) {
    const usProviders = raw['watch/providers'].results.US || raw['watch/providers'].results[Object.keys(raw['watch/providers'].results)[0]];
    if (usProviders) {
      const mediaTitle = item.title || item.name || '';
      const mediaType = item.media_type;
      const justWatchLink = usProviders.link;
      item.watch_providers = {
        link: justWatchLink,
        flatrate: usProviders.flatrate?.map((p: any) => ({
          ...p,
          logo_path: getTMDBImageUrl(p.logo_path, 'w300'),
          url: getWatchProviderUrl(p.provider_name, mediaTitle, mediaType, justWatchLink),
        })),
        rent: usProviders.rent?.map((p: any) => ({
          ...p,
          logo_path: getTMDBImageUrl(p.logo_path, 'w300'),
          url: getWatchProviderUrl(p.provider_name, mediaTitle, mediaType, justWatchLink),
        })),
        buy: usProviders.buy?.map((p: any) => ({
          ...p,
          logo_path: getTMDBImageUrl(p.logo_path, 'w300'),
          url: getWatchProviderUrl(p.provider_name, mediaTitle, mediaType, justWatchLink),
        })),
      };
    }
  }

  if (raw.recommendations?.results && Array.isArray(raw.recommendations.results)) {
    item.recommendations = raw.recommendations.results.slice(0, 10).map((rec: any) => ({
      id: rec.id,
      title: rec.title || rec.name || 'Untitled',
      name: rec.name || rec.title,
      overview: rec.overview || '',
      poster_path: rec.poster_path ? getTMDBImageUrl(rec.poster_path, 'w500') : null,
      backdrop_path: rec.backdrop_path ? getTMDBImageUrl(rec.backdrop_path, 'w780') : null,
      release_date: rec.release_date || rec.first_air_date,
      vote_average: Number((rec.vote_average || 0).toFixed(1)),
      vote_count: rec.vote_count || 0,
      popularity: rec.popularity || 0,
      media_type: (rec.media_type as 'movie' | 'tv') || mediaType,
    }));
  }

  item.palette = derivePalette(item);
  return item;
}

export async function getTrendingMedia(type: 'all' | 'movie' | 'tv' = 'all', timeWindow: 'day' | 'week' = 'week'): Promise<MediaItem[]> {
  const data = await fetchFromTMDB<{ results: any[] }>(`/trending/${type}/${timeWindow}`);
  if (data?.results?.length) {
    return data.results.map(r => formatTMDBItem(r, r.media_type || (type === 'tv' ? 'tv' : 'movie')));
  }
  return [];
}

export async function getPopularMovies(params: { page?: number; genre?: string; sortBy?: string; country?: string } = {}): Promise<{ results: MediaItem[]; total_pages: number; total_results: number }> {
  const genre = params.genre;
  const country = params.country;
  const queryParams: Record<string, string | number> = {
    page: params.page || 1,
    sort_by: params.sortBy || 'popularity.desc',
  };

  if (genre) {
    const matchedGenre = MOVIE_GENRES.find(g => g.slug === genre || String(g.id) === genre || g.name.toLowerCase() === genre.toLowerCase());
    if (matchedGenre) queryParams['with_genres'] = matchedGenre.id;
  }

  if (country) {
    queryParams['with_origin_country'] = country;
  }

  const data = await fetchFromTMDB<{ results: any[]; total_pages: number; total_results: number }>(`/discover/movie`, queryParams);
  if (data?.results?.length) {
    return {
      results: data.results.map(r => formatTMDBItem(r, 'movie')),
      total_pages: Math.min(data.total_pages, 50),
      total_results: data.total_results,
    };
  }

  return { results: [], total_pages: 1, total_results: 0 };
}

export async function getPopularTV(params: { page?: number; genre?: string; sortBy?: string; country?: string } = {}): Promise<{ results: MediaItem[]; total_pages: number; total_results: number }> {
  const genre = params.genre;
  const country = params.country;
  const queryParams: Record<string, string | number> = {
    page: params.page || 1,
    sort_by: params.sortBy || 'popularity.desc',
  };

  if (genre) {
    const matchedGenre = TV_GENRES.find(g => g.slug === genre || String(g.id) === genre || g.name.toLowerCase() === genre.toLowerCase());
    if (matchedGenre) queryParams['with_genres'] = matchedGenre.id;
  }

  if (country) {
    queryParams['with_origin_country'] = country;
  }

  const data = await fetchFromTMDB<{ results: any[]; total_pages: number; total_results: number }>(`/discover/tv`, queryParams);
  if (data?.results?.length) {
    return {
      results: data.results.map(r => formatTMDBItem(r, 'tv')),
      total_pages: Math.min(data.total_pages, 50),
      total_results: data.total_results,
    };
  }

  return { results: [], total_pages: 1, total_results: 0 };
}

export async function getMediaDetails(id: number | string, type: 'movie' | 'tv'): Promise<MediaItem | null> {
  const params = { append_to_response: 'credits,videos,watch/providers,recommendations' };
  let data = await fetchFromTMDB<any>(`/${type}/${id}`, params);

  // A detail request can race the first cold-start TMDB request. Retry once
  // before treating a valid numeric ID as a missing title.
  if (!data) {
    data = await fetchFromTMDB<any>(`/${type}/${id}`, params);
  }

  if (data) {
    return formatTMDBItem(data, type);
  }

  return null;
}

export async function getMediaRecommendations(id: number | string, type: 'movie' | 'tv'): Promise<MediaItem[]> {
  const data = await fetchFromTMDB<{ results: any[] }>(`/${type}/${id}/recommendations`, { language: 'en-US', page: 1 });
  return data?.results?.map(item => formatTMDBItem(item, type)) || [];
}

export async function getTrendingPeople(): Promise<PersonItem[]> {
  const data = await fetchFromTMDB<{ results: any[] }>(`/trending/person/week`);
  if (data?.results?.length) {
    return data.results.map(formatTMDBPerson);
  }
  return [];
}

function formatTMDBPerson(person: any): PersonItem {
  return {
    id: person.id,
    name: person.name,
    profile_path: person.profile_path ? getTMDBImageUrl(person.profile_path, 'w500') : null,
    known_for_department: person.known_for_department || 'Acting',
    popularity: person.popularity || 50,
    known_for: (person.known_for || []).map((item: any) => formatTMDBItem(item, item.media_type || 'movie')),
  };
}

export async function getPopularPeople(page = 1): Promise<{ results: PersonItem[]; total_pages: number; total_results: number }> {
  const data = await fetchFromTMDB<{ results: any[]; total_pages: number; total_results: number }>(`/person/popular`, { page });
  if (data?.results?.length) {
    return {
      results: data.results.map(formatTMDBPerson),
      total_pages: Math.min(data.total_pages, 50),
      total_results: data.total_results,
    };
  }
  return { results: [], total_pages: 1, total_results: 0 };
}

export async function searchPeople(query: string, page = 1): Promise<{ results: PersonItem[]; total_pages: number; total_results: number }> {
  const data = await fetchFromTMDB<{ results: any[]; total_pages: number; total_results: number }>(`/search/person`, {
    query,
    page,
  });
  if (data?.results?.length) {
    return {
      results: data.results.map(formatTMDBPerson),
      total_pages: Math.min(data.total_pages, 50),
      total_results: data.total_results,
    };
  }
  return { results: [], total_pages: 1, total_results: 0 };
}

export async function getPersonDetails(id: number | string): Promise<PersonItem | null> {
  const data = await fetchFromTMDB<any>(`/person/${id}`, {
    append_to_response: 'combined_credits',
  });

  if (data) {
    let combinedCredits = data.combined_credits;
    if (!combinedCredits || (!combinedCredits.cast?.length && !combinedCredits.crew?.length)) {
      const fallbackCredits = await fetchFromTMDB<any>(`/person/${id}/combined_credits`);
      if (fallbackCredits) {
        combinedCredits = fallbackCredits;
      }
    }

    const rawCast = (combinedCredits?.cast || []) as any[];
    const rawCrew = (combinedCredits?.crew || []) as any[];

    // Build comprehensive filmography credits map
    const filmographyMap = new Map<string, FilmographyCredit>();

    for (const c of rawCast) {
      if (!c || !c.id) continue;
      const mediaType: 'movie' | 'tv' = c.media_type === 'tv' ? 'tv' : 'movie';
      const role = c.character || 'Self / Appearance';
      const key = `${mediaType}-${c.id}-${role}`;
      filmographyMap.set(key, {
        id: c.id,
        title: c.title || c.name || 'Untitled',
        character: role,
        job: 'Actor',
        department: 'Acting',
        release_date: c.release_date || c.first_air_date || '',
        poster_path: c.poster_path ? getTMDBImageUrl(c.poster_path, 'w500') : null,
        media_type: mediaType,
        popularity: c.popularity || 0,
        vote_average: c.vote_average || 0,
      });
    }

    for (const c of rawCrew) {
      if (!c || !c.id) continue;
      const mediaType: 'movie' | 'tv' = c.media_type === 'tv' ? 'tv' : 'movie';
      const role = c.job || c.department || 'Crew';
      const key = `${mediaType}-${c.id}-${role}`;
      filmographyMap.set(key, {
        id: c.id,
        title: c.title || c.name || 'Untitled',
        character: role,
        job: c.job || role,
        department: c.department || '',
        release_date: c.release_date || c.first_air_date || '',
        poster_path: c.poster_path ? getTMDBImageUrl(c.poster_path, 'w500') : null,
        media_type: mediaType,
        popularity: c.popularity || 0,
        vote_average: c.vote_average || 0,
      });
    }

    const filmography: FilmographyCredit[] = Array.from(filmographyMap.values());

    // Compute known_for items: top prominent works with posters & high popularity
    const allUnique = new Map<string, any>();
    for (const item of [...rawCast, ...rawCrew]) {
      if (!item || !item.id) continue;
      const mediaType = item.media_type === 'tv' ? 'tv' : 'movie';
      const key = `${mediaType}-${item.id}`;
      if (!allUnique.has(key) || ((item.popularity || 0) > (allUnique.get(key).popularity || 0))) {
        allUnique.set(key, item);
      }
    }

    const knownForItems = Array.from(allUnique.values())
      .sort((a, b) => {
        const scoreA = (a.poster_path ? 200 : 0) + (a.vote_count || 0) * 0.1 + (a.popularity || 0);
        const scoreB = (b.poster_path ? 200 : 0) + (b.vote_count || 0) * 0.1 + (b.popularity || 0);
        return scoreB - scoreA;
      })
      .slice(0, 10)
      .map(item => formatTMDBItem(item, item.media_type === 'tv' ? 'tv' : 'movie'));

    const creditsCast = rawCast.slice(0, 25).map((c: any) => formatTMDBItem(c, c.media_type === 'tv' ? 'tv' : 'movie'));
    const creditsCrew = rawCrew.slice(0, 15).map((c: any) => formatTMDBItem(c, c.media_type === 'tv' ? 'tv' : 'movie'));

    return {
      id: data.id,
      name: data.name,
      profile_path: data.profile_path ? getTMDBImageUrl(data.profile_path, 'original') : null,
      biography: data.biography,
      birthday: data.birthday,
      deathday: data.deathday,
      place_of_birth: data.place_of_birth,
      known_for_department: data.known_for_department || 'Acting',
      popularity: data.popularity || 50,
      known_for: knownForItems,
      filmography,
      credits: {
        cast: creditsCast,
        crew: creditsCrew,
      },
    };
  }

  return null;
}

export async function searchAll(query: string): Promise<{
  movies: MediaItem[];
  tv: MediaItem[];
  people: PersonItem[];
}> {
  if (!query.trim()) {
    return {
      movies: [],
      tv: [],
      people: [],
    };
  }

  const data = await fetchFromTMDB<{ results: any[] }>(`/search/multi`, { query });
  if (data?.results?.length) {
    const movies: MediaItem[] = [];
    const tv: MediaItem[] = [];
    const people: PersonItem[] = [];

    for (const item of data.results) {
      if (item.media_type === 'movie') {
        movies.push(formatTMDBItem(item, 'movie'));
      } else if (item.media_type === 'tv') {
        tv.push(formatTMDBItem(item, 'tv'));
      } else if (item.media_type === 'person') {
        people.push({
          id: item.id,
          name: item.name,
          profile_path: item.profile_path ? getTMDBImageUrl(item.profile_path, 'w500') : null,
          known_for_department: item.known_for_department || 'Acting',
          popularity: item.popularity || 20,
          known_for: (item.known_for || []).map((k: any) => formatTMDBItem(k, k.media_type || 'movie')),
        });
      }
    }

    return { movies, tv, people };
  }

  return { movies: [], tv: [], people: [] };
}
