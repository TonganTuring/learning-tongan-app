-- Create flashcards table
CREATE TABLE IF NOT EXISTS public.flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tongan_phrase TEXT NOT NULL,
  english_phrase TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'none' CHECK (status IN ('none', 'good', 'bad', 'ok')),
  last_reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own flashcards" ON public.flashcards
  FOR SELECT
  USING (user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

CREATE POLICY "Users can insert their own flashcards" ON public.flashcards
  FOR INSERT
  WITH CHECK (user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

CREATE POLICY "Users can update their own flashcards" ON public.flashcards
  FOR UPDATE
  USING (user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

CREATE POLICY "Users can delete their own flashcards" ON public.flashcards
  FOR DELETE
  USING (user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

-- Create indexes
CREATE INDEX IF NOT EXISTS flashcards_user_id_idx ON public.flashcards(user_id);
CREATE INDEX IF NOT EXISTS flashcards_status_idx ON public.flashcards(status);
CREATE INDEX IF NOT EXISTS flashcards_last_reviewed_at_idx ON public.flashcards(last_reviewed_at); 