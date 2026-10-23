import { route } from '@/lib/api';
import { createClient } from '@/lib/supabase';

// GET /api/categories — [{ name, count }] for the products on sale, by name.
export const GET = route(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.from('products').select('category').eq('is_active', true);
  if (error) throw error;

  const counts = new Map<string, number>();
  for (const { category } of data) counts.set(category, (counts.get(category) ?? 0) + 1);
  return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));
});
