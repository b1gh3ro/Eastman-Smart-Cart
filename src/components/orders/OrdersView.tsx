'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useStore } from '@/components/providers/StoreProvider';
import Icon from '@/components/ui/Icon';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { api, errorMessage } from '@/lib/api-client';
import { formatDate, formatPrice } from '@/lib/format';
import type { Order } from '@/lib/types';

export default function OrdersView() {
  const { me } = useStore();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!me) return;
    let live = true;
    api
      .orders()
      .then((o) => live && (setOrders(o), setError(null)))
      .catch((err) => live && setError(errorMessage(err)));
    return () => {
      live = false;
    };
  }, [me, retry]);

  if (me === null) {
    return (
      <div className="container-page py-10">
        <EmptyState icon="receipt_long" title="Log in to see your orders" action={{ label: 'Log in', href: '/login?next=/orders' }} />
      </div>
    );
  }

  return (
    <div className="container-page py-8 md:py-10">
      <h1 className="mb-6 font-display text-headline-lg">My orders</h1>
      {error ? (
        <ErrorState message={error} onRetry={() => setRetry((n) => n + 1)} />
      ) : !orders ? (
        <div className="space-y-3" role="status" aria-label="Loading orders">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState icon="receipt_long" title="No orders yet" message="When you check out, your orders will show up here." action={{ label: 'Start shopping', href: '/' }} />
      ) : (
        <ul className="card divide-y divide-[#f1f5f9]">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/orders/${o.id}`} className="flex items-center justify-between gap-4 p-5 hover:bg-surface-container-low">
                <div>
                  <div className="font-display text-title">Order #{o.id}</div>
                  <div className="text-body-sm text-secondary">{formatDate(o.created_at)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="tabular font-display text-title">{formatPrice(o.total)}</span>
                  <Icon name="chevron_right" className="text-secondary" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
