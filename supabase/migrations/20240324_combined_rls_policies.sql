-- Disable RLS temporarily
ALTER TABLE public.flashcards DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT
  USING (clerk_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE
  USING (clerk_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Create policies for flashcards table
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

-- Re-enable RLS
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY; 