import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Flashcard related functions
export const getFlashcards = async (userId: string) => {
  const { data, error } = await supabase
    .from('flashcards')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const addFlashcard = async (
  tonganPhrase: string,
  englishPhrase: string,
  userId: string
) => {
  const { data, error } = await supabase
    .from('flashcards')
    .insert([{
      tongan_phrase: tonganPhrase,
      english_phrase: englishPhrase,
      user_id: userId,
      status: 'new'
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateFlashcardStatus = async (
  id: string,
  status: 'new' | 'learning' | 'review' | 'mastered'
) => {
  const { data, error } = await supabase
    .from('flashcards')
    .update({
      status,
      last_reviewed_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteFlashcard = async (id: string) => {
  const { error } = await supabase
    .from('flashcards')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// User related functions
export const updateUserProgress = async (
  userId: string,
  currentBook: string,
  currentChapter: number
) => {
  const { data, error } = await supabase
    .from('users')
    .update({
      current_book: currentBook,
      current_chapter: currentChapter
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getUserProgress = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('current_book, current_chapter')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
};

// Example of a typed database helper
type Todo = {
  id: number;
  created_at: string;
  title: string;
  completed: boolean;
  user_id: string;
};

export const getTodos = async (userId: string) => {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Todo[];
};

export const addTodo = async (title: string, userId: string) => {
  const { data, error } = await supabase
    .from('todos')
    .insert([{ title, user_id: userId, completed: false }])
    .select()
    .single();

  if (error) throw error;
  return data as Todo;
};

export const updateTodo = async (id: number, completed: boolean) => {
  const { data, error } = await supabase
    .from('todos')
    .update({ completed })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Todo;
};

export const deleteTodo = async (id: number) => {
  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('id', id);

  if (error) throw error;
}; 