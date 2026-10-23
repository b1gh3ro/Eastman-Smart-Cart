import { ApiError, checkProductId, readBody, requireUser, route } from '@/lib/api';
import { checkQuantity, getCart } from '@/lib/cart';

type Ctx = RouteContext<'/api/cart/items/[productId]'>;

const couponOf = (req: Request) => new URL(req.url).searchParams.get('coupon');

// PATCH /api/cart/items/:productId { quantity } — sets the quantity.
export const PATCH = route(async (req, ctx: Ctx) => {
  const productId = checkProductId((await ctx.params).productId);
  const { supabase } = await requireUser();
  const quantity = Number((await readBody(req)).quantity);

  const { data: product } = await supabase
    .from('products')
    .select('stock, is_active')
    .eq('id', productId)
    .maybeSingle();
  if (!product) throw new ApiError(404, 'Product not found.');
  if (!product.is_active) throw new ApiError(400, 'This product is no longer available. Please remove it.');
  checkQuantity(quantity, product.stock);

  const { data: updated, error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('product_id', productId)
    .select();
  if (error) throw error;
  if (updated.length === 0) throw new ApiError(404, 'This item is not in your cart.');
  return getCart(supabase, couponOf(req));
});

// DELETE /api/cart/items/:productId
export const DELETE = route(async (req, ctx: Ctx) => {
  const productId = checkProductId((await ctx.params).productId);
  const { supabase } = await requireUser();

  const { error } = await supabase.from('cart_items').delete().eq('product_id', productId);
  if (error) throw error;
  return getCart(supabase, couponOf(req));
});
