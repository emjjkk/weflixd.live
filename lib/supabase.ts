import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create client if configured
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export function isSupabaseConfigured(): boolean {
  return Boolean(supabase);
}

export interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  banner_image?: string;
  bio: string;
  provider: 'email' | 'discord' | 'google' | 'demo' | string;
  created_at: string;
}

export interface WatchedItem {
  id: string;
  media_id: number;
  media_type: 'movie' | 'tv';
  title: string;
  media_title?: string;
  poster_path: string;
  backdrop_path?: string;
  rating: number; // 0.5 to 5.0
  review?: string;
  watched_date: string;
  user_id: string;
  username: string;
  created_at: string;
}

export interface WatchlistItem {
  id: string;
  media_id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path: string;
  release_date?: string;
  vote_average?: number;
  user_id: string;
  created_at: string;
}

export interface FavoriteItem {
  id: string;
  media_id: number;
  media_type: 'movie' | 'tv' | 'person';
  title: string;
  poster_path: string;
  release_date?: string;
  vote_average?: number;
  user_id: string;
  created_at: string;
}

export interface FollowStats {
  followers: number;
  following: number;
  isFollowing: boolean;
}

export type FollowListType = 'followers' | 'following';

export interface ActivityItem {
  id: string;
  type: 'review' | 'watched';
  user_id: string;
  username: string;
  display_name?: string;
  user_avatar?: string;
  media_id: number;
  media_type: 'movie' | 'tv';
  media_title: string;
  content?: string;
  rating?: number;
  created_at: string;
  watched_date?: string;
}

export interface ReviewItem {
  id: string;
  media_id: number;
  media_type: 'movie' | 'tv';
  media_title: string;
  media_poster?: string;
  user_id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  rating: number; // 1-5
  content: string;
  watched_date?: string;
  created_at: string;
  upvotes: number;
  downvotes: number;
  user_vote?: 'up' | 'down' | null;
}

// -------------------------------------------------------------
// Real Supabase Database API Operations
// -------------------------------------------------------------

export async function fetchUserProfileDB(usernameOrId: string): Promise<UserProfile | null> {
  if (!supabase) return null;
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(usernameOrId);
    const query = supabase.from('profiles').select('*');
    const { data, error } = isUuid
      ? await query.eq('id', usernameOrId).maybeSingle()
      : await query.ilike('username', usernameOrId).maybeSingle();

    if (error || !data) return null;
    return {
      id: data.id,
      username: data.username,
      display_name: data.display_name || data.username,
      avatar_url: data.avatar_url || '',
      banner_image: data.banner_image || '',
      bio: data.bio || '',
      provider: data.provider || 'google',
      created_at: data.created_at,
    };
  } catch (err) {
    console.warn('[Supabase] fetchUserProfile error:', err);
    return null;
  }
}

export async function upsertUserProfileDB(profile: Partial<UserProfile> & { id: string; username: string }): Promise<UserProfile | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: profile.id,
        username: profile.username,
        display_name: profile.display_name || profile.username,
        avatar_url: profile.avatar_url,
        banner_image: profile.banner_image,
        bio: profile.bio,
        provider: profile.provider,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (error) {
      console.warn('[Supabase] upsertUserProfile error:', error.message);
      return null;
    }
    return data as UserProfile;
  } catch (err) {
    console.warn('[Supabase] upsertUserProfile exception:', err);
    return null;
  }
}

export async function searchProfilesDB(queryText: string): Promise<UserProfile[]> {
  if (!supabase || !queryText.trim()) return [];
  try {
    const cleanQ = queryText.trim().replace(/[%_]/g, '');
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`username.ilike.%${cleanQ}%,display_name.ilike.%${cleanQ}%`)
      .limit(10);
    if (error || !data) return [];
    return data.map(d => ({
      id: d.id,
      username: d.username,
      display_name: d.display_name || d.username,
      avatar_url: d.avatar_url || '',
      bio: d.bio || '',
      provider: d.provider || 'google',
      created_at: d.created_at,
    }));
  } catch (err) {
    console.warn('[Supabase] searchProfiles error:', err);
    return [];
  }
}

