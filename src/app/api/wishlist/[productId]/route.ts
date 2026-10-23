import { checkProductId, requireUser, route } from '@/lib/api';
import { getWishlist } from '@/lib/wishlist';

// DELETE /api/wishlist/:productId
export const DELETE = route(async (_req, ctx: RouteContext<'/api/wishlist/[productId]'>) => {
  const productId = checkProductId((await ctx.params).productId);
  const { supabase } = await requireUser();

  const { error } = await supabase.from('wishlist_items').delete().eq('product_id', productId);
  if (error) throw error;
  return getWishlist(supabase);
});
