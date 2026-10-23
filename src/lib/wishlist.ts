import type { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from './api';

// The logged-in user's wishlist, newest first. Products taken off sale are still listed
// (with is_active false) so the shopper can see what happened to them.
export async function getWishlist(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('wishlist_items')
    .select('added_at, product:products(*)')
    .order('added_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function addToWishlist(supabase: SupabaseClient, userId: string, productId: string) {
  const { data: product } = await supabase.from('products').select('id').eq('id', productId).maybeSingle();
  if (!product) throw new ApiError(404, 'Product not found.');

  const { error } = await supabase
    .from('wishlist_items')
    .upsert({ user_id: userId, product_id: productId }, { onConflict: 'user_id,product_id', ignoreDuplicates: true });
  if (error) throw error;
}
