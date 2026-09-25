-- Review avatars are resolved from the user's profile at read time.
ALTER TABLE public.reviews DROP COLUMN IF EXISTS user_avatar;