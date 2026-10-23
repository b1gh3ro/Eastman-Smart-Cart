import type { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from './api';

type CartRow = {
  quantity: number;
  product: { id: string; name: string; price: number; image_url: string | null; stock: number };
};

const round = (n: number) => Math.round(n * 100) / 100;

// The logged-in user's cart with totals. Pass a coupon code to preview its discount.
export async function getCart(supabase: SupabaseClient, couponCode?: string | null) {
  const { data, error } = await supabase
    .from('cart_items')
    .select('quantity, product:products(id, name, price, image_url, stock)')
    .order('added_at')
    .overrideTypes<CartRow[], { merge: false }>();
  if (error) throw error;

  const items = data.map((item) => ({ ...item, lineTotal: round(item.product.price * item.quantity) }));
  const subtotal = round(items.reduce((sum, item) => sum + item.lineTotal, 0));

  // The coupon rules live in the database (coupon_discount in schema.sql).
  let discount = 0;
  let couponError: string | null = null;
  if (couponCode && items.length > 0) {
    const result = await supabase.rpc('coupon_discount', { p_code: couponCode, p_subtotal: subtotal });
    if (result.error) couponError = result.error.message;
    else discount = result.data;
  }

  return { items, subtotal, discount, total: round(subtotal - discount), couponError };
}

// A cart line can hold 1 to 10 of a product, and no more than is in stock.
export function checkQuantity(quantity: number, stock: number) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
    throw new ApiError(400, 'Quantity must be between 1 and 10.');
  }
  if (quantity > stock) throw new ApiError(400, `Only ${stock} left in stock.`);
}
