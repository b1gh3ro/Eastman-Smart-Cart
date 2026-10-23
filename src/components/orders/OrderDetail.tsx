'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useStore } from '@/components/providers/StoreProvider';
import Icon from '@/components/ui/Icon';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { api, errorMessage } from '@/lib/api-client';
import { formatDate, formatPrice } from '@/lib/format';
import type { Order } from '@/lib/types';

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const justPlaced = useSearchParams().get('placed') === '1';
  const { me } = useStore();
  const [state, setState] = useState<{ id: string; order: Order | null; error: string | null } | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!me) return;
    let live = true;
    api
      .order(id)
      .then((order) => live && setState({ id, order, error: null }))
      .catch((err) => live && setState({ id, order: null, error: errorMessage(err) }));
    return () => {
      live = false;
    };
  }, [id, me, retry]);

  if (me === null) {
    return (
      <div className="container-page py-10">
        <EmptyState icon="lock" title="Log in to see this order" action={{ label: 'Log in', href: `/login?next=/orders/${id}` }} />
      </div>
    );
  }

  const current = state?.id === id ? state : null;
  if (!current) {
    return (
      <div className="container-page py-10" role="status" aria-label="Loading order">
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }
  if (!current.order) {
    return (
      <div className="container-page py-10">
        <ErrorState message={current.error ?? 'Order not found.'} onRetry={() => setRetry((n) => n + 1)} />
      </div>
    );
  }

  const order = current.order;
  const row = 'flex justify-between gap-4';

  return (
    <div className="container-page max-w-3xl py-8 md:py-10">
      {justPlaced && (
        <div role="status" className="mb-6 flex items-center gap-3 rounded-2xl border border-tertiary/20 bg-[#ecfdf5] p-5 text-on-tertiary-fixed-variant">
          <Icon name="check_circle" className="text-[28px]" filled />
          <div>
            <div className="font-display text-title">Thank you, your order is confirmed!</div>
            <div className="text-body-sm">A copy has been saved to your order history.</div>
          </div>
        </div>
      )}
      <Link href="/orders" className="mb-4 inline-flex items-center gap-1 text-label-md text-primary hover:underline">
        <Icon name="arrow_back" className="text-[18px]" /> All orders
      </Link>
      <div className="card p-6 md:p-8">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="font-display text-headline-md">Order #{order.id}</h1>
          <span className="text-body-sm text-secondary">{formatDate(order.created_at)}</span>
        </div>
        <div className="mt-4 text-body-sm text-on-surface-variant">
          <div>{order.customer_name}</div>
          <div>{order.email}</div>
          <div className="whitespace-pre-line">{order.address}</div>
        </div>

        <ul className="mt-6 divide-y divide-[#f1f5f9] border-y border-[#f1f5f9]">
          {order.order_items?.map((item) => (
            <li key={item.product_id} className="flex justify-between gap-4 py-3 text-body-md">
              <span>
                {item.name} <span className="text-secondary">× {item.quantity}</span>
              </span>
              <span className="tabular">{formatPrice(Math.round(item.price * 100 * item.quantity) / 100)}</span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-2 text-body-md">
          <div className={row}>
            <dt className="text-on-surface-variant">Subtotal</dt>
            <dd className="tabular">{formatPrice(order.subtotal)}</dd>
          </div>
          {Number(order.discount) > 0 && (
            <div className={`${row} text-tertiary`}>
              <dt>Discount {order.coupon_code && `(${order.coupon_code})`}</dt>
              <dd className="tabular">−{formatPrice(order.discount)}</dd>
            </div>
          )}
          <div className={row}>
            <dt className="text-on-surface-variant">Shipping</dt>
            <dd className="text-tertiary">FREE</dd>
          </div>
          <div className={`${row} border-t border-[#e2e8f0] pt-3 font-display text-title`}>
            <dt>Total paid</dt>
            <dd className="tabular text-primary">{formatPrice(order.total)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
