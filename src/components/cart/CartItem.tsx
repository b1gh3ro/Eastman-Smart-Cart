'use client';

import Link from 'next/link';
import ProductImage from '@/components/product/ProductImage';
import { useStore } from '@/components/providers/StoreProvider';
import Icon from '@/components/ui/Icon';
import QuantityStepper from '@/components/ui/QuantityStepper';
import { formatPrice } from '@/lib/format';
import type { CartLine } from '@/lib/types';

export default function CartItem({ line }: { line: CartLine }) {
  const { setQuantity, removeFromCart, saveForLater, busy } = useStore();
  const { product } = line;
  const pending = busy.has(product.id);
  // Let the shopper lower the quantity down to what's in stock, but not raise it past that.
  const max = Math.max(1, Math.min(10, Math.max(product.stock, line.quantity)));

  return (
    <li className={`flex gap-4 border-b border-[#f1f5f9] p-4 last:border-b-0 sm:gap-5 sm:p-6 ${pending ? 'opacity-60' : ''}`}>
      <Link href={`/products/${product.id}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-[#f8fafc] sm:h-28 sm:w-28">
        <ProductImage src={product.image_url} alt={product.name} category={product.category} iconSize="text-[36px]" />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-secondary-fixed px-2 py-0.5 text-label-sm text-on-secondary-fixed">{product.category}</span>
            {line.issue ? (
              <span className="inline-flex items-center gap-1 text-label-sm text-error">
                <Icon name="error" className="text-[14px]" /> {line.issue}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-label-sm text-tertiary">
                <span className="h-1.5 w-1.5 rounded-full bg-tertiary" /> In stock
              </span>
            )}
          </div>
          <Link href={`/products/${product.id}`} className="mt-1.5 block font-display text-title hover:text-primary">
            {product.name}
          </Link>
          <div className="tabular text-body-sm text-on-surface-variant">{formatPrice(product.price)} each</div>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
            {product.is_active && product.stock > 0 && line.quantity > product.stock && (
              <button
                className="inline-flex min-h-8 items-center gap-1 text-label-md text-primary hover:underline disabled:opacity-50"
                disabled={pending}
                onClick={() => setQuantity(product.id, Math.min(product.stock, 10))}
              >
                <Icon name="build" className="text-[18px]" /> Change to {Math.min(product.stock, 10)}
              </button>
            )}
            <button
              className="inline-flex min-h-8 items-center gap-1 text-label-md text-error hover:underline disabled:opacity-50"
              disabled={pending}
              onClick={() => removeFromCart(product.id, product.name)}
            >
              <Icon name="delete" className="text-[18px]" /> Remove
            </button>
            <button
              className="inline-flex min-h-8 items-center gap-1 text-label-md text-on-surface-variant hover:text-on-surface hover:underline disabled:opacity-50"
              disabled={pending}
              onClick={() => saveForLater(product.id, product.name)}
            >
              <Icon name="bookmark" className="text-[18px]" /> Save for later
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
          <span className="tabular order-2 font-display text-headline-sm sm:order-1">{formatPrice(line.lineTotal)}</span>
          <div className="order-1 sm:order-2">
            <QuantityStepper
              label={`Quantity of ${product.name}`}
              value={line.quantity}
              max={max}
              disabled={pending || !product.is_active}
              onChange={(q) => setQuantity(product.id, q)}
            />
          </div>
        </div>
      </div>
    </li>
  );
}
