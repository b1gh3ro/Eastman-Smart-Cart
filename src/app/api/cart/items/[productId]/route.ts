import { ApiError, requireUser, route } from '@/lib/api';
import { checkQuantity, getCart } from '@/lib/cart';

type Ctx = RouteContext<'/api/cart/items/[productId]'>;

// PATCH /api/cart/items/:productId { quantity } — sets the quantity.
export const PATCH = route(async (req, ctx: Ctx) => {
  const { productId } = await ctx.params;
  const { supabase } = await requireUser();
  const { quantity } = await req.json();

  const { data: product } = await supabase.from('products').select('stock').eq('id', productId).maybeSingle();
  if (!product) throw new ApiError(404, 'Product not found.');
  checkQuantity(Number(quantity), product.stock);

  const { data: updated, error } = await supabase
    .from('cart_items')
    .update({ quantity: Number(quantity) })
    .eq('product_id', productId)
    .select();
  if (error) throw error;
  if (updated.length === 0) throw new ApiError(404, 'This item is not in your cart.');
  return getCart(supabase);
});

// DELETE /api/cart/items/:productId
export const DELETE = route(async (_req, ctx: Ctx) => {
  const { productId } = await ctx.params;
  const { supabase } = await requireUser();

  const { error } = await supabase.from('cart_items').delete().eq('product_id', productId);
  if (error) throw error;
  return getCart(supabase);
});
