import { requireUser, route } from '@/lib/api';

// GET /api/auth/me — the logged-in user and their profile.
export const GET = route(async () => {
  const { supabase, user } = await requireUser();

  const { data: profile, error } = await supabase.from('profiles').select('name').eq('id', user.id).single();
  if (error) throw error;
  return { id: user.id, email: user.email, name: profile.name };
});
