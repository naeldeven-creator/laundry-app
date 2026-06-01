import { createClient } from '@supabase/supabase-js';

/**
 * Membuat instance Supabase client server-side yang menyertakan token JWT user.
 * Ini memastikan Row Level Security (RLS) di database Supabase berfungsi dengan benar.
 * @param {Request} req - Objek request Next.js
 */
export function getSupabaseServer(req) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader ? authHeader.replace('Bearer ', '') : null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

  if (token) {
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        persistSession: false,
      },
    });
  }

  // Jika tidak ada token (anonim/belum login)
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  });
}
