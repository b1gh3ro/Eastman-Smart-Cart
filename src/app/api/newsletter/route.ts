import { ApiError, readBody, route } from '@/lib/api';
import { createClient } from '@/lib/supabase';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/newsletter { email } — signing up twice is fine.
export const POST = route(async (req) => {
  const email = String((await readBody(req)).email ?? '').trim().toLowerCase();
  if (email.length > 254 || !EMAIL.test(email)) throw new ApiError(400, 'Please enter a valid email address.');

  const supabase = await createClient();
  const { error } = await supabase.from('newsletter_subscribers').insert({ email });
  if (error && error.code !== '23505') throw error; // 23505 = already subscribed
  return { ok: true };
});
