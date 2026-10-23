// Browser-side client for the API routes in src/app/api. Every call either returns the
// server's data or throws an ApiRequestError with the server's message — never fake data.

import type { Cart, Category, Coupon, Me, Order, Product, ProductQuery, WishlistEntry } from './types';

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<{ data: T; res: Response }> {
  let res: Response;
  try {
    res = await fetch(path, {
      method,
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
    });
  } catch {
    throw new ApiRequestError(0, 'Could not reach the server. Check your connection and try again.');
  }
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const message = (data as { error?: string } | null)?.error ?? `Request failed (${res.status}).`;
    throw new ApiRequestError(res.status, message);
  }
  return { data: data as T, res };
}

const call = async <T>(method: string, path: string, body?: unknown) => (await request<T>(method, path, body)).data;

const withCoupon = (path: string, coupon?: string | null) =>
  coupon ? `${path}?coupon=${encodeURIComponent(coupon)}` : path;

export function productQueryString(q: ProductQuery) {
  const params = new URLSearchParams();
  if (q.search) params.set('search', q.search);
  if (q.category) params.set('category', q.category);
  if (q.minPrice) params.set('minPrice', q.minPrice);
  if (q.maxPrice) params.set('maxPrice', q.maxPrice);
  if (q.sort) params.set('sort', q.sort);
  if (q.page) params.set('page', String(q.page));
  if (q.limit) params.set('limit', String(q.limit));
  if (q.featured) params.set('featured', 'true');
  return params.toString();
}

export const api = {
  // auth
  me: () => call<Me>('GET', '/api/auth/me'),
  login: (email: string, password: string) => call<{ id: string }>('POST', '/api/auth/login', { email, password }),
  signup: (name: string, email: string, password: string) =>
    call<{ id: string; needsConfirmation: boolean }>('POST', '/api/auth/signup', { name, email, password }),
  logout: () => call<{ ok: true }>('POST', '/api/auth/logout'),

  // catalog
  products: async (q: ProductQuery) => {
    const qs = productQueryString(q);
    const { data, res } = await request<Product[]>('GET', `/api/products${qs ? `?${qs}` : ''}`);
    return { products: data, total: Number(res.headers.get('X-Total-Count') ?? data.length) };
  },
  product: (id: string) => call<Product>('GET', `/api/products/${encodeURIComponent(id)}`),
  categories: () => call<Category[]>('GET', '/api/categories'),
  coupons: () => call<Coupon[]>('GET', '/api/coupons'),

  // cart (every change returns the whole cart with fresh totals)
  cart: (coupon?: string | null) => call<Cart>('GET', withCoupon('/api/cart', coupon)),
  addToCart: (productId: string, quantity: number, coupon?: string | null) =>
    call<Cart>('POST', withCoupon('/api/cart/items', coupon), { productId, quantity }),
  setQuantity: (productId: string, quantity: number, coupon?: string | null) =>
    call<Cart>('PATCH', withCoupon(`/api/cart/items/${productId}`, coupon), { quantity }),
  removeFromCart: (productId: string, coupon?: string | null) =>
    call<Cart>('DELETE', withCoupon(`/api/cart/items/${productId}`, coupon)),
  saveForLater: (productId: string, coupon?: string | null) =>
    call<Cart>('POST', withCoupon(`/api/cart/items/${productId}/save-for-later`, coupon)),
  clearCart: () => call<Cart>('DELETE', '/api/cart'),

  // wishlist
  wishlist: () => call<WishlistEntry[]>('GET', '/api/wishlist'),
  addToWishlist: (productId: string) => call<WishlistEntry[]>('POST', '/api/wishlist', { productId }),
  removeFromWishlist: (productId: string) => call<WishlistEntry[]>('DELETE', `/api/wishlist/${productId}`),

  // orders
  orders: () => call<Order[]>('GET', '/api/orders'),
  order: (id: string) => call<Order>('GET', `/api/orders/${encodeURIComponent(id)}`),
  placeOrder: (body: { name: string; email: string; address: string; coupon?: string | null }) =>
    call<{ orderId: number }>('POST', '/api/orders', body),

  // newsletter
  subscribe: (email: string) => call<{ ok: true }>('POST', '/api/newsletter', { email }),
};

export const errorMessage = (err: unknown) => (err instanceof Error ? err.message : 'Something went wrong.');
