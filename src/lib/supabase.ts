import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Supabase client for server code. It knows who is logged in from the request cookies,
// and row level security (see supabase/schema.sql) limits queries to that user's own rows.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    },
  );
}
