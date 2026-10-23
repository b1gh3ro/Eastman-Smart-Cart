'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/Icon';
import QuantityStepper from '@/components/ui/QuantityStepper';
import StockBadge from '@/components/ui/StockBadge';
import { formatPrice } from '@/lib/format';
import type { Product } from '@/lib/types';
import AddToCartButton from './AddToCartButton';
import ProductImage from './ProductImage';
import RelatedProducts from './RelatedProducts';
import WishlistButton from './WishlistButton';

// Slide-in panel with a product's details, opened from a product card.
export default function QuickView({
  product,
  onClose,
  onSelect,
}: {
  product: Product;
  onClose: () => void;
  onSelect: (product: Product) => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const closeRef = useRef<HTMLButtonElement>(null);
  const maxQuantity = Math.max(1, Math.min(10, product.stock));

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-on-surface/40 backdrop-blur-sm" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Quick view: ${product.name}`}
        className="animate-drawer-in flex h-full w-full max-w-lg flex-col overflow-y-auto border-l border-[#e2e8f0] bg-surface-container-lowest shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e2e8f0] bg-white/85 px-6 py-4 backdrop-blur-xl">
          <span className="text-label-sm uppercase tracking-wider text-secondary">Quick view</span>
          <button ref={closeRef} aria-label="Close quick view" className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-surface-container" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>

        <div className="p-6">
          <div className="relative mb-6 aspect-square overflow-hidden rounded-xl bg-[#f8fafc]">
            <ProductImage src={product.image_url} alt={product.name} category={product.category} iconSize="text-[96px]" />
            <WishlistButton productId={product.id} name={product.name} className="absolute right-3 top-3" />
          </div>
          <span className="text-label-sm uppercase tracking-wider text-secondary">{product.category}</span>
          <h2 className="mt-1 font-display text-headline-md">{product.name}</h2>
          <div className="mt-3 flex items-center gap-4">
            <span className="tabular font-display text-headline-md text-primary">{formatPrice(product.price)}</span>
            <StockBadge stock={product.stock} />
          </div>
          {product.description && <p className="mt-4 text-body-md text-on-surface-variant">{product.description}</p>}
          <p className="mt-2 text-body-sm text-outline">Price includes taxes.</p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <QuantityStepper label="Quantity" value={quantity} max={maxQuantity} disabled={product.stock <= 0} onChange={setQuantity} />
            <AddToCartButton product={product} quantity={quantity} label="Add to cart" className="flex-1" onAdded={() => setQuantity(1)} />
          </div>
          <Link href={`/products/${product.id}`} className="mt-4 inline-flex items-center gap-1 text-label-md text-primary hover:underline">
            View full details <Icon name="arrow_forward" className="text-[18px]" />
          </Link>

          <RelatedProducts product={product} onSelect={onSelect} compact />
        </div>
      </aside>
    </div>
  );
}
