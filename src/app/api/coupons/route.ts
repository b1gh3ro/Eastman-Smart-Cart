import { route } from '@/lib/api';
import { createClient } from '@/lib/supabase';

// GET /api/coupons — offers to show on the cart page. Expired and used-up coupons are left out.
export const GET = route(async () => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('coupons')
    .select('code, description, min_order, usage_limit, used_count')
    .eq('is_active', true)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('min_order');
  if (error) throw error;
  return data
    .filter((c) => c.usage_limit === null || c.used_count < c.usage_limit)
    .map(({ code, description, min_order }) => ({ code, description, min_order }));
});
