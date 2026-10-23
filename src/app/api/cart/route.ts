import { requireUser, route } from '@/lib/api';
import { getCart } from '@/lib/cart';

// GET /api/cart?coupon=SAVE10 — items and totals. The coupon is optional and only previewed here;
// it is actually used when the order is placed.
export const GET = route(async (req) => {
  const { supabase } = await requireUser();
  const coupon = new URL(req.url).searchParams.get('coupon');
  return getCart(supabase, coupon);
});
