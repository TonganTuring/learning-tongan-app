import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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