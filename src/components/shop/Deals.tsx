'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/providers/FeedbackProvider';
import Icon from '@/components/ui/Icon';
import { api } from '@/lib/api-client';
import { formatPrice } from '@/lib/format';
import type { Coupon } from '@/lib/types';

// Promotional banners built from the live coupons (GET /api/coupons).
export default function Deals() {
  const toast = useToast();
  const [coupons, setCoupons] = useState<Coupon[] | null>(null);

  useEffect(() => {
    api.coupons().then(setCoupons).catch(() => setCoupons([]));
  }, []);

  if (!coupons || coupons.length === 0) return null;

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast('success', `Copied ${code}. Apply it in your cart.`);
    } catch {
      toast('info', `Your code is ${code}.`);
    }
  };

  return (
    <section id="deals" className="container-page mt-16 scroll-mt-24">
      <span className="text-label-sm uppercase tracking-wider text-primary">Deals</span>
      <h2 className="mb-5 font-display text-headline-md">Coupons you can use today</h2>
      <div className="grid gap-6 md:grid-cols-2">
        {coupons.map((c, i) => (
          <div
            key={c.code}
            className={`flex flex-col justify-between rounded-2xl p-6 shadow-sm ${
              i % 2 === 0 ? 'bg-gradient-to-br from-primary-container to-primary text-white' : 'border border-[#e2e8f0] bg-surface-container-highest/60'
            }`}
          >
            <div>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-label-sm uppercase ${
                  i % 2 === 0 ? 'bg-white/15 text-white' : 'bg-tertiary text-white'
                }`}
              >
                <Icon name="confirmation_number" className="text-[14px]" /> Promo code
              </span>
              <h3 className="mt-4 font-display text-headline-sm">{c.description || c.code}</h3>
              <p className={`mt-2 text-body-sm ${i % 2 === 0 ? 'text-white/80' : 'text-on-surface-variant'}`}>
                Use code <b className={i % 2 === 0 ? 'text-white' : 'text-primary'}>{c.code}</b> in your cart
                {Number(c.min_order) > 0 ? ` on orders of ${formatPrice(c.min_order)} or more.` : '.'}
              </p>
            </div>
            <button
              onClick={() => copy(c.code)}
              className={`mt-6 flex min-h-11 items-center justify-center gap-2 rounded-lg text-label-md ${
                i % 2 === 0 ? 'bg-white text-primary hover:bg-primary-fixed' : 'border border-[#e2e8f0] bg-white hover:bg-surface-container-low'
              }`}
            >
              <Icon name="content_copy" className="text-[18px]" /> Copy code
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
