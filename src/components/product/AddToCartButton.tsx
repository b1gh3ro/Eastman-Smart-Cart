'use client';

import Icon from '@/components/ui/Icon';
import { useStore } from '@/components/providers/StoreProvider';
import type { Product } from '@/lib/types';

export default function AddToCartButton({
  product,
  quantity = 1,
  className = '',
  label = 'Add',
  onAdded,
}: {
  product: Pick<Product, 'id' | 'name' | 'stock'>;
  quantity?: number;
  className?: string;
  label?: string;
  onAdded?: () => void;
}) {
  const { addToCart, busy } = useStore();
  const soldOut = product.stock <= 0;
  const pending = busy.has(product.id);
  return (
    <button
      type="button"
      className={`btn-primary ${className}`}
      disabled={soldOut || pending}
      aria-label={soldOut ? `${product.name} is out of stock` : `Add ${product.name} to cart`}
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (await addToCart(product.id, quantity, product.name)) onAdded?.();
      }}
    >
      <Icon name={pending ? 'progress_activity' : 'add_shopping_cart'} className={`text-[18px] ${pending ? 'animate-spin' : ''}`} />
      {soldOut ? 'Sold out' : label}
    </button>
  );
}
