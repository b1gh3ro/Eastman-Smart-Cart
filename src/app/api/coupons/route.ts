import { route } from '@/lib/api';
import { createClient } from '@/lib/supabase';

// GET /api/coupons — offers to show on the cart page.
export const GET = route(async () => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('coupons')
    .select('code, description, min_order')
    .eq('is_active', true)
    .order('min_order');
  if (error) throw error;
  return data;
});
