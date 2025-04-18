import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create a Supabase client for server-side operations with admin privileges
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Create a Supabase client for server-side operations with user context
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