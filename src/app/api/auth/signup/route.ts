import { ApiError, route } from '@/lib/api';
import { createClient } from '@/lib/supabase';

// POST /api/auth/signup { name, email, password }
export const POST = route(async (req) => {
  const { name, email, password } = await req.json();
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
  if (error) throw new ApiError(400, error.message);
  return { id: data.user?.id, email: data.user?.email };
});
