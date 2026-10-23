import { Suspense } from 'react';
import OrderDetail from '@/components/orders/OrderDetail';
import { Skeleton } from '@/components/ui/States';

export default function OrderPage() {
  return (
    <Suspense
      fallback={
        <div className="container-page py-10">
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      }
    >
      <OrderDetail />
    </Suspense>
  );
}
