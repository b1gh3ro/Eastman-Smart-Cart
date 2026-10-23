import { ApiError, checkProductId, route } from '@/lib/api';
import { createClient } from '@/lib/supabase';

// GET /api/products/:id
export const GET = route(async (_req, ctx: RouteContext<'/api/products/[id]'>) => {
  const id = checkProductId((await ctx.params).id);
  const supabase = await createClient();

  const { data, error } = await supabase.from('products').select('*').eq('id', id).eq('is_active', true).maybeSingle();
  if (error || !data) throw new ApiError(404, 'Product not found.');
  return data;
});
