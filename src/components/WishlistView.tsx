'use client';

import Link from 'next/link';
import AddToCartButton from '@/components/product/AddToCartButton';
import ProductImage from '@/components/product/ProductImage';
import { useStore } from '@/components/providers/StoreProvider';
import Icon from '@/components/ui/Icon';
import { EmptyState, ProductGridSkeleton } from '@/components/ui/States';
import StockBadge from '@/components/ui/StockBadge';
import { formatPrice } from '@/lib/format';

export default function WishlistView() {
  const { me, wishlist, toggleWishlist, busy } = useStore();

  if (me === null) {
    return (
      <div className="container-page py-10">
        <EmptyState icon="favorite" title="Log in to see your wishlist" message="Save products for later and find them on any device." action={{ label: 'Log in', href: '/login?next=/wishlist' }} />
      </div>
    );
  }
  if (me === undefined) {
    return (
      <div className="container-page py-10">
        <ProductGridSkeleton count={4} />
      </div>
    );
  }

  const entries = wishlist.filter((w) => w.product);

  return (
    <div className="container-page py-8 md:py-10">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-headline-lg">Wishlist</h1>
        <span className="tabular rounded-full bg-secondary-fixed px-2.5 py-0.5 text-label-sm text-on-secondary-fixed">{entries.length} saved</span>
      </div>

      {entries.length === 0 ? (
        <EmptyState icon="favorite" title="Nothing saved yet" message="Tap the heart on any product to save it here." action={{ label: 'Browse products', href: '/' }} />
      ) : (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {entries.map(({ product }) => {
            const p = product!;
            return (
              <li key={p.id} className="card flex flex-col p-4">
                <Link href={`/products/${p.id}`} className="mb-4 block aspect-square overflow-hidden rounded-xl bg-[#f8fafc]">
                  <ProductImage src={p.image_url} alt={p.name} category={p.category} />
                </Link>
                <span className="text-label-sm uppercase tracking-wider text-secondary">{p.category}</span>
                <Link href={`/products/${p.id}`} className="font-display text-title hover:text-primary">
                  {p.name}
                </Link>
                {p.is_active ? <StockBadge stock={p.stock} className="mt-1" /> : <span className="mt-1 text-label-sm text-error">No longer available</span>}
                <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                  <span className="tabular font-display text-headline-sm">{formatPrice(p.price)}</span>
                  <div className="flex gap-2">
                    <button
                      aria-label={`Remove ${p.name} from wishlist`}
                      disabled={busy.has(`wish:${p.id}`)}
                      onClick={() => toggleWishlist(p.id, p.name)}
                      className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#e2e8f0] text-secondary hover:text-error disabled:opacity-50"
                    >
                      <Icon name="delete" className="text-[20px]" />
                    </button>
                    {p.is_active && <AddToCartButton product={p} />}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
