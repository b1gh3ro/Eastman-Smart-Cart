import { Suspense } from 'react';
import ProductDetail from '@/components/product/ProductDetail';
import { Skeleton } from '@/components/ui/States';

export default function ProductPage() {
  return (
    <Suspense
      fallback={
        <div className="container-page grid gap-10 py-10 md:grid-cols-2">
          <Skeleton className="aspect-square rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      }
    >
      <ProductDetail />
    </Suspense>
  );
}
