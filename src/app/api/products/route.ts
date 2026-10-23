import { route } from '@/lib/api';
import { createClient } from '@/lib/supabase';

// GET /api/products?category=Kitchen&search=mug
export const GET = route(async (req) => {
  const params = new URL(req.url).searchParams;
  const category = params.get('category');
  const search = params.get('search');
  const supabase = await createClient();

  let query = supabase.from('products').select('*').eq('is_active', true).order('name');
  if (category) query = query.eq('category', category);
  if (search) query = query.ilike('name', `%${search}%`);

  const { data, error } = await query;
  if (error) throw error;
  return data;
});
