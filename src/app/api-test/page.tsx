'use client';

// Developer test page for the Eastman backend (open /api-test). Every button calls one API endpoint,
// and the "API log" on the right shows each request and the JSON that came back.

import { useCallback, useEffect, useState } from 'react';

type Product = {
  id: string;
  name: string;
  category?: string;
  description?: string | null;
  price: number;
  stock?: number;
  image_url?: string | null;
};
type CartItem = { quantity: number; lineTotal: number; product: Product };
type Cart = { items: CartItem[]; subtotal: number; discount: number; total: number; couponError: string | null };
type Coupon = { code: string; description?: string | null; min_order?: number };
type OrderItem = { name: string; price: number; quantity: number };
type Order = {
  id: string;
  created_at?: string;
  subtotal?: number;
  discount?: number;
  total: number;
  coupon_code?: string | null;
  order_items?: OrderItem[];
};
type Me = { id: string; email: string; name?: string };
type LogEntry = { id: number; time: string; method: string; path: string; status: number; body: unknown };

const rupees = (n: number | undefined) =>
  `₹${Number(n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const input = 'w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm';
const button = 'rounded bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-40';
const lightButton = 'rounded border border-gray-300 bg-white px-2 py-1 text-sm hover:bg-gray-100';

export default function Home() {
  const [me, setMe] = useState<Me | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  // form fields
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [address, setAddress] = useState('');

  // ---------- one helper for every API call ----------
  const api = useCallback(async <T,>(method: string, path: string, body?: unknown): Promise<T> => {
    const res = await fetch(path, {
      method,
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data: unknown = await res.json().catch(() => null);
    setLog((old) =>
      [{ id: Date.now() + Math.random(), time: new Date().toLocaleTimeString(), method, path, status: res.status, body: data }, ...old].slice(0, 30),
    );
    if (!res.ok) throw new Error((data as { error?: string } | null)?.error ?? `Request failed (${res.status})`);
    return data as T;
  }, []);

  // Runs an action and shows a green or red message.
  const run = async (action: () => Promise<unknown>, success?: string) => {
    try {
      await action();
      if (success) setMessage({ text: success, ok: true });
    } catch (err) {
      setMessage({ text: (err as Error).message, ok: false });
    }
  };

  // ---------- loaders ----------
  const loadMe = useCallback(async () => {
    try {
      setMe(await api<Me>('GET', '/api/auth/me'));
    } catch {
      setMe(null); // 401 = not logged in
    }
  }, [api]);

  const loadProducts = useCallback(async () => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (search) params.set('search', search);
    const query = params.toString();
    setProducts(await api<Product[]>('GET', `/api/products${query ? `?${query}` : ''}`));
  }, [api, category, search]);

  const loadCart = useCallback(async () => {
    const query = appliedCoupon ? `?coupon=${encodeURIComponent(appliedCoupon)}` : '';
    setCart(await api<Cart>('GET', `/api/cart${query}`));
  }, [api, appliedCoupon]);

  const loadOrders = useCallback(async () => {
    setOrders(await api<Order[]>('GET', '/api/orders'));
  }, [api]);

  // first load: products, coupons, who am I
  useEffect(() => {
    // State is set only after each request finishes, so this is safe.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    api<Product[]>('GET', '/api/products').then(setProducts).catch(() => {});
    api<Coupon[]>('GET', '/api/coupons').then(setCoupons).catch(() => {});
    loadMe();
  }, [api, loadMe]);

  // when logged in (or the coupon changes), load the cart and orders
  useEffect(() => {
    if (!me) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCart().catch(() => {});
    loadOrders().catch(() => {});
  }, [me, loadCart, loadOrders]);

  // ---------- actions ----------
  const submitAuth = () =>
    run(async () => {
      if (authMode === 'signup') {
        await api('POST', '/api/auth/signup', { name, email, password });
      }
      await api('POST', '/api/auth/login', { email, password });
      await loadMe();
      setPassword('');
    }, authMode === 'signup' ? 'Account created and logged in' : 'Logged in');

  const logout = () =>
    run(async () => {
      await api('POST', '/api/auth/logout');
      setMe(null);
      setCart(null);
      setOrders([]);
      setSelectedOrder(null);
    }, 'Logged out');

  const addToCart = (productId: string) =>
    run(async () => {
      await api('POST', '/api/cart/items', { productId, quantity: 1 });
      await loadCart();
    }, 'Added to cart');

  const changeQuantity = (productId: string, quantity: number) =>
    run(async () => {
      if (quantity < 1) await api('DELETE', `/api/cart/items/${productId}`);
      else await api('PATCH', `/api/cart/items/${productId}`, { quantity });
      await loadCart();
    });

  const removeItem = (productId: string) =>
    run(async () => {
      await api('DELETE', `/api/cart/items/${productId}`);
      await loadCart();
    }, 'Removed');

  const placeOrder = () =>
    run(async () => {
      const result = await api<{ orderId: string }>('POST', '/api/orders', {
        name: name || me?.name || '',
        email: email || me?.email || '',
        address,
        coupon: appliedCoupon || undefined,
      });
      setAppliedCoupon('');
      setCouponInput('');
      await Promise.all([loadCart(), loadOrders(), loadProducts()]);
      setSelectedOrder(await api<Order>('GET', `/api/orders/${result.orderId}`));
    }, 'Order placed');

  const openOrder = (id: string) => run(async () => setSelectedOrder(await api<Order>('GET', `/api/orders/${id}`)));

  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))] as string[];

  return (
    <main className="min-h-screen bg-gray-50 p-6 text-gray-900">
      <div className="mx-auto max-w-7xl">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Eastman store: API test page</h1>
          {me ? (
            <div className="flex items-center gap-3 text-sm">
              <span>
                Logged in as <b>{me.name || me.email}</b>
              </span>
              <button className={lightButton} onClick={logout}>
                Log out
              </button>
            </div>
          ) : (
            <span className="text-sm text-gray-500">Not logged in</span>
          )}
        </header>

        {message && (
          <div
            className={`mb-4 rounded border px-3 py-2 text-sm ${message.ok ? 'border-green-300 bg-green-50 text-green-800' : 'border-red-300 bg-red-50 text-red-800'}`}
          >
            {message.text}
            <button className="ml-3 underline" onClick={() => setMessage(null)}>
              dismiss
            </button>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* ---------- Account ---------- */}
            {!me && (
              <section className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="mb-3 flex gap-2">
                  <button className={authMode === 'login' ? button : lightButton} onClick={() => setAuthMode('login')}>
                    Log in
                  </button>
                  <button className={authMode === 'signup' ? button : lightButton} onClick={() => setAuthMode('signup')}>
                    Sign up
                  </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {authMode === 'signup' && (
                    <input className={input} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
                  )}
                  <input className={input} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <input
                    className={input}
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <button className={`${button} mt-3`} onClick={submitAuth} disabled={!email || !password}>
                  {authMode === 'signup' ? 'Create account' : 'Log in'}
                </button>
                <p className="mt-2 text-xs text-gray-500">
                  Cart and orders need a login. If sign up works but log in fails, turn off &quot;Confirm email&quot; in Supabase.
                </p>
              </section>
            )}

            {/* ---------- Products ---------- */}
            <section className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <h2 className="mr-auto text-lg font-semibold">Products</h2>
                <input
                  className={`${input} w-40`}
                  placeholder="Search name"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select className={`${input} w-40`} value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">All categories</option>
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <button className={button} onClick={() => run(loadProducts)}>
                  Search
                </button>
              </div>
              {products.length === 0 && <p className="text-sm text-gray-500">No products. Has seed.sql been run?</p>}
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((p) => (
                  <div key={p.id} className="flex flex-col rounded border border-gray-200 p-3">
                    {p.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_url} alt={p.name} className="mb-2 h-32 w-full rounded object-cover" />
                    )}
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-gray-500">
                      {p.category}
                      {p.stock !== undefined && ` · ${p.stock} in stock`}
                    </div>
                    {p.description && <p className="mt-1 text-sm text-gray-600">{p.description}</p>}
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <span className="font-semibold">{rupees(p.price)}</span>
                      <button className={button} onClick={() => addToCart(p.id)} disabled={!me}>
                        Add to cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ---------- Orders ---------- */}
            {me && (
              <section className="rounded-lg border border-gray-200 bg-white p-4">
                <h2 className="mb-3 text-lg font-semibold">My orders</h2>
                {orders.length === 0 && <p className="text-sm text-gray-500">No orders yet.</p>}
                <ul className="divide-y divide-gray-100">
                  {orders.map((o) => (
                    <li key={o.id} className="flex items-center justify-between py-2 text-sm">
                      <span>
                        <b>{o.id}</b>
                        {o.created_at && <span className="text-gray-500"> · {new Date(o.created_at).toLocaleString()}</span>}
                      </span>
                      <span className="flex items-center gap-3">
                        {rupees(o.total)}
                        <button className={lightButton} onClick={() => openOrder(o.id)}>
                          View
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
                {selectedOrder && (
                  <div className="mt-3 rounded border border-green-300 bg-green-50 p-3 text-sm">
                    <div className="mb-2 font-semibold">Order {selectedOrder.id}</div>
                    {selectedOrder.order_items?.map((item, i) => (
                      <div key={i} className="flex justify-between">
                        <span>
                          {item.name} × {item.quantity}
                        </span>
                        <span>{rupees(item.price * item.quantity)}</span>
                      </div>
                    ))}
                    <div className="mt-2 border-t border-green-200 pt-2">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{rupees(selectedOrder.subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Discount {selectedOrder.coupon_code && `(${selectedOrder.coupon_code})`}</span>
                        <span>−{rupees(selectedOrder.discount)}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Total paid</span>
                        <span>{rupees(selectedOrder.total)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>

          <div className="space-y-6">
            {/* ---------- Cart + checkout ---------- */}
            <section className="rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="mb-3 text-lg font-semibold">Cart</h2>
              {!me && <p className="text-sm text-gray-500">Log in to use the cart.</p>}
              {me && cart && (
                <>
                  {cart.items.length === 0 && <p className="text-sm text-gray-500">Cart is empty.</p>}
                  <ul className="space-y-2">
                    {cart.items.map((item) => (
                      <li key={item.product.id} className="text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">{item.product.name}</span>
                          <span>{rupees(item.lineTotal)}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <button className={lightButton} onClick={() => changeQuantity(item.product.id, item.quantity - 1)}>
                            −
                          </button>
                          <span className="w-6 text-center">{item.quantity}</span>
                          <button className={lightButton} onClick={() => changeQuantity(item.product.id, item.quantity + 1)}>
                            +
                          </button>
                          <span className="text-xs text-gray-500">× {rupees(item.product.price)}</span>
                          <button className="ml-auto text-xs text-red-600 underline" onClick={() => removeItem(item.product.id)}>
                            remove
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {/* coupon */}
                  <div className="mt-4 flex gap-2">
                    <input
                      className={input}
                      placeholder="Coupon code"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                    />
                    <button className={button} onClick={() => setAppliedCoupon(couponInput.trim())}>
                      Apply
                    </button>
                  </div>
                  {coupons.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {coupons.map((c) => (
                        <button
                          key={c.code}
                          className="rounded-full border border-dashed border-gray-400 px-2 py-0.5 text-xs hover:bg-gray-100"
                          title={c.description ?? ''}
                          onClick={() => {
                            setCouponInput(c.code);
                            setAppliedCoupon(c.code);
                          }}
                        >
                          {c.code}
                          {c.min_order ? ` (min ${rupees(c.min_order)})` : ''}
                        </button>
                      ))}
                    </div>
                  )}
                  {appliedCoupon && !cart.couponError && (
                    <p className="mt-2 text-sm text-green-700">
                      {appliedCoupon.toUpperCase()} applied{' '}
                      <button className="underline" onClick={() => { setAppliedCoupon(''); setCouponInput(''); }}>
                        remove
                      </button>
                    </p>
                  )}
                  {cart.couponError && <p className="mt-2 text-sm text-red-600">{cart.couponError}</p>}

                  {/* totals */}
                  <div className="mt-4 space-y-1 border-t border-gray-200 pt-3 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{rupees(cart.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-green-700">
                      <span>Discount</span>
                      <span>−{rupees(cart.discount)}</span>
                    </div>
                    <div className="flex justify-between text-base font-semibold">
                      <span>Total</span>
                      <span>{rupees(cart.total)}</span>
                    </div>
                  </div>

                  {/* checkout */}
                  <div className="mt-4 space-y-2 border-t border-gray-200 pt-3">
                    <h3 className="font-medium">Checkout</h3>
                    <input className={input} placeholder={me.name || 'Name'} value={name} onChange={(e) => setName(e.target.value)} />
                    <input className={input} placeholder={me.email || 'Email'} value={email} onChange={(e) => setEmail(e.target.value)} />
                    <textarea
                      className={input}
                      placeholder="Delivery address"
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                    <button className={`${button} w-full`} onClick={placeOrder} disabled={cart.items.length === 0}>
                      Place order · {rupees(cart.total)}
                    </button>
                  </div>
                </>
              )}
            </section>

            {/* ---------- API log ---------- */}
            <section className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-lg font-semibold">API log</h2>
                <button className={lightButton} onClick={() => setLog([])}>
                  Clear
                </button>
              </div>
              <ul className="max-h-[32rem] space-y-1 overflow-y-auto text-xs">
                {log.map((entry) => (
                  <li key={entry.id}>
                    <details>
                      <summary className="cursor-pointer font-mono">
                        <span className={entry.status < 400 ? 'text-green-700' : 'text-red-600'}>{entry.status}</span>{' '}
                        {entry.method} {entry.path} <span className="text-gray-400">{entry.time}</span>
                      </summary>
                      <pre className="mt-1 overflow-x-auto rounded bg-gray-100 p-2">{JSON.stringify(entry.body, null, 2)}</pre>
                    </details>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}