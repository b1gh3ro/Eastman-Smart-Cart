import { ApiError, requireUser, route } from '@/lib/api';

// GET /api/orders/:id — one order with its items (only your own).
export const GET = route(async (_req, ctx: RouteContext<'/api/orders/[id]'>) => {
  const { id } = await ctx.params;
  const { supabase } = await requireUser();

  const { data, error } = await supabase.from('orders').select('*, order_items(*)').eq('id', id).maybeSingle();
  if (error || !data) throw new ApiError(404, 'Order not found.');
  return data;
});
