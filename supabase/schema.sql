-- Eastman store database. Run this once in the Supabase SQL editor, then seed.sql.

---------------------------------------------------------------- tables

-- One row per user, created automatically when they sign up.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default ''
);

create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text not null,
  price numeric(10, 2) not null check (price >= 0),
  image_url text,
  stock int not null default 0 check (stock >= 0),
  is_active boolean not null default true
);

create table coupons (
  code text primary key,                 -- uppercase, e.g. 'SAVE10'
  description text,
  discount_type text not null check (discount_type in ('PERCENT', 'FLAT')),
  discount_value numeric(10, 2) not null check (discount_value > 0),
  max_discount numeric(10, 2),           -- cap for PERCENT coupons, null = no cap
  min_order numeric(10, 2) not null default 0,
  usage_limit int,                       -- null = unlimited
  used_count int not null default 0,
  expires_at timestamptz,                -- null = never expires
  is_active boolean not null default true
);

create table cart_items (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  quantity int not null check (quantity between 1 and 10),
  added_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table orders (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id),
  customer_name text not null,
  email text not null,
  address text not null,
  coupon_code text references coupons(code),
  subtotal numeric(10, 2) not null,
  discount numeric(10, 2) not null,
  total numeric(10, 2) not null,
  created_at timestamptz not null default now()
);

-- Name and price are copied, so old orders don't change when a product does.
create table order_items (
  order_id bigint not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  name text not null,
  price numeric(10, 2) not null,
  quantity int not null,
  primary key (order_id, product_id)
);

---------------------------------------------------------------- who can see what

-- Row level security: each user only ever sees their own profile, cart and orders.
alter table profiles enable row level security;
alter table products enable row level security;
alter table coupons enable row level security;
alter table cart_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

create policy "read own profile" on profiles for select using (id = auth.uid());
create policy "update own profile" on profiles for update using (id = auth.uid());
create policy "anyone reads products" on products for select using (true);
create policy "anyone reads coupons" on coupons for select using (true);
create policy "own cart" on cart_items for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "read own orders" on orders for select using (user_id = auth.uid());
create policy "read own order items" on order_items for select
  using (exists (select 1 from orders where orders.id = order_id and orders.user_id = auth.uid()));
-- Orders are only created through place_order() below.

---------------------------------------------------------------- functions

-- Create the profile when someone signs up.
create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, name) values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''));
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- The discount a coupon gives on a subtotal, or an error saying why it can't be used.
-- Used by the cart preview and by checkout, so the rules live in one place.
create function coupon_discount(p_code text, p_subtotal numeric) returns numeric
language plpgsql stable as $$
declare
  c coupons;
begin
  select * into c from coupons where code = upper(p_code) and is_active;
  if not found then raise exception 'Coupon % is not valid.', upper(p_code); end if;
  if c.expires_at < now() then raise exception 'Coupon % has expired.', c.code; end if;
  if c.used_count >= c.usage_limit then raise exception 'Coupon % has been fully used.', c.code; end if;
  if p_subtotal < c.min_order then
    raise exception 'Add ₹% more to use %.', c.min_order - p_subtotal, c.code;
  end if;

  if c.discount_type = 'PERCENT' then
    return round(least(p_subtotal * c.discount_value / 100, coalesce(c.max_discount, p_subtotal)), 2);
  end if;
  return least(c.discount_value, p_subtotal);
end $$;

-- Checkout in one transaction: check stock, apply the coupon, save the order,
-- reduce stock and empty the cart. Returns the new order id.
create function place_order(p_name text, p_email text, p_address text, p_coupon text default null)
returns bigint
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_coupon text := nullif(upper(trim(p_coupon)), '');
  v_subtotal numeric;
  v_discount numeric := 0;
  v_order bigint;
  v_item record;
begin
  if v_user is null then raise exception 'Please log in.'; end if;

  -- Lock the products so two people can't buy the same last item.
  for v_item in
    select p.name, p.stock, p.is_active, c.quantity
    from cart_items c join products p on p.id = c.product_id
    where c.user_id = v_user
    for update of p
  loop
    if not v_item.is_active then raise exception '% is no longer available.', v_item.name; end if;
    if v_item.stock < v_item.quantity then raise exception 'Only % left of %.', v_item.stock, v_item.name; end if;
  end loop;

  select sum(p.price * c.quantity) into v_subtotal
  from cart_items c join products p on p.id = c.product_id
  where c.user_id = v_user;
  if v_subtotal is null then raise exception 'Your cart is empty.'; end if;

  if v_coupon is not null then
    perform 1 from coupons where code = v_coupon for update;
    v_discount := coupon_discount(v_coupon, v_subtotal);
    update coupons set used_count = used_count + 1 where code = v_coupon;
  end if;

  insert into orders (user_id, customer_name, email, address, coupon_code, subtotal, discount, total)
  values (v_user, p_name, p_email, p_address, v_coupon, v_subtotal, v_discount, v_subtotal - v_discount)
  returning id into v_order;

  insert into order_items (order_id, product_id, name, price, quantity)
  select v_order, p.id, p.name, p.price, c.quantity
  from cart_items c join products p on p.id = c.product_id
  where c.user_id = v_user;

  update products p set stock = p.stock - c.quantity
  from cart_items c
  where c.product_id = p.id and c.user_id = v_user;

  delete from cart_items where user_id = v_user;
  return v_order;
end $$;
