-- Enable real-time for posts table
ALTER TABLE public.posts REPLICA IDENTITY FULL;

-- Add posts table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;

-- Ensure the posts table has proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_media_type ON public.posts(media_type);