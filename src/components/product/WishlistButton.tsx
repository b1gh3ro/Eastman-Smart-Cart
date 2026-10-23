'use client';

import Icon from '@/components/ui/Icon';
import { useStore } from '@/components/providers/StoreProvider';

export default function WishlistButton({ productId, name, className = '' }: { productId: string; name: string; className?: string }) {
  const { wishlistIds, toggleWishlist, busy } = useStore();
  const saved = wishlistIds.has(productId);
  return (
    <button
      type="button"
      aria-label={saved ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`}
      aria-pressed={saved}
      disabled={busy.has(`wish:${productId}`)}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(productId, name);
      }}
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-lowest/85 shadow-xs backdrop-blur-md transition-colors disabled:opacity-60 ${
        saved ? 'text-[#f43f5e]' : 'text-secondary hover:text-[#f43f5e]'
      } ${className}`}
    >
      <Icon name="favorite" filled={saved} className="text-[19px]" />
    </button>
  );
}
