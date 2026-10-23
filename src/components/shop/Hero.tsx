'use client';

import ProductImage from '@/components/product/ProductImage';
import Icon from '@/components/ui/Icon';
import { formatPrice } from '@/lib/format';
import type { Product } from '@/lib/types';

const PERKS = [
  { icon: 'local_shipping', title: 'Free delivery', text: 'On every order' },
  { icon: 'sell', title: 'Coupons', text: 'Applied at checkout' },
  { icon: 'lock', title: 'Secure checkout', text: 'Stock held when you pay' },
];

export default function Hero({ spotlight, onQuickView }: { spotlight?: Product; onQuickView: (p: Product) => void }) {
  return (
    <section className="container-page pb-10 pt-6 md:pt-10">
      <div className="card relative grid overflow-hidden lg:grid-cols-[1.4fr_1fr]">
        <div className="relative z-10 p-6 md:p-12">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-fixed px-3 py-1 text-label-sm uppercase text-primary">
            <Icon name="bolt" className="text-[14px]" /> New season
          </span>
          <h1 className="mt-5 font-display text-display-mobile md:text-display">
            Everyday essentials,
            <br />
            delivered<span className="text-primary">.</span>
          </h1>
          <p className="mt-4 max-w-lg text-body-lg text-on-surface-variant">
            Kitchen, clothing and tech picks at fair prices. Your cart is saved to your account, and checkout takes seconds.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#catalog" className="btn-primary">
              Shop catalog <Icon name="arrow_forward" className="text-[18px]" />
            </a>
            <a href="#deals" className="btn-secondary">
              <Icon name="confirmation_number" className="text-[18px]" /> See deals
            </a>
          </div>
          <div className="mt-10 grid gap-4 border-t border-[#e2e8f0] pt-6 sm:grid-cols-3">
            {PERKS.map((perk) => (
              <div key={perk.title} className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-container-low text-primary">
                  <Icon name={perk.icon} className="text-[20px]" />
                </span>
                <div>
                  <div className="text-label-md">{perk.title}</div>
                  <div className="text-body-sm text-secondary">{perk.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center bg-surface-container-low p-6 md:p-8">
          {spotlight ? (
            <button
              onClick={() => onQuickView(spotlight)}
              className="w-full rounded-2xl border border-[#e2e8f0] bg-white p-3 text-left shadow-md transition-shadow hover:shadow-xl"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#f8fafc]">
                <ProductImage src={spotlight.image_url} alt={spotlight.name} category={spotlight.category} iconSize="text-[96px]" />
                <span className="absolute right-3 top-3 rounded-full bg-secondary-fixed px-2 py-0.5 text-label-sm text-on-secondary-fixed">
                  Featured
                </span>
              </div>
              <div className="flex items-end justify-between gap-3 px-1 pb-1 pt-4">
                <div>
                  <div className="text-label-sm uppercase tracking-wider text-secondary">Spotlight</div>
                  <div className="font-display text-title">{spotlight.name}</div>
                </div>
                <span className="tabular font-display text-headline-sm text-primary">{formatPrice(spotlight.price)}</span>
              </div>
            </button>
          ) : (
            <div className="flex aspect-[4/3] w-full flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-primary-container to-primary text-white shadow-md">
              <Icon name="shopping_cart" className="text-[72px] opacity-90" />
              <span className="mt-3 font-display text-title">Everyday essentials, online</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
