import Icon from '@/components/ui/Icon';

const CATEGORY_ICONS: Record<string, string> = {
  kitchen: 'coffee',
  clothing: 'checkroom',
  electronics: 'headphones',
  audio: 'headphones',
  books: 'menu_book',
  stationery: 'edit_note',
  sports: 'sports_basketball',
};

export const categoryIcon = (category?: string | null) => CATEGORY_ICONS[category?.toLowerCase() ?? ''] ?? 'inventory_2';

// The product photo, or a tidy placeholder when the product has no image_url.
export default function ProductImage({
  src,
  alt,
  category,
  className = '',
  iconSize = 'text-[56px]',
}: {
  src: string | null | undefined;
  alt: string;
  category?: string | null;
  className?: string;
  iconSize?: string;
}) {
  if (src) {
    return (
      // Product images can come from any host, so a plain <img> is used instead of next/image.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} loading="lazy" className={`h-full w-full object-cover ${className}`} />
    );
  }
  return (
    <div
      role="img"
      aria-label={alt}
      className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-surface-container-low via-white to-primary-fixed/60 text-primary/60 ${className}`}
    >
      <Icon name={categoryIcon(category)} className={iconSize} />
    </div>
  );
}
