import { ApiError, route } from '@/lib/api';
import { createClient } from '@/lib/supabase';

const SORTS = {
  name: { column: 'name', ascending: true },
  name_desc: { column: 'name', ascending: false },
  price_asc: { column: 'price', ascending: true },
  price_desc: { column: 'price', ascending: false },
} as const;

function price(value: string | null, label: string) {
  if (value === null || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) throw new ApiError(400, `${label} must be a number of 0 or more.`);
  return n;
}

function int(value: string | null, fallback: number, min: number, max: number) {
  if (value === null || value === '') return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) throw new ApiError(400, `Expected a whole number from ${min} to ${max}.`);
  return n;
}

// GET /api/products?category=Kitchen&search=mug&minPrice=100&maxPrice=999&sort=price_asc&page=1&limit=12&featured=true
// Returns an array of products. With paging, the X-Total-Count header holds the number of matches.
export const GET = route(async (req) => {
  const params = new URL(req.url).searchParams;
  const category = params.get('category');
  // Characters that mean something in a PostgREST filter or LIKE pattern are dropped.
  const search = params.get('search')?.replace(/[%_,()\\*"]/g, ' ').trim().slice(0, 100);
  const minPrice = price(params.get('minPrice'), 'minPrice');
  const maxPrice = price(params.get('maxPrice'), 'maxPrice');
  const sortKey = params.get('sort') ?? 'name';
  if (!(sortKey in SORTS)) throw new ApiError(400, `sort must be one of: ${Object.keys(SORTS).join(', ')}.`);
  const sort = SORTS[sortKey as keyof typeof SORTS];
  const page = int(params.get('page'), 1, 1, 10_000);
  const limit = int(params.get('limit'), 100, 1, 100);
  const supabase = await createClient();

  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .order(sort.column, { ascending: sort.ascending })
    .order('id') // stable order so pages don't overlap
    .range((page - 1) * limit, page * limit - 1);
  if (category) query = query.eq('category', category);
  if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`);
  if (minPrice !== null) query = query.gte('price', minPrice);
  if (maxPrice !== null) query = query.lte('price', maxPrice);
  if (params.get('featured') === 'true') query = query.eq('is_featured', true); // see supabase/002_storefront.sql

  const { data, error, count } = await query;
  // PGRST103 = asked for a page past the last one.
  if (error?.code === 'PGRST103') return Response.json([], { headers: { 'X-Total-Count': String(count ?? 0) } });
  if (error) throw error;
  return Response.json(data, { headers: { 'X-Total-Count': String(count ?? data.length) } });
});
