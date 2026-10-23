'use client';

import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import StockBadge from '@/components/ui/StockBadge';
import { formatPrice } from '@/lib/format';
import type { Product } from '@/lib/types';
import AddToCartButton from './AddToCartButton';
import ProductImage from './ProductImage';
import WishlistButton from './WishlistButton';

export default function ProductCard({ product, onQuickView }: { product: Product; onQuickView?: (product: Product) => void }) {
  return (
    <article className="group card relative flex flex-col p-4 transition-all duration-150 ease-out hover:border-[#cbd5e1] hover:shadow-md">
      <div className="relative mb-4 aspect-square w-full overflow-hidden rounded-xl bg-[#f8fafc]">
        <Link href={`/products/${product.id}`} tabIndex={-1} aria-hidden="true">
          <ProductImage
            src={product.image_url}
            alt={product.name}
            category={product.category}
            className="transition-transform duration-300 group-hover:scale-105"
          />
        </Link>
        {product.is_featured && (
          <span className="absolute left-3 top-3 rounded-full bg-secondary-fixed px-2 py-0.5 text-label-sm text-on-secondary-fixed">
            Featured
          </span>
        )}
        {product.stock > 0 && product.stock <= 5 && !product.is_featured && (
          <span className="absolute left-3 top-3 rounded-full border border-[#ffe4e6] bg-[#fff1f2] px-2 py-0.5 text-label-sm text-[#f43f5e]">
            Low stock
          </span>
        )}
        <WishlistButton productId={product.id} name={product.name} className="absolute right-3 top-3" />
        {onQuickView && (
          <button
            type="button"
            onClick={() => onQuickView(product)}
            className="absolute inset-x-3 bottom-3 flex items-center justify-center gap-1.5 rounded-lg bg-inverse-surface/90 py-2 text-label-sm text-inverse-on-surface shadow-md backdrop-blur-sm transition-opacity focus:opacity-100 md:opacity-0 md:group-hover:opacity-100"
          >
            <Icon name="visibility" className="text-[16px]" /> Quick view
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col">
        <span className="mb-1.5 text-label-sm uppercase tracking-wider text-secondary">{product.category}</span>
        <h3 className="font-display text-title">
          <Link href={`/products/${product.id}`} className="hover:text-primary focus:outline-none focus-visible:underline">
            {product.name}
          </Link>
        </h3>
        {product.description && <p className="mt-1 line-clamp-2 text-body-sm text-on-surface-variant">{product.description}</p>}
        <StockBadge stock={product.stock} className="mb-4 mt-2" />

        <div className="mt-auto flex items-center justify-between border-t border-[#f1f5f9] pt-4">
          <span className="tabular font-display text-headline-sm">{formatPrice(product.price)}</span>
          <AddToCartButton product={product} />
        </div>
      </div>
    </article>
  );
}
