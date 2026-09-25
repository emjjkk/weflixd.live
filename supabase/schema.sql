-- ==============================================================================
-- WEFLIXD: COMPLETE SUPABASE DATABASE MIGRATION & SCHEMA
-- Supports: Profiles, Watched Diary, Watchlist, Favorites, Reviews & Voting
-- Real-time enabled, Row Level Security (RLS) configured, and Triggers included
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USER PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  banner_image TEXT,
  bio TEXT DEFAULT 'Cinema explorer on Weflixd.',
  provider TEXT DEFAULT 'google',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::TEXT, NOW()) NOT NULL
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banner_image TEXT;

-- Index for fast username lookups (e.g. /profile/:username)
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- 3. WATCHED DIARY TABLE (Movies & TV shows logged by users with ratings)
CREATE TABLE IF NOT EXISTS public.watched (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  username TEXT NOT NULL,
  media_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  title TEXT NOT NULL,
  poster_path TEXT,
  backdrop_path TEXT,
  rating NUMERIC(3, 1) NOT NULL CHECK (rating >= 0.5 AND rating <= 5.0),
  review TEXT,
  watched_date DATE DEFAULT CURRENT_DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::TEXT, NOW()) NOT NULL,
  CONSTRAINT unique_user_watched_media UNIQUE (user_id, media_id, media_type)
);

CREATE INDEX IF NOT EXISTS idx_watched_user_id ON public.watched(user_id);
CREATE INDEX IF NOT EXISTS idx_watched_media ON public.watched(media_id, media_type);
CREATE INDEX IF NOT EXISTS idx_watched_date ON public.watched(watched_date DESC);
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_watched_media_idx
  ON public.watched(user_id, media_id, media_type);

-- 4. WATCHLIST TABLE
CREATE TABLE IF NOT EXISTS public.watchlist (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  media_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  title TEXT NOT NULL,
  poster_path TEXT,
  release_date TEXT,
  vote_average NUMERIC(3, 1),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::TEXT, NOW()) NOT NULL,
  CONSTRAINT unique_user_watchlist_media UNIQUE (user_id, media_id, media_type)
);

CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON public.watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_created_at ON public.watchlist(created_at DESC);

-- 5. FAVORITES TABLE (Favorite movies, TV shows, and people)
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  media_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv', 'person')),
  title TEXT NOT NULL,
  poster_path TEXT,
  release_date TEXT,
  vote_average NUMERIC(3, 1),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::TEXT, NOW()) NOT NULL,
  CONSTRAINT unique_user_favorites_media UNIQUE (user_id, media_id, media_type)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);

-- Allow existing installations to store people in the shared favorites table.
ALTER TABLE public.favorites DROP CONSTRAINT IF EXISTS favorites_media_type_check;
ALTER TABLE public.favorites ADD CONSTRAINT favorites_media_type_check CHECK (media_type IN ('movie', 'tv', 'person'));

-- 6. USER FOLLOWS
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::TEXT, NOW()) NOT NULL,
  CONSTRAINT unique_user_follow UNIQUE (follower_id, following_id),
  CONSTRAINT prevent_self_follow CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);

-- 6. COMMUNITY REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  username TEXT NOT NULL,
  display_name TEXT,
  media_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  media_title TEXT NOT NULL,
  media_poster TEXT,
  rating NUMERIC(3, 1) NOT NULL CHECK (rating >= 0.5 AND rating <= 5.0),
  content TEXT NOT NULL,
  watched_date DATE DEFAULT CURRENT_DATE,
  upvotes INTEGER DEFAULT 0 NOT NULL,
  downvotes INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::TEXT, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reviews_media ON public.reviews(media_id, media_type);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