export async function fetchUserWatchlistDB(userId: string): Promise<WatchlistItem[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as WatchlistItem[];
  } catch (err) {
    console.warn('[Supabase] fetchUserWatchlist error:', err);
    return null;
  }
}

export async function addToWatchlistDB(item: Omit<WatchlistItem, 'id'>): Promise<WatchlistItem | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('watchlist')
      .upsert({
        user_id: item.user_id,
        media_id: item.media_id,
        media_type: item.media_type,
        title: item.title,
        poster_path: item.poster_path,
        release_date: item.release_date,
        vote_average: item.vote_average,
      }, { onConflict: 'user_id,media_id,media_type' })
      .select()
      .maybeSingle();

    if (error) throw error;
    return data as WatchlistItem;
  } catch (err) {
    console.warn('[Supabase] addToWatchlist error:', err);
    return null;
  }
}

export async function removeFromWatchlistDB(userId: string, mediaId: number, mediaType: 'movie' | 'tv'): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('watchlist')
      .delete()
      .match({ user_id: userId, media_id: mediaId, media_type: mediaType });

    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('[Supabase] removeFromWatchlist error:', err);
    return false;
  }
}

export async function fetchUserFavoritesDB(userId: string): Promise<FavoriteItem[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as FavoriteItem[];
  } catch (err) {
    console.warn('[Supabase] fetchUserFavorites error:', err);
    return null;
  }
}

export async function addToFavoritesDB(item: Omit<FavoriteItem, 'id'>): Promise<FavoriteItem | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('favorites')
      .upsert({
        user_id: item.user_id,
        media_id: item.media_id,
        media_type: item.media_type,
        title: item.title,
        poster_path: item.poster_path,
        release_date: item.release_date,
        vote_average: item.vote_average,
      }, { onConflict: 'user_id,media_id,media_type' })
      .select()
      .maybeSingle();

    if (error) throw error;
    return data as FavoriteItem;
  } catch (err) {
    console.warn('[Supabase] addToFavorites error:', err);
    return null;
  }
}

export async function removeFromFavoritesDB(userId: string, mediaId: number, mediaType: 'movie' | 'tv' | 'person'): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .match({ user_id: userId, media_id: mediaId, media_type: mediaType });

    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('[Supabase] removeFromFavorites error:', err);
    return false;
  }
}

export async function fetchFollowStatsDB(profileId: string, viewerId?: string): Promise<FollowStats> {
  if (!supabase) return { followers: 0, following: 0, isFollowing: false };
  try {
    const [{ count: followers }, { count: following }, followingResult] = await Promise.all([
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profileId),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profileId),
      viewerId
        ? supabase.from('follows').select('id').eq('follower_id', viewerId).eq('following_id', profileId).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);
    return { followers: followers || 0, following: following || 0, isFollowing: Boolean(followingResult.data) };
  } catch {
    return { followers: 0, following: 0, isFollowing: false };
  }
}

export async function fetchFollowProfilesDB(profileId: string, type: FollowListType): Promise<UserProfile[]> {
  if (!supabase) return [];
  try {
    const targetColumn = type === 'followers' ? 'following_id' : 'follower_id';
    const { data: follows, error: followsError } = await supabase
      .from('follows')
      .select('follower_id, following_id')
      .eq(targetColumn, profileId);

    if (followsError) throw followsError;
    const profileIds = (follows || [])
      .map(follow => type === 'followers' ? follow.follower_id : follow.following_id)
      .filter(Boolean);
    if (profileIds.length === 0) return [];

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('id', profileIds);

    if (error) throw error;
    return (data || []).map(profile => ({
      id: profile.id,
      username: profile.username,
      display_name: profile.display_name || profile.username,
      avatar_url: profile.avatar_url || '',
      banner_image: profile.banner_image || '',
      bio: profile.bio || '',
      provider: profile.provider || 'google',
      created_at: profile.created_at,
    }));
  } catch (err) {
    console.warn(`[Supabase] fetch ${type} error:`, err);
    return [];
  }
}

