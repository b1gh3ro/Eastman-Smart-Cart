import { ApiError, checkProductId, requireUser, route } from '@/lib/api';
import { getCart } from '@/lib/cart';
import { addToWishlist } from '@/lib/wishlist';

// POST /api/cart/items/:productId/save-for-later — moves a cart line to the wishlist.
// The wishlist add happens first, so a failure never loses the item.
export const POST = route(async (req, ctx: RouteContext<'/api/cart/items/[productId]/save-for-later'>) => {
  const productId = checkProductId((await ctx.params).productId);
  const { supabase, user } = await requireUser();

  const { data: line } = await supabase.from('cart_items').select('product_id').eq('product_id', productId).maybeSingle();
  if (!line) throw new ApiError(404, 'This item is not in your cart.');

  await addToWishlist(supabase, user.id, productId);
  const { error } = await supabase.from('cart_items').delete().eq('product_id', productId);
  if (error) throw error;
  return getCart(supabase, new URL(req.url).searchParams.get('coupon'));
});
