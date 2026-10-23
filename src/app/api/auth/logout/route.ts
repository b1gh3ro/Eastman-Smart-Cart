import { route } from '@/lib/api';
import { createClient } from '@/lib/supabase';

// POST /api/auth/logout — clears the login cookie.
export const POST = route(async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return { ok: true };
});