export async function toggleFollowDB(followerId: string, followingId: string, shouldFollow: boolean): Promise<boolean> {
  if (!supabase || followerId === followingId) return false;
  try {
    if (shouldFollow) {
      const { error } = await supabase.from('follows').upsert(
        { follower_id: followerId, following_id: followingId },
        { onConflict: 'follower_id,following_id' }
      );
      if (error) throw error;
    } else {
      const { error } = await supabase.from('follows').delete().match({ follower_id: followerId, following_id: followingId });
      if (error) throw error;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] toggleFollow error:', err);
    return false;
  }
}

export async function fetchFollowingActivityDB(userId: string): Promise<ActivityItem[]> {
  if (!supabase) return [];
  try {
    const { data: follows, error: followsError } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);
    if (followsError) throw followsError;
    const ids = (follows || []).map(follow => follow.following_id);
    if (ids.length === 0) return [];

    const [{ data: reviews, error: reviewsError }, { data: watched, error: watchedError }, { data: profiles }] = await Promise.all([
      supabase.from('reviews').select('*').in('user_id', ids).order('created_at', { ascending: false }).limit(50),
      supabase.from('watched').select('*').in('user_id', ids).order('created_at', { ascending: false }).limit(50),
      supabase.from('profiles').select('id, avatar_url').in('id', ids),
    ]);
    if (reviewsError) throw reviewsError;
    if (watchedError) throw watchedError;
    const avatarsByUserId = new Map((profiles || []).map(profile => [profile.id, profile.avatar_url || '']));

    return [
      ...(reviews || []).map(review => ({
        id: `review-${review.id}`,
        type: 'review' as const,
        user_id: review.user_id,
        username: review.username,
        display_name: review.display_name,
        user_avatar: avatarsByUserId.get(review.user_id) || '',
        media_id: review.media_id,
        media_type: review.media_type,
        media_title: review.media_title,
        content: review.content,
        rating: Number(review.rating),
        created_at: review.created_at,
        watched_date: review.watched_date,
      })),
      ...(watched || []).filter(item => !item.review).map(item => ({
        id: `watched-${item.id}`,
        type: 'watched' as const,
        user_id: item.user_id,
        username: item.username,
        media_id: item.media_id,
        media_type: item.media_type,
        media_title: item.title,
        content: item.review,
        rating: Number(item.rating),
        created_at: item.created_at,
        watched_date: item.watched_date,
      })),
    ].sort((a, b) => b.created_at.localeCompare(a.created_at));
  } catch (err) {
    console.warn('[Supabase] fetchFollowingActivity error:', err);
    return [];
  }
}

export async function fetchUserWatchedDB(userId: string): Promise<WatchedItem[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('watched')
      .select('*')
      .eq('user_id', userId)
      .order('watched_date', { ascending: false });

    if (error) throw error;
    return data as WatchedItem[];
  } catch (err) {
    console.warn('[Supabase] fetchUserWatched error:', err);
    return null;
  }
}

export async function upsertWatchedDB(item: Omit<WatchedItem, 'id'>): Promise<WatchedItem | null> {
  if (!supabase) return null;
  const watchedPayload = {
    user_id: item.user_id,
    username: item.username,
    media_id: item.media_id,
    media_type: item.media_type,
    title: item.title,
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    rating: item.rating,
    review: item.review,
    watched_date: item.watched_date,
  };

  try {
    const { data, error } = await supabase
      .from('watched')
      .upsert(watchedPayload, { onConflict: 'user_id,media_id,media_type' })
      .select()
      .maybeSingle();

    if (error) {
      // Older databases may not have the unique constraint required by upsert.
      if (error.code !== '42P10' && !error.message.toLowerCase().includes('on conflict')) {
        throw error;
      }

      const { data: existing, error: lookupError } = await supabase
        .from('watched')
        .select('id')
        .match({ user_id: item.user_id, media_id: item.media_id, media_type: item.media_type })
        .maybeSingle();

      if (lookupError) throw lookupError;

      const fallbackQuery = existing
        ? supabase.from('watched').update(watchedPayload).eq('id', existing.id)
        : supabase.from('watched').insert(watchedPayload);
      const { data: fallbackData, error: fallbackError } = await fallbackQuery.select().maybeSingle();

      if (fallbackError) throw fallbackError;
      return fallbackData as WatchedItem;
    }

    return data as WatchedItem;
  } catch (err) {
    console.warn('[Supabase] upsertWatched error:', err);
    return null;
  }
}

