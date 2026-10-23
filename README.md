# Eastman store

Next.js + Supabase. Users, products, carts and orders all live in Supabase (Postgres).

## Setup

1. Create a Supabase project, then in its SQL editor run `supabase/schema.sql`, then `supabase/seed.sql`.
2. Copy `.env.example` to `.env.local` and fill in the URL and publishable key (Project Settings > API).
3. `npm run dev` and open http://localhost:3000

## Where things are

```
supabase/schema.sql   tables, who-can-see-what rules, coupon + checkout functions
supabase/seed.sql     sample products and coupons
src/lib/supabase.ts   Supabase client (knows the logged-in user)
src/lib/api.ts        route() wrapper, ApiError, requireUser()
src/lib/cart.ts       cart totals and quantity rules
src/app/api/...       one folder per endpoint
```

## API

| Method | Path | Body / query |
|---|---|---|
| POST | `/api/auth/signup` | `{ name, email, password }` |
| POST | `/api/auth/login` | `{ email, password }` |
| POST | `/api/auth/logout` | |
| GET | `/api/auth/me` | |
| GET | `/api/products` | `?category=&search=` |
| GET | `/api/products/:id` | |
| GET | `/api/cart` | `?coupon=SAVE10` to preview a discount |
| POST | `/api/cart/items` | `{ productId, quantity }` |
| PATCH | `/api/cart/items/:productId` | `{ quantity }` |
| DELETE | `/api/cart/items/:productId` | |
| GET | `/api/coupons` | |
| GET | `/api/orders` | |
| POST | `/api/orders` | `{ name, email, address, coupon? }` |
| GET | `/api/orders/:id` | |

Errors always come back as `{ "error": "message" }`.
