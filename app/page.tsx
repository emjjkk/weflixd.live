import React from 'react';
import HeroBanner from '@/components/HeroBanner';
import HorizontalShelf from '@/components/HorizontalShelf';
import PeopleShelf from '@/components/PeopleShelf';
import GenresGrid from '@/components/GenresGrid';
import RecommendedShelf from '@/components/RecommendedShelf';
import RecentReviewsFeed from '@/components/RecentReviewsFeed';
import { getTrendingMedia, getTrendingPeople, getPopularMovies } from '@/lib/tmdb';

export const revalidate = 3600;

export default async function HomePage() {
  const results = await Promise.allSettled([
    getTrendingMedia('all', 'week'),
    getTrendingMedia('movie', 'day'),
    getTrendingMedia('tv', 'day'),
    getPopularMovies({ sortBy: 'release_date.desc' }),
    getTrendingPeople(),
  ]);
  const [trendingAllResult, trendingMoviesResult, trendingTVResult, latestMoviesResult, trendingPeopleResult] = results;

  const trendingAll = trendingAllResult.status === 'fulfilled' ? trendingAllResult.value : [];
  const trendingMovies = trendingMoviesResult.status === 'fulfilled' ? trendingMoviesResult.value : [];
  const trendingTV = trendingTVResult.status === 'fulfilled' ? trendingTVResult.value : [];
  const latestMovies = latestMoviesResult.status === 'fulfilled' ? latestMoviesResult.value : { results: [] };
  const trendingPeople = trendingPeopleResult.status === 'fulfilled' ? trendingPeopleResult.value : [];

  return (
    <div className="w-full flex flex-col space-y-12 pb-16">
      {/* Large Animated Banner */}
      <HeroBanner items={trendingAll} />

      {/* Main Body Containers */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-12">
        {/* Recommended for user (if logged in or personalized prompt) */}
        <RecommendedShelf />

        {/* Trending Movies Shelf */}
        <HorizontalShelf
          id="trending-movies-shelf"
          title="Trending Movies"
          subtitle="Top cinema picks generating buzz this week"
          items={trendingMovies}
          viewAllLink="/movie?sort_by=popularity.desc&page=1"
        />

        {/* Trending TV Shows Shelf */}
        <HorizontalShelf
          id="trending-tv-shelf"
          title="Trending TV Series"
          subtitle="Critically acclaimed shows currently streaming"
          items={trendingTV}
          viewAllLink="/tv?sort_by=popularity.desc&page=1"
        />

        {/* Latest Releases Shelf */}
        <HorizontalShelf
          id="latest-releases-shelf"
          title="Latest Releases"
          subtitle="Newly premiered in theaters and digital platforms"
          items={latestMovies.results}
          viewAllLink="/movie?sort_by=release_date.desc&page=1"
        />

        {/* Trending Personalities */}
        <PeopleShelf
          title="Trending Personalities"
          people={trendingPeople}
        />

        {/* Genres Exploration */}
        <GenresGrid />

        {/* Community Reviews Feed (Letterboxd Style) */}
        <RecentReviewsFeed />
      </div>
    </div>
  );
}
