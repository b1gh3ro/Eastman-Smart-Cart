import { ApiError, checkProductId, readBody, requireUser, route } from '@/lib/api';
import { checkQuantity, getCart } from '@/lib/cart';

// POST /api/cart/items { productId, quantity } — adds to the quantity already in the cart.
export const POST = route(async (req) => {
  const { supabase, user } = await requireUser();
  const body = await readBody(req);
  const productId = checkProductId(body.productId);
  const quantity = body.quantity === undefined ? 1 : Number(body.quantity);

  const { data: product } = await supabase
    .from('products')
    .select('stock')
    .eq('id', productId)
    .eq('is_active', true)
    .maybeSingle();
  if (!product) throw new ApiError(404, 'Product not found.');

  const { data: existing } = await supabase.from('cart_items').select('quantity').eq('product_id', productId).maybeSingle();
  const newQuantity = (existing?.quantity ?? 0) + quantity;
  checkQuantity(quantity, product.stock);
  checkQuantity(newQuantity, product.stock);

  const { error } = await supabase
    .from('cart_items')
    .upsert({ user_id: user.id, product_id: productId, quantity: newQuantity });
  if (error) throw error;
  return getCart(supabase, new URL(req.url).searchParams.get('coupon'));
});
