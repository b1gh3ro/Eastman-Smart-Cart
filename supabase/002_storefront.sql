-- Storefront additions: wishlist, newsletter sign-ups and featured products.
-- Run once in the Supabase SQL editor AFTER schema.sql and seed.sql. Safe to run again.

---------------------------------------------------------------- featured products

alter table products add column if not exists is_featured boolean not null default false;

-- Feature a few of the sample products (seed.sql).
update products set is_featured = true
where name in ('Wireless Earbuds', 'Smart Watch', 'Denim Jacket', 'Steel Water Bottle');

---------------------------------------------------------------- wishlist

create table if not exists wishlist_items (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

alter table wishlist_items enable row level security;
drop policy if exists "own wishlist" on wishlist_items;
create policy "own wishlist" on wishlist_items for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

---------------------------------------------------------------- newsletter

create table if not exists newsletter_subscribers (
  email text primary key check (email = lower(email) and position('@' in email) > 1),
  subscribed_at timestamptz not null default now()
);

-- Anyone may sign up, but nobody can read the list through the API.
alter table newsletter_subscribers enable row level security;
drop policy if exists "anyone subscribes" on newsletter_subscribers;
create policy "anyone subscribes" on newsletter_subscribers for insert with check (true);
