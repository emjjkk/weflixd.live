'use client';

import React, { useState, useEffect } from 'react';
import Image from '@/components/RemoteImage';
import Link from 'next/link';
import {
  Heart,
  Bookmark,
  CheckCircle2,
  Star,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Settings,
  UserPlus,
  UserCheck,
  User,
} from 'lucide-react';
import MediaCard from './MediaCard';
import { useMedia } from '@/context/MediaContext';
import { useAuth } from '@/context/AuthContext';
import { useModal } from '@/context/ModalContext';
import { MediaItem } from '@/lib/types';
import {
  supabase,
  UserProfile,
  FavoriteItem,
  WatchlistItem,
  WatchedItem,
  ReviewItem,
  fetchUserProfileDB,
  fetchUserFavoritesDB,
  fetchUserWatchlistDB,
  fetchUserWatchedDB,
  fetchReviewsDB,
  fetchFollowStatsDB,
  fetchFollowProfilesDB,
  FollowListType,
  toggleFollowDB,
  FollowStats,
} from '@/lib/supabase';

interface UserProfileViewProps {
  username: string;
}

type ProfileTab = 'favorites' | 'watched' | 'watchlist' | 'reviews';
type FavoriteFilter = 'movie' | 'tv' | 'person';

function FollowList({
  type,
  profiles,
  onClose,
}: {
  type: 'followers' | 'following';
  profiles: UserProfile[];
  onClose: () => void;
}) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            {type === 'followers' ? 'Followers' : 'Following'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Close
          </button>
        </div>

        {profiles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {profiles.map(profile => (
              <Link
                key={profile.id}
                href={`/profile/${encodeURIComponent(profile.username)}`}
                className="flex items-center gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/70 transition-colors"
              >
                <div className="relative w-9 h-9 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 flex-shrink-0 flex items-center justify-center">
                  {profile.avatar_url ? (
                    <Image src={profile.avatar_url} alt={profile.username} fill className="object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User className="w-4 h-4 text-zinc-500" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{profile.display_name}</p>
                  <p className="text-xs text-zinc-500 truncate">@{profile.username}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="py-5 text-center text-xs text-zinc-500">
            {type === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
          </p>
        )}
      </div>
    </section>
  );
}

export default function UserProfileView({ username }: UserProfileViewProps) {
  const { user: authUser } = useAuth();
  const { showToast } = useModal();
  const {
    favorites: myFavorites,
    watchlist: myWatchlist,
    watchedLog: myWatchedLog,
    reviews: myReviews,
    voteReview,
  } = useMedia();

  const isCurrentUser = Boolean(authUser?.username && authUser.username.toLowerCase() === username.toLowerCase());

  const [activeTab, setActiveTab] = useState<ProfileTab>('favorites');
  const [isLoadingProfile, setIsLoadingProfile] = useState(!isCurrentUser);
  const [profileNotFound, setProfileNotFound] = useState(false);
  const [dbProfile, setDbProfile] = useState<UserProfile | null>(null);
  const [dbFavorites, setDbFavorites] = useState<FavoriteItem[] | null>(null);
  const [dbWatchlist, setDbWatchlist] = useState<WatchlistItem[] | null>(null);
  const [dbWatchedLog, setDbWatchedLog] = useState<WatchedItem[] | null>(null);
  const [dbReviews, setDbReviews] = useState<ReviewItem[] | null>(null);
  const [followStats, setFollowStats] = useState<FollowStats>({ followers: 0, following: 0, isFollowing: false });
  const [followerProfiles, setFollowerProfiles] = useState<UserProfile[]>([]);
  const [followingProfiles, setFollowingProfiles] = useState<UserProfile[]>([]);
  const [activeFollowList, setActiveFollowList] = useState<FollowListType | null>(null);
  const [favoriteFilter, setFavoriteFilter] = useState<FavoriteFilter>('movie');

  useEffect(() => {
    if (!isCurrentUser) {
      if (!supabase) {
        setIsLoadingProfile(false);
        setProfileNotFound(true);
        return;
      }

      setIsLoadingProfile(true);
      fetchUserProfileDB(username)
        .then(async (prof) => {
          if (prof) {
            setDbProfile(prof);
            setProfileNotFound(false);
            const [favs, wl, watched, revs, stats] = await Promise.all([
              fetchUserFavoritesDB(prof.id),
              fetchUserWatchlistDB(prof.id),
              fetchUserWatchedDB(prof.id),
              fetchReviewsDB({ username: prof.username }),
              fetchFollowStatsDB(prof.id, authUser?.id),
            ]);
            setDbFavorites(favs || []);
            setDbWatchlist(wl || []);
            setDbWatchedLog(watched || []);
            setDbReviews(revs || []);
            setFollowStats(stats);
          } else {
            setProfileNotFound(true);
          }
        })
        .catch(() => {
          setProfileNotFound(true);
        })
        .finally(() => {
          setIsLoadingProfile(false);
        });
    }
  }, [username, isCurrentUser, authUser?.id]);

  useEffect(() => {
    if (!isCurrentUser || !authUser?.id) return;
    fetchFollowStatsDB(authUser.id, authUser.id).then(setFollowStats);
  }, [isCurrentUser, authUser?.id]);

  const profileId = isCurrentUser ? authUser?.id : dbProfile?.id;

  useEffect(() => {
    if (!profileId) return;
    Promise.all([
      fetchFollowProfilesDB(profileId, 'followers'),
      fetchFollowProfilesDB(profileId, 'following'),
    ]).then(([followers, following]) => {
      setFollowerProfiles(followers);
      setFollowingProfiles(following);
    });
  }, [profileId]);

  if (!isCurrentUser && isLoadingProfile) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <p className="text-sm text-zinc-500 animate-pulse">Loading profile for @{username}...</p>
      </div>
    );
  }

  if (!isCurrentUser && profileNotFound) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center space-y-4 shadow-xs">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Member Not Found</h2>
        <p className="text-xs text-zinc-500">
          The member <span className="font-semibold text-zinc-700 dark:text-zinc-300">@{username}</span> has not created a profile on Weflixd yet.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex px-4 py-2 text-xs font-semibold rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  // Profile data
  const profileName = isCurrentUser
    ? authUser?.display_name || authUser?.username || username
    : dbProfile?.display_name || dbProfile?.username || username;

  const avatarUrl = isCurrentUser ? authUser?.avatar_url || '' : dbProfile?.avatar_url || '';

  const bannerImage = isCurrentUser
    ? authUser?.banner_image || 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1800&q=80'
    : dbProfile?.banner_image || 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1800&q=80';

  const provider = isCurrentUser
    ? authUser?.provider || 'google'
    : dbProfile?.provider || 'google';

  const bio = isCurrentUser
    ? authUser?.bio || ''
    : dbProfile?.bio || '';

  // Resolved collections
  const favorites = isCurrentUser ? myFavorites : (dbFavorites || []);
  const watchlist = isCurrentUser ? myWatchlist : (dbWatchlist || []);
  const watchedLog = isCurrentUser ? myWatchedLog : (dbWatchedLog || []);
  const userReviews = isCurrentUser
    ? (authUser?.username ? myReviews.filter(r => r.username.toLowerCase() === authUser.username.toLowerCase()) : [])
    : (dbReviews || []);
  const movieFavorites = favorites.filter(item => item.media_type === 'movie');
  const tvFavorites = favorites.filter(item => item.media_type === 'tv');
  const peopleFavorites = favorites.filter(item => item.media_type === 'person');
  const visibleFavorites = favoriteFilter === 'movie' ? movieFavorites : favoriteFilter === 'tv' ? tvFavorites : peopleFavorites;

  const handleFollow = async () => {
    if (!authUser || isCurrentUser || !dbProfile) return;
    const nextFollowing = !followStats.isFollowing;
    setFollowStats(prev => ({
      ...prev,
      isFollowing: nextFollowing,
      followers: prev.followers + (nextFollowing ? 1 : -1),
    }));
    const saved = await toggleFollowDB(authUser.id, dbProfile.id, nextFollowing);
    if (!saved) {
      setFollowStats(prev => ({
        ...prev,
        isFollowing: !nextFollowing,
        followers: prev.followers + (nextFollowing ? -1 : 1),
      }));
    } else {
      showToast(nextFollowing ? `You are now following @${dbProfile.username}.` : `Unfollowed @${dbProfile.username}.`);
    }
  };

  return (
    <div className="w-full pb-10">
      <div className="relative w-full h-[280px] bg-zinc-200 dark:bg-zinc-950 overflow-hidden">
        <Image
          src={bannerImage}
          alt={`${profileName} profile banner`}
          fill
          priority
          className="object-cover object-center opacity-70 dark:opacity-60"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-50 via-zinc-50/50 to-transparent dark:from-zinc-950 dark:via-zinc-950/45 dark:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-50/60 via-transparent to-transparent dark:from-zinc-950/60 dark:via-transparent dark:to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 sm:-mt-24 relative z-10">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-zinc-50 dark:border-zinc-950 flex-shrink-0 bg-zinc-800 shadow-2xl">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={username}
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <User className="w-12 h-12 m-auto text-zinc-400" />
            )}
          </div>

          <div className="flex-1 min-w-0 pt-6 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-regular tracking-tight text-zinc-900 dark:text-zinc-50 capitalize">
                {profileName}
              </h1>
              <span className="text-2xl text-zinc-500">@{username}</span>
            </div>

            {bio ? <p className="text-sm text-zinc-600 dark:text-zinc-300 max-w-2xl">{bio}</p> : null}

            <div className="flex items-center gap-4 text-xs text-zinc-500">
              {[
                { type: 'followers' as const, label: 'Followers', count: followStats.followers },
                { type: 'following' as const, label: 'Following', count: followStats.following },
              ].map(item => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setActiveFollowList(activeFollowList === item.type ? null : item.type)}
                  className="text-left hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  <strong className="text-zinc-900 dark:text-zinc-100">{item.count}</strong> {item.label}
                </button>
              ))}
            </div>
          </div>
          {isCurrentUser && (
            <Link
              href="/settings"
              className="sm:mt-12 inline-flex items-center gap-2 px-4 py-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-sm font-semibold text-zinc-700 dark:text-zinc-300 transition-colors ml-auto sm:ml-2"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </Link>
          )}
          {!isCurrentUser && authUser && (
            <button
              type="button"
              onClick={handleFollow}
              className={`sm:mt-12 inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ml-auto sm:ml-2 ${followStats.isFollowing
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
            >
              {followStats.isFollowing ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
              {followStats.isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
      </div>

      {activeFollowList && (
        <FollowList
          type={activeFollowList}
          profiles={activeFollowList === 'followers' ? followerProfiles : followingProfiles}
          onClose={() => setActiveFollowList(null)}
        />
      )}

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-4 overflow-x-auto no-scrollbar">
        {[
          { id: 'favorites', label: 'Favorites', icon: Heart, count: favorites.length },
          { id: 'watched', label: 'Recently Watched', icon: CheckCircle2, count: watchedLog.length },
          { id: 'watchlist', label: 'Watchlist', icon: Bookmark, count: watchlist.length },
          { id: 'reviews', label: 'Reviews', icon: MessageSquare, count: userReviews.length },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as ProfileTab)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${isActive
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span className="opacity-60 text-[10px]">({tab.count})</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-5">
        {/* FAVORITES TAB */}
        {activeTab === 'favorites' && (
          <div>
            <div className="flex items-center gap-2 mb-5 border-zinc-200 dark:border-zinc-800 pb-2">
              {[
                { id: 'movie' as const, label: 'Movies', count: movieFavorites.length },
                { id: 'tv' as const, label: 'TV Shows', count: tvFavorites.length },
                { id: 'person' as const, label: 'People', count: peopleFavorites.length },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFavoriteFilter(tab.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md ${favoriteFilter === tab.id ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
            {visibleFavorites.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                {visibleFavorites.map(item => {
                  if (item.media_type === 'person') {
                    return (
                      <Link key={`person-${item.media_id}`} href={`/people/${item.media_id}`} className="group space-y-2">
                        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800">
                          {item.poster_path ? <Image src={item.poster_path} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" /> : null}
                        </div>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{item.title}</p>
                        <p className="text-[10px] uppercase font-bold text-zinc-500">Person</p>
                      </Link>
                    );
                  }
                  const mediaItem: MediaItem = {
                    id: item.media_id,
                    media_type: item.media_type,
                    title: item.title,
                    overview: '',
                    poster_path: item.poster_path,
                    backdrop_path: item.poster_path,
                    release_date: item.release_date,
                    vote_average: item.vote_average || 8.0,
                    vote_count: 100,
                    popularity: 50,
                  };
                  return <MediaCard key={`${item.media_type}-${item.media_id}`} media={mediaItem} />;
                })}
              </div>
            ) : (
              <div className="py-16 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2">
                <Heart className="w-8 h-8 text-zinc-400 mx-auto" />
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  No favorites added yet
                </p>
                <p className="text-xs text-zinc-500">
                  Click the heart icon on any movie or TV show to feature it on your profile.
                </p>
                <Link
                  href="/movie"
                  className="inline-block mt-2 px-4 py-2 text-xs font-semibold rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                >
                  Browse Movies
                </Link>
              </div>
            )}
          </div>
        )}

        {/* RECENTLY WATCHED TAB */}
        {activeTab === 'watched' && (
          <div className="space-y-4">
            {watchedLog.length > 0 ? (
              <div className="space-y-3">
                {watchedLog.map(log => {
                  const mediaLink = `/${log.media_type}/${log.media_id}`;
                  return (
                    <div
                      key={log.id}
                      className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <Link
                          href={mediaLink}
                          className="relative w-14 h-20 rounded-md overflow-hidden bg-zinc-800 flex-shrink-0 border border-zinc-200 dark:border-zinc-700"
                        >
                          {log.poster_path ? (
                            <Image
                              src={log.poster_path}
                              alt={log.title || log.media_title || 'Media'}
                              fill
                              className="object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : null}
                        </Link>
                        <div className="min-w-0 space-y-1">
                          <Link
                            href={mediaLink}
                            className="text-sm font-bold text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 truncate block"
                          >
                            {log.title || log.media_title}
                          </Link>
                          <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">
                              {log.media_type}
                            </span>
                            <span>·</span>
                            <span>Watched on {log.watched_date}</span>
                          </div>
                          {log.review && (
                            <p className="text-xs text-zinc-600 dark:text-zinc-300 italic pt-1 line-clamp-2">
                              &ldquo;{log.review}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>

                      {/* User's rating */}
                      <div className="flex items-center gap-1 text-amber-500 font-bold text-sm bg-zinc-50 dark:bg-zinc-800 px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700">
                        <Star className="w-4 h-4 fill-amber-500" />
                        <span>{log.rating} / 5</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2">
                <CheckCircle2 className="w-8 h-8 text-zinc-400 mx-auto" />
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  Watched log is empty
                </p>
                <p className="text-xs text-zinc-500">
                  Mark movies as &ldquo;I&apos;ve Watched This&rdquo; to build your cinema diary.
                </p>
              </div>
            )}
          </div>
        )}

        {/* WATCHLIST TAB */}
        {activeTab === 'watchlist' && (
          <div>
            {watchlist.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                {watchlist.map(item => {
                  const mediaItem: MediaItem = {
                    id: item.media_id,
                    media_type: item.media_type,
                    title: item.title,
                    overview: '',
                    poster_path: item.poster_path,
                    backdrop_path: item.poster_path,
                    release_date: item.release_date,
                    vote_average: item.vote_average || 8.0,
                    vote_count: 100,
                    popularity: 50,
                  };
                  return <MediaCard key={`${item.media_type}-${item.media_id}`} media={mediaItem} />;
                })}
              </div>
            ) : (
              <div className="py-16 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2">
                <Bookmark className="w-8 h-8 text-zinc-400 mx-auto" />
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  Your watchlist is empty
                </p>
                <p className="text-xs text-zinc-500">
                  Click &ldquo;Add to Watchlist&rdquo; on any title to save it for later.
                </p>
              </div>
            )}
          </div>
        )}

        {/* REVIEWS TAB */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            {userReviews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userReviews.map(rev => (
                  <div
                    key={rev.id}
                    className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3 shadow-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <Link
                          href={`/${rev.media_type}/${rev.media_id}`}
                          className="text-sm font-bold text-zinc-900 dark:text-zinc-100 hover:underline"
                        >
                          {rev.media_title}
                        </Link>
                        <p className="text-[11px] text-zinc-500">
                          {rev.watched_date || 'Recently logged'}
                        </p>
                      </div>
                      <div className="flex items-center text-amber-500 text-xs font-semibold">
                        {'★'.repeat(Math.floor(rev.rating))}
                        <span className="text-zinc-600 dark:text-zinc-400 ml-1">
                          {rev.rating}/5
                        </span>
                      </div>
                    </div>

                    <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
                      {rev.content}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => voteReview(rev.id, 'up')}
                          className={`flex items-center gap-1 ${rev.user_vote === 'up' ? 'text-emerald-500 font-bold' : ''
                            }`}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>{rev.upvotes}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => voteReview(rev.id, 'down')}
                          className={`flex items-center gap-1 ${rev.user_vote === 'down' ? 'text-rose-500 font-bold' : ''
                            }`}
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                          <span>{rev.downvotes}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2">
                <MessageSquare className="w-8 h-8 text-zinc-400 mx-auto" />
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  No reviews written yet
                </p>
                <p className="text-xs text-zinc-500">
                  Share your impressions, critiques, and thoughts on films and series.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
