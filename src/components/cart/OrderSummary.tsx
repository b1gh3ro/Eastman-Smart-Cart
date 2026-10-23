'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/components/providers/StoreProvider';
import Icon from '@/components/ui/Icon';
import { api } from '@/lib/api-client';
import { formatPrice } from '@/lib/format';
import type { Cart, Coupon } from '@/lib/types';

// Totals exactly as the server calculated them, plus the promo code box.
export default function OrderSummary({
  cart,
  action,
  showCoupons = true,
}: {
  cart: Cart;
  action?: React.ReactNode;
  showCoupons?: boolean;
}) {
  const { coupon, applyCoupon } = useStore();
  const [code, setCode] = useState('');
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offers, setOffers] = useState<Coupon[]>([]);

  useEffect(() => {
    if (showCoupons) api.coupons().then(setOffers).catch(() => setOffers([]));
  }, [showCoupons]);

  const apply = async (value: string) => {
    if (!value.trim()) return;
    setApplying(true);
    setError(null);
    const next = await applyCoupon(value);
    setApplying(false);
    if (next?.couponError) setError(next.couponError);
    else if (next) setCode('');
  };

  const remove = async () => {
    setError(null);
    await applyCoupon(null);
  };

  const row = 'flex items-center justify-between gap-4';

  return (
    <div className="card p-6">
      <h2 className="font-display text-headline-sm">Order summary</h2>
      <dl className="mt-5 space-y-3 text-body-md">
        <div className={row}>
          <dt className="text-on-surface-variant">
            Subtotal ({cart.itemCount} item{cart.itemCount === 1 ? '' : 's'})
          </dt>
          <dd className="tabular">{formatPrice(cart.subtotal)}</dd>
        </div>
        <div className={row}>
          <dt className="text-on-surface-variant">Shipping</dt>
          <dd className="tabular font-medium text-tertiary">{cart.shipping === 0 ? 'FREE' : formatPrice(cart.shipping)}</dd>
        </div>
        <div className={row}>
          <dt className="text-on-surface-variant">Taxes</dt>
          <dd className="tabular text-on-surface-variant">{cart.taxIncluded ? 'Included in prices' : formatPrice(cart.tax)}</dd>
        </div>
        {cart.discount > 0 && (
          <div className={`${row} text-tertiary`}>
            <dt className="flex items-center gap-1.5">
              <Icon name="verified" className="text-[18px]" /> Coupon {cart.coupon}
            </dt>
            <dd className="tabular font-medium">−{formatPrice(cart.discount)}</dd>
          </div>
        )}
      </dl>

      {/* Promo code */}
      <div className="mt-6">
        <h3 className="text-label-sm uppercase tracking-wider text-secondary">Promo code</h3>
        {coupon && cart.coupon === coupon ? (
          <div className="mt-3 flex items-center justify-between rounded-xl border border-tertiary/20 bg-[#ecfdf5] px-4 py-3 text-label-md text-on-tertiary-fixed-variant">
            <span className="flex items-center gap-2">
              <Icon name="check_circle" className="text-[18px]" /> {coupon} applied (−{formatPrice(cart.discount)})
            </span>
            <button aria-label={`Remove coupon ${coupon}`} onClick={remove} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-tertiary/10">
              <Icon name="close" className="text-[18px]" />
            </button>
          </div>
        ) : (
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              apply(code);
            }}
          >
            <div className="relative flex-1">
              <Icon name="sell" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-secondary" />
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter code"
                aria-label="Promo code"
                className="field !pl-10 uppercase"
              />
            </div>
            <button className="btn-secondary" disabled={applying || !code.trim()}>
              {applying ? 'Checking…' : 'Apply'}
            </button>
          </form>
        )}

        {/* A coupon that stopped applying (e.g. the cart dropped below its minimum). */}
        {coupon && cart.couponError && (
          <p role="alert" className="mt-3 flex items-start gap-2 rounded-xl border border-error/15 bg-[#fff1f2] px-4 py-3 text-body-sm text-on-error-container">
            <Icon name="error" className="mt-0.5 text-[16px]" />
            <span className="flex-1">{cart.couponError}</span>
            <button className="underline" onClick={remove}>
              Remove
            </button>
          </p>
        )}
        {error && (
          <p role="alert" className="mt-3 flex items-start gap-2 rounded-xl border border-error/15 bg-[#fff1f2] px-4 py-3 text-body-sm text-on-error-container">
            <Icon name="error" className="mt-0.5 text-[16px]" /> {error}
          </p>
        )}

        {showCoupons && !coupon && offers.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {offers.map((o) => (
              <button
                key={o.code}
                onClick={() => apply(o.code)}
                disabled={applying}
                title={o.description ?? undefined}
                className="rounded-full border border-dashed border-outline-variant px-3 py-1 text-label-sm hover:border-primary hover:text-primary"
              >
                {o.code}
                {Number(o.min_order) > 0 && <span className="text-secondary"> · min {formatPrice(o.min_order)}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between rounded-xl bg-surface-container-low p-5">
        <span className="font-display text-title">Total payable</span>
        <div className="text-right">
          <div className="tabular font-display text-headline-md text-primary">{formatPrice(cart.total)}</div>
          {cart.discount > 0 && <div className="tabular text-body-sm text-tertiary">You save {formatPrice(cart.discount)}</div>}
        </div>
      </div>

      {action && <div className="mt-5">{action}</div>}

      <div className="mt-5 grid grid-cols-2 gap-3 text-body-sm text-on-surface-variant">
        <div className="flex items-center gap-2 rounded-xl border border-[#e2e8f0] px-3 py-2.5">
          <Icon name="shield" className="text-[18px]" /> Secure checkout
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-[#e2e8f0] px-3 py-2.5">
          <Icon name="assignment_return" className="text-[18px]" /> Easy returns
        </div>
      </div>
    </div>
  );
}
