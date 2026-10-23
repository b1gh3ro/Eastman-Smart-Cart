'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import OrderSummary from '@/components/cart/OrderSummary';
import { useToast } from '@/components/providers/FeedbackProvider';
import { useStore } from '@/components/providers/StoreProvider';
import Icon from '@/components/ui/Icon';
import { EmptyState, Skeleton } from '@/components/ui/States';
import { api, errorMessage } from '@/lib/api-client';
import { formatPrice } from '@/lib/format';

// Checkout form. The order, stock check and coupon are all handled by POST /api/orders (place_order in the DB).
export default function CheckoutView() {
  const router = useRouter();
  const toast = useToast();
  const { me, cart, coupon, afterOrder, loadCart } = useStore();
  const [form, setForm] = useState<{ name: string | null; email: string | null; address: string }>({ name: null, email: null, address: '' });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (me === null) {
    return (
      <div className="container-page py-10">
        <EmptyState icon="lock" title="Log in to check out" action={{ label: 'Log in', href: '/login?next=/checkout' }} />
      </div>
    );
  }
  if (!me || !cart) {
    return (
      <div className="container-page grid gap-6 py-10 lg:grid-cols-[2fr_1fr]">
        <Skeleton className="h-96 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }
  if (cart.items.length === 0) {
    return (
      <div className="container-page py-10">
        <EmptyState icon="shopping_cart" title="Your cart is empty" message="Add something before checking out." action={{ label: 'Start shopping', href: '/' }} />
      </div>
    );
  }

  // Name and email start as the account's details until the shopper edits them.
  const name = form.name ?? me.name ?? '';
  const email = form.email ?? me.email ?? '';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const { orderId } = await api.placeOrder({ name, email, address: form.address, coupon: cart.coupon ? coupon : null });
      afterOrder();
      toast('success', 'Order placed. Thank you!');
      router.push(`/orders/${orderId}?placed=1`);
    } catch (err) {
      setError(errorMessage(err));
      loadCart(); // stock or coupon may have changed; show the latest
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="container-page py-8 md:py-10">
      <Link href="/cart" className="mb-4 inline-flex items-center gap-1 text-label-md text-primary hover:underline">
        <Icon name="arrow_back" className="text-[18px]" /> Back to cart
      </Link>
      <h1 className="mb-6 font-display text-headline-lg">Checkout</h1>

      <div className="grid items-start gap-6 lg:grid-cols-[2fr_1fr]">
        <form id="checkout-form" onSubmit={submit} className="card space-y-4 p-6 md:p-8">
          <h2 className="font-display text-headline-sm">Delivery details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-label-md">Full name</span>
              <input className="field" autoComplete="name" required value={name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-label-md">Email</span>
              <input className="field" type="email" autoComplete="email" required value={email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-label-md">Delivery address</span>
            <textarea
              className="field !h-auto min-h-28 py-3"
              autoComplete="street-address"
              required
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="Hostel / building, room, campus, city, PIN"
            />
          </label>
          <ul className="divide-y divide-[#f1f5f9] rounded-xl border border-[#e2e8f0]">
            {cart.items.map((line) => (
              <li key={line.product.id} className="flex justify-between gap-3 px-4 py-3 text-body-sm">
                <span>
                  {line.product.name} × {line.quantity}
                  {line.issue && <span className="ml-2 text-error">{line.issue}</span>}
                </span>
                <span className="tabular">{formatPrice(line.lineTotal)}</span>
              </li>
            ))}
          </ul>
          {error && (
            <p role="alert" className="flex items-start gap-2 rounded-xl bg-[#fff1f2] px-4 py-3 text-body-sm text-on-error-container">
              <Icon name="error" className="mt-0.5 text-[16px]" /> {error}
            </p>
          )}
        </form>

        <div className="lg:sticky lg:top-28">
          <OrderSummary
            cart={cart}
            showCoupons={false}
            action={
              <button form="checkout-form" className="btn-primary w-full !py-4 text-title" disabled={pending || !cart.canCheckout}>
                <Icon name="lock" className="text-[18px]" />
                {pending ? 'Placing order…' : 'Place order'}
              </button>
            }
          />
        </div>
      </div>
    </div>
  );
}
