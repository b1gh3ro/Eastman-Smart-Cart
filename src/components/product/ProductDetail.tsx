'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Icon from '@/components/ui/Icon';
import QuantityStepper from '@/components/ui/QuantityStepper';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import StockBadge from '@/components/ui/StockBadge';
import { api, ApiRequestError, errorMessage } from '@/lib/api-client';
import { formatPrice } from '@/lib/format';
import type { Product } from '@/lib/types';
import AddToCartButton from './AddToCartButton';
import ProductImage from './ProductImage';
import RelatedProducts from './RelatedProducts';
import WishlistButton from './WishlistButton';

type State = { id: string; product: Product | null; error: string | null; notFound: boolean };

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<State | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let live = true;
    api
      .product(id)
      .then((product) => live && setState({ id, product, error: null, notFound: false }))
      .catch(
        (err) =>
          live &&
          setState({ id, product: null, error: errorMessage(err), notFound: err instanceof ApiRequestError && err.status === 404 }),
      );
    return () => {
      live = false;
    };
  }, [id, retry]);

  const current = state?.id === id ? state : null;

  if (!current) {
    return (
      <div className="container-page grid gap-10 py-10 md:grid-cols-2" role="status" aria-label="Loading product">
        <Skeleton className="aspect-square rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }
  if (current.notFound) {
    return (
      <div className="container-page py-10">
        <EmptyState icon="inventory_2" title="Product not found" message="It may have been removed or is no longer for sale." action={{ label: 'Back to shop', href: '/' }} />
      </div>
    );
  }
  if (!current.product) {
    return (
      <div className="container-page py-10">
        <ErrorState message={current.error ?? 'Could not load this product.'} onRetry={() => setRetry((n) => n + 1)} />
      </div>
    );
  }

  const product = current.product;
  const maxQuantity = Math.max(1, Math.min(10, product.stock));

  return (
    <div className="container-page py-8 md:py-10">
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1 text-body-sm text-secondary">
        <Link href="/" className="hover:text-primary">
          Shop
        </Link>
        <Icon name="chevron_right" className="text-[16px]" />
        <Link href={`/?category=${encodeURIComponent(product.category)}#catalog`} className="hover:text-primary">
          {product.category}
        </Link>
        <Icon name="chevron_right" className="text-[16px]" />
        <span className="truncate text-on-surface">{product.name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
        <div className="card relative overflow-hidden p-3">
          <div className="aspect-square overflow-hidden rounded-xl bg-[#f8fafc]">
            <ProductImage src={product.image_url} alt={product.name} category={product.category} iconSize="text-[120px]" />
          </div>
          <WishlistButton productId={product.id} name={product.name} className="absolute right-6 top-6" />
        </div>

        <div className="flex flex-col">
          <span className="text-label-sm uppercase tracking-wider text-secondary">{product.category}</span>
          <h1 className="mt-2 font-display text-headline-lg-mobile md:text-headline-lg">{product.name}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <span className="tabular font-display text-headline-lg text-primary">{formatPrice(product.price)}</span>
            <StockBadge stock={product.stock} />
          </div>
          <p className="mt-1 text-body-sm text-outline">Price includes taxes. Free delivery.</p>
          {product.description && <p className="mt-6 text-body-lg text-on-surface-variant">{product.description}</p>}

          <div className="card mt-8 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <QuantityStepper label="Quantity" value={quantity} max={maxQuantity} disabled={product.stock <= 0} onChange={setQuantity} />
              <AddToCartButton product={product} quantity={quantity} label="Add to cart" className="flex-1" onAdded={() => setQuantity(1)} />
            </div>
            <p className="mt-3 text-body-sm text-secondary">Up to 10 per order{product.stock > 0 && product.stock < 10 ? `, ${product.stock} available` : ''}.</p>
          </div>

          <ul className="mt-6 space-y-3 text-body-sm text-on-surface-variant">
            <li className="flex items-center gap-2">
              <Icon name="local_shipping" className="text-[18px] text-primary" /> Free delivery
            </li>
            <li className="flex items-center gap-2">
              <Icon name="assignment_return" className="text-[18px] text-primary" /> Easy returns
            </li>
            <li className="flex items-center gap-2">
              <Icon name="lock" className="text-[18px] text-primary" /> Stock is checked again when you pay
            </li>
          </ul>
        </div>
      </div>

      <RelatedProducts product={product} />
    </div>
  );
}
