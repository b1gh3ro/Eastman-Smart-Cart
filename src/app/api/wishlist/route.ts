import { checkProductId, readBody, requireUser, route } from '@/lib/api';
import { addToWishlist, getWishlist } from '@/lib/wishlist';

// GET /api/wishlist — [{ added_at, product }]
export const GET = route(async () => {
  const { supabase } = await requireUser();
  return getWishlist(supabase);
});

// POST /api/wishlist { productId } — adding twice is fine.
export const POST = route(async (req) => {
  const { supabase, user } = await requireUser();
  const productId = checkProductId((await readBody(req)).productId);
  await addToWishlist(supabase, user.id, productId);
  return getWishlist(supabase);
});
