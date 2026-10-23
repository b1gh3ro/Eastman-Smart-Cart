import { ApiError, readBody, requireUser, route } from '@/lib/api';

// GET /api/orders — the user's past orders, newest first.
export const GET = route(async () => {
  const { supabase } = await requireUser();

  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
});

// POST /api/orders { name, email, address, coupon? } — checkout. Everything happens in
// place_order() in the database (see supabase/schema.sql).
export const POST = route(async (req) => {
  const { supabase } = await requireUser();
  const body = await readBody(req);
  const [name, email, address] = [body.name, body.email, body.address].map((v) => (typeof v === 'string' ? v : ''));
  const coupon = typeof body.coupon === 'string' && body.coupon.trim() ? body.coupon.trim() : null;

  if (!name.trim() || !email.includes('@') || !address.trim()) {
    throw new ApiError(400, 'Name, a valid email and address are required.');
  }

  const { data: orderId, error } = await supabase.rpc('place_order', {
    p_name: name.trim(),
    p_email: email.trim(),
    p_address: address.trim(),
    p_coupon: coupon,
  });
  if (error) throw new ApiError(400, error.message); // e.g. "Only 2 left of Smart Watch."
  return { orderId };
});
