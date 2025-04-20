-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  current_book TEXT DEFAULT 'book1',
  current_chapter INTEGER DEFAULT 1,
  vocab_goal INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT
  USING (clerk_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE
  USING (clerk_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert their own data" ON public.users
  FOR INSERT
  WITH CHECK (clerk_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Create indexes
CREATE INDEX IF NOT EXISTS users_clerk_id_idx ON public.users(clerk_id);
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email); 