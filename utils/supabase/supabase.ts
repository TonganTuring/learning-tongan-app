import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const createServerSupabaseClient = async () => {
  const { getToken } = await auth();
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${getToken({ template: 'supabase' })}`,
      },
    },
  });
};

export const createClientSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey);
}; 