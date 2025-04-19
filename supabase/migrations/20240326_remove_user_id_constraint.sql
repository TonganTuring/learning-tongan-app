-- Drop the foreign key constraint
ALTER TABLE public.flashcards
DROP CONSTRAINT IF EXISTS "flashcards_user_id_fkey";

-- Make user_id nullable since we're using clerk_user_id now
ALTER TABLE public.flashcards
ALTER COLUMN user_id DROP NOT NULL; 