export async function fetchReviewsDB(options?: {
  mediaId?: number;
  mediaType?: 'movie' | 'tv';
  username?: string;
  limit?: number;
}): Promise<ReviewItem[] | null> {
  if (!supabase) return null;
  try {
    let query = supabase.from('reviews').select('*').order('created_at', { ascending: false });
    if (options?.mediaId && options?.mediaType) {
      query = query.eq('media_id', options.mediaId).eq('media_type', options.mediaType);
    }
    if (options?.username) {
      query = query.ilike('username', options.username);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    const rows = data || [];
    const userIds = [...new Set(rows.map((row: any) => row.user_id).filter(Boolean))];
    const { data: profiles } = userIds.length
      ? await supabase.from('profiles').select('id, avatar_url, display_name').in('id', userIds)
      : { data: [] };
    const profilesById = new Map((profiles || []).map((profile: any) => [profile.id, profile]));

    return (data || []).map((r: any) => ({
      id: r.id,
      media_id: r.media_id,
      media_type: r.media_type,
      media_title: r.media_title,
      media_poster: r.media_poster,
      user_id: r.user_id,
      username: r.username,
      display_name: profilesById.get(r.user_id)?.display_name || r.display_name,
      avatar_url: profilesById.get(r.user_id)?.avatar_url || '',
      rating: Number(r.rating),
      content: r.content,
      watched_date: r.watched_date,
      created_at: r.created_at,
      upvotes: r.upvotes || 0,
      downvotes: r.downvotes || 0,
    }));
  } catch (err) {
    console.warn('[Supabase] fetchReviews error:', err);
    return null;
  }
}

export async function insertReviewDB(review: Omit<ReviewItem, 'id' | 'created_at' | 'upvotes' | 'downvotes'>): Promise<ReviewItem | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        user_id: review.user_id,
        username: review.username,
        display_name: review.display_name || review.username,
        media_id: review.media_id,
        media_type: review.media_type,
        media_title: review.media_title,
        media_poster: review.media_poster,
        rating: review.rating,
        content: review.content,
        watched_date: review.watched_date || new Date().toISOString().split('T')[0],
      })
      .select()
      .maybeSingle();

    if (error) throw error;
    return data as ReviewItem;
  } catch (err) {
    console.warn('[Supabase] insertReview error:', err);
    return null;
  }
}

export async function voteReviewDB(reviewId: string, userId: string, voteType: 'up' | 'down'): Promise<boolean> {
  if (!supabase) return false;
  try {
    // Upsert the user's vote
    const { error } = await supabase
      .from('review_votes')
      .upsert({
        review_id: reviewId,
        user_id: userId,
        vote_type: voteType,
      }, { onConflict: 'review_id,user_id' });

    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('[Supabase] voteReview error:', err);
    return false;
  }
}

export async function fetchUserVotesDB(userId: string): Promise<Record<string, 'up' | 'down'>> {
  if (!supabase) return {};
  try {
    const { data, error } = await supabase
      .from('review_votes')
      .select('review_id, vote_type')
      .eq('user_id', userId);

    if (error || !data) return {};
    const map: Record<string, 'up' | 'down'> = {};
    for (const v of data) {
      map[v.review_id] = v.vote_type as 'up' | 'down';
    }
    return map;
  } catch {
    return {};
  }
}
