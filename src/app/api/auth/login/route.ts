import { ApiError, readBody, route } from '@/lib/api';
import { createClient } from '@/lib/supabase';

// POST /api/auth/login { email, password } — sets the login cookie.
export const POST = route(async (req) => {
  const { email, password } = await readBody(req);
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    throw new ApiError(400, 'Email and password are required.');
  }
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw new ApiError(401, error.message);
  return { id: data.user.id, email: data.user.email };
});
