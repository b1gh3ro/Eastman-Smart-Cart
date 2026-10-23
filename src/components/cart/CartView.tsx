'use client';

import Link from 'next/link';
import { useConfirm } from '@/components/providers/FeedbackProvider';
import { useStore } from '@/components/providers/StoreProvider';
import Icon from '@/components/ui/Icon';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import CartItem from './CartItem';
import OrderSummary from './OrderSummary';

export default function CartView() {
  const { me, cart, cartError, loadCart, clearCart } = useStore();
  const confirm = useConfirm();

  if (me === null) {
    return (
      <div className="container-page py-10">
        <EmptyState
          icon="lock"
          title="Log in to see your cart"
          message="Your cart is saved to your account, so it’s there on any device."
          action={{ label: 'Log in', href: '/login?next=/cart' }}
        />
      </div>
    );
  }

  if (!cart) {
    return (
      <div className="container-page py-10">
        {cartError ? (
          <ErrorState message={cartError} onRetry={loadCart} />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]" role="status" aria-label="Loading cart">
            <Skeleton className="h-96 rounded-2xl" />
            <Skeleton className="h-96 rounded-2xl" />
          </div>
        )}
      </div>
    );
  }

  const onClear = async () => {
    const ok = await confirm({
      title: 'Clear your cart?',
      message: `This removes all ${cart.itemCount} item${cart.itemCount === 1 ? '' : 's'} from your cart.`,
      confirmLabel: 'Clear cart',
      destructive: true,
    });
    if (ok) await clearCart();
  };

  const blocked = cart.items.filter((i) => i.issue);

  return (
    <div className="container-page py-8 md:py-10">
      <div className="card mb-6 flex flex-col gap-2 p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-headline-lg">Your cart</h1>
          <span className="tabular rounded-full bg-secondary-fixed px-2.5 py-0.5 text-label-sm text-on-secondary-fixed">
            {cart.itemCount} item{cart.itemCount === 1 ? '' : 's'}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-tertiary-fixed/60 px-2.5 py-0.5 text-label-sm text-on-tertiary-fixed-variant">
            <span className="h-1.5 w-1.5 rounded-full bg-tertiary" /> Synced to your account
          </span>
        </div>
        <p className="text-body-md text-on-surface-variant">Review your items, apply a promo code and check out.</p>
      </div>

      {cart.items.length === 0 ? (
        <EmptyState icon="shopping_cart" title="Your cart is empty" message="Browse the catalog and add something you like." action={{ label: 'Start shopping', href: '/' }} />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            {blocked.length > 0 && (
              <div role="alert" className="flex items-start gap-3 rounded-2xl border border-error/15 bg-[#fff1f2] p-4 text-body-sm text-on-error-container">
                <Icon name="warning" className="text-[20px]" />
                <span>
                  {blocked.length === 1 ? 'One item needs' : `${blocked.length} items need`} your attention before checkout. Lower the quantity or
                  remove {blocked.length === 1 ? 'it' : 'them'}.
                </span>
              </div>
            )}
            <ul className="card overflow-hidden">
              {cart.items.map((line) => (
                <CartItem key={line.product.id} line={line} />
              ))}
            </ul>
            <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
              <Link href="/" className="inline-flex min-h-11 items-center gap-2 px-2 text-label-md text-primary hover:underline">
                <Icon name="arrow_back" className="text-[18px]" /> Continue shopping
              </Link>
              <button className="btn-secondary" onClick={onClear}>
                <Icon name="remove_shopping_cart" className="text-[18px]" /> Clear cart
              </button>
            </div>
          </div>

          <div className="lg:sticky lg:top-28">
            <OrderSummary
              cart={cart}
              action={
                cart.canCheckout ? (
                  <Link href="/checkout" className="btn-primary w-full justify-between !py-4 text-title">
                    <span className="flex items-center gap-2">
                      <Icon name="lock" className="text-[18px]" /> Proceed to checkout
                    </span>
                    <span className="tabular flex items-center gap-1">
                      <Icon name="arrow_forward" className="text-[18px]" />
                    </span>
                  </Link>
                ) : (
                  <button className="btn-primary w-full !py-4" disabled>
                    Fix the items above to check out
                  </button>
                )
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
