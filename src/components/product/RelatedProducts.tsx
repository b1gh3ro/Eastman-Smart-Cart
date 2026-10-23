'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { formatPrice } from '@/lib/format';
import type { Product } from '@/lib/types';
import ProductImage from './ProductImage';

// "You may also like": other products in the same category, from the products API.
export default function RelatedProducts({
  product,
  onSelect,
  compact,
}: {
  product: Pick<Product, 'id' | 'category'>;
  onSelect?: (product: Product) => void;
  compact?: boolean;
}) {
  const [related, setRelated] = useState<{ forId: string; items: Product[] } | null>(null);

  useEffect(() => {
    let live = true;
    api
      .products({ category: product.category, limit: 5 })
      .then(({ products }) => live && setRelated({ forId: product.id, items: products.filter((p) => p.id !== product.id).slice(0, 4) }))
      .catch(() => live && setRelated({ forId: product.id, items: [] })); // optional section: hide on failure
    return () => {
      live = false;
    };
  }, [product.id, product.category]);

  const items = related?.forId === product.id ? related.items : [];
  if (items.length === 0) return null;

  return (
    <section className={compact ? 'mt-8 border-t border-[#e2e8f0] pt-6' : 'mt-14'}>
      <h3 className={`font-display ${compact ? 'text-title' : 'text-headline-sm'} mb-4`}>You may also like</h3>
      <div className={`grid gap-4 ${compact ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`}>
        {items.map((p) => {
          const inner = (
            <>
              <div className="mb-2 aspect-square overflow-hidden rounded-lg bg-[#f8fafc]">
                <ProductImage src={p.image_url} alt={p.name} category={p.category} iconSize="text-[36px]" />
              </div>
              <div className="line-clamp-1 text-label-md">{p.name}</div>
              <div className="tabular text-body-sm text-on-surface-variant">{formatPrice(p.price)}</div>
            </>
          );
          return onSelect ? (
            <button key={p.id} className="rounded-xl p-2 text-left hover:bg-surface-container-low" onClick={() => onSelect(p)}>
              {inner}
            </button>
          ) : (
            <Link key={p.id} href={`/products/${p.id}`} className="rounded-xl p-2 hover:bg-surface-container-low">
              {inner}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
