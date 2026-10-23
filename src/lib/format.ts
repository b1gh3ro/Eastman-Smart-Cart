// Prices are stored in rupees (see supabase/seed.sql).
const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });

export const formatPrice = (n: number | null | undefined) => inr.format(Number(n ?? 0));

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