-- 7. REVIEW VOTES TABLE (Upvotes / Downvotes tracking per user)
CREATE TABLE IF NOT EXISTS public.review_votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::TEXT, NOW()) NOT NULL,
  CONSTRAINT unique_review_user_vote UNIQUE (review_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_review_votes_review_id ON public.review_votes(review_id);

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watched ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone can view public profiles; owners can update their own
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Watched: Anyone can view logs (public diary); authenticated users can insert/update/delete their own
DROP POLICY IF EXISTS "Watched logs are viewable by everyone" ON public.watched;
CREATE POLICY "Watched logs are viewable by everyone"
  ON public.watched FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert into their watched log" ON public.watched;
CREATE POLICY "Users can insert into their watched log"
  ON public.watched FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own watched log" ON public.watched;
CREATE POLICY "Users can update their own watched log"
  ON public.watched FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete from their watched log" ON public.watched;
CREATE POLICY "Users can delete from their watched log"
  ON public.watched FOR DELETE USING (auth.uid() = user_id);

-- Watchlist: Anyone can view watchlists; owners can manage
DROP POLICY IF EXISTS "Watchlist is viewable by everyone" ON public.watchlist;
CREATE POLICY "Watchlist is viewable by everyone"
  ON public.watchlist FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert into their watchlist" ON public.watchlist;
CREATE POLICY "Users can insert into their watchlist"
  ON public.watchlist FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete from their watchlist" ON public.watchlist;
CREATE POLICY "Users can delete from their watchlist"
  ON public.watchlist FOR DELETE USING (auth.uid() = user_id);

-- Favorites: Anyone can view favorites; owners can manage
DROP POLICY IF EXISTS "Favorites are viewable by everyone" ON public.favorites;
CREATE POLICY "Favorites are viewable by everyone"
  ON public.favorites FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert into their favorites" ON public.favorites;
CREATE POLICY "Users can insert into their favorites"
  ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete from their favorites" ON public.favorites;
CREATE POLICY "Users can delete from their favorites"
  ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- Follows: relationships are public; users manage their own outgoing follows
DROP POLICY IF EXISTS "Follows are viewable by everyone" ON public.follows;
CREATE POLICY "Follows are viewable by everyone"
  ON public.follows FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can follow from their own account" ON public.follows;
CREATE POLICY "Users can follow from their own account"
  ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can remove their own follows" ON public.follows;
CREATE POLICY "Users can remove their own follows"
  ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- Reviews: Anyone can read reviews; authenticated owners can insert/update/delete
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own reviews" ON public.reviews;
CREATE POLICY "Users can insert their own reviews"
  ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
CREATE POLICY "Users can update their own reviews"
  ON public.reviews FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;
CREATE POLICY "Users can delete their own reviews"
  ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- Review Votes: Anyone can view votes; users can cast and change votes
DROP POLICY IF EXISTS "Review votes are viewable by everyone" ON public.review_votes;
CREATE POLICY "Review votes are viewable by everyone"
  ON public.review_votes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their review votes" ON public.review_votes;
CREATE POLICY "Users can insert their review votes"
  ON public.review_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their review votes" ON public.review_votes;
CREATE POLICY "Users can update their review votes"
  ON public.review_votes FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their review votes" ON public.review_votes;
CREATE POLICY "Users can delete their review votes"
  ON public.review_votes FOR DELETE USING (auth.uid() = user_id);

-- ==============================================================================
-- 9. AUTOMATIC TRIGGERS
-- ==============================================================================

-- A. Auto-create profile when a user signs up via OAuth (Google / Discord)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url, bio, provider)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'preferred_username',
      NEW.raw_user_meta_data->>'user_name',
      NEW.raw_user_meta_data->>'username',
      LOWER(REGEXP_REPLACE(COALESCE(NEW.raw_user_meta_data->>'full_name', ''), '\s+', '_', 'g')),
      SPLIT_PART(COALESCE(NEW.email, 'watcher'), '@', 1)
    ),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Watcher'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    'Cinema explorer on Weflixd.',
    COALESCE(NEW.raw_app_meta_data->>'provider', 'google')
  )
  ON CONFLICT (id) DO UPDATE SET
    username = COALESCE(EXCLUDED.username, public.profiles.username),
    avatar_url = EXCLUDED.avatar_url,
    display_name = EXCLUDED.display_name,
    bio = COALESCE(NULLIF(EXCLUDED.bio, ''), public.profiles.bio),
    provider = COALESCE(EXCLUDED.provider, public.profiles.provider),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- B. Auto-recalculate review upvotes and downvotes tally on vote change
CREATE OR REPLACE FUNCTION public.handle_review_vote()
RETURNS TRIGGER AS $$
DECLARE
  target_review_id UUID;
BEGIN
  target_review_id := COALESCE(NEW.review_id, OLD.review_id);
  
  UPDATE public.reviews
  SET
    upvotes = (SELECT COUNT(*) FROM public.review_votes WHERE review_id = target_review_id AND vote_type = 'up'),
    downvotes = (SELECT COUNT(*) FROM public.review_votes WHERE review_id = target_review_id AND vote_type = 'down')
  WHERE id = target_review_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_vote_changed ON public.review_votes;
CREATE TRIGGER on_review_vote_changed
  AFTER INSERT OR UPDATE OR DELETE ON public.review_votes
  FOR EACH ROW EXECUTE PROCEDURE public.handle_review_vote();

-- ==============================================================================
-- 10. REALTIME CONFIGURATION
-- ==============================================================================
-- Enable Realtime events for live updates across browser clients
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.watched;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.watchlist;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.favorites;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.review_votes;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Handle gracefully if already added or restricted
  NULL;
END $$;
