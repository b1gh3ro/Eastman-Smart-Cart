import { ApiError, readBody, route } from '@/lib/api';
import { createClient } from '@/lib/supabase';

// POST /api/auth/signup { name, email, password }
// needsConfirmation is true when Supabase wants the email confirmed before logging in.
export const POST = route(async (req) => {
  const { name, email, password } = await readBody(req);
  if (typeof email !== 'string' || !email.includes('@')) throw new ApiError(400, 'Please enter a valid email address.');
  if (typeof password !== 'string' || password.length < 6) throw new ApiError(400, 'Password must be at least 6 characters.');
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { name: typeof name === 'string' ? name.trim().slice(0, 100) : '' } },
  });
  if (error) throw new ApiError(400, error.message);
  return { id: data.user?.id, email: data.user?.email, needsConfirmation: !data.session };
});
