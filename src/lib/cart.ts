import type { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from './api';

type CartRow = {
  quantity: number;
  product: {
    id: string;
    name: string;
    category: string;
    price: number;
    image_url: string | null;
    stock: number;
    is_active: boolean;
  };
};

// Shipping and tax. place_order() in schema.sql charges neither (total = subtotal - discount),
// and prices are shown tax-inclusive. If the store starts charging these, change place_order()
// at the same time so the cart and the order always agree.
export const SHIPPING_FEE = 0;
export const TAX_INCLUDED_IN_PRICE = true;

// Money is added up in whole paise so 0.1 + 0.2 style rounding errors can't creep in.
const toPaise = (rupees: number) => Math.round(Number(rupees) * 100);
const toRupees = (paise: number) => paise / 100;

// Why a cart line can't be checked out right now, or null if it can.
function lineIssue(item: CartRow): string | null {
  if (!item.product.is_active) return 'No longer available.';
  if (item.product.stock <= 0) return 'Out of stock.';
  if (item.quantity > item.product.stock) return `Only ${item.product.stock} left in stock.`;
  return null;
}

// The logged-in user's cart with totals. Pass a coupon code to preview its discount.
export async function getCart(supabase: SupabaseClient, couponCode?: string | null) {
  const { data, error } = await supabase
    .from('cart_items')
    .select('quantity, product:products(id, name, category, price, image_url, stock, is_active)')
    .order('added_at')
    .overrideTypes<CartRow[], { merge: false }>();
  if (error) throw error;

  const items = data.map((item) => ({
    ...item,
    lineTotal: toRupees(toPaise(item.product.price) * item.quantity),
    issue: lineIssue(item),
  }));
  const subtotalPaise = data.reduce((sum, item) => sum + toPaise(item.product.price) * item.quantity, 0);
  const subtotal = toRupees(subtotalPaise);

  // The coupon rules live in the database (coupon_discount in schema.sql).
  const code = couponCode?.trim().toUpperCase() || null;
  let discountPaise = 0;
  let couponError: string | null = null;
  if (code && items.length === 0) couponError = 'Add something to your cart to use a coupon.';
  if (code && items.length > 0) {
    const result = await supabase.rpc('coupon_discount', { p_code: code, p_subtotal: subtotal });
    if (result.error) couponError = result.error.message;
    else discountPaise = Math.min(toPaise(result.data), subtotalPaise);
  }

  const shippingPaise = items.length > 0 ? toPaise(SHIPPING_FEE) : 0;
  return {
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
    discount: toRupees(discountPaise),
    shipping: toRupees(shippingPaise),
    tax: 0,
    taxIncluded: TAX_INCLUDED_IN_PRICE,
    total: toRupees(subtotalPaise - discountPaise + shippingPaise),
    coupon: code && !couponError ? code : null,
    couponError,
    canCheckout: items.length > 0 && items.every((item) => item.issue === null),
  };
}

// A cart line can hold 1 to 10 of a product, and no more than is in stock.
export function checkQuantity(quantity: number, stock: number) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
    throw new ApiError(400, 'Quantity must be between 1 and 10.');
  }
  if (stock <= 0) throw new ApiError(400, 'This item is out of stock.');
  if (quantity > stock) throw new ApiError(400, `Only ${stock} left in stock.`);
}
