import Link from 'next/link';
import Icon from './Icon';

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-surface-container-high ${className}`} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="card flex flex-col p-4" aria-hidden="true">
      <Skeleton className="mb-4 aspect-square w-full rounded-xl" />
      <Skeleton className="mb-2 h-3 w-1/3" />
      <Skeleton className="mb-2 h-5 w-4/5" />
      <Skeleton className="mb-6 h-3 w-1/4" />
      <div className="mt-auto flex items-center justify-between">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" role="status" aria-label="Loading products">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon: string;
  title: string;
  message?: string;
  action?: { label: string; href?: string; onClick?: () => void };
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-fixed text-primary">
        <Icon name={icon} className="text-[30px]" />
      </div>
      <h2 className="font-display text-headline-sm">{title}</h2>
      {message && <p className="mt-2 max-w-md text-body-md text-on-surface-variant">{message}</p>}
      {action &&
        (action.href ? (
          <Link href={action.href} className="btn-primary mt-6">
            {action.label}
          </Link>
        ) : (
          <button className="btn-primary mt-6" onClick={action.onClick}>
            {action.label}
          </button>
        ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center rounded-2xl border border-error/20 bg-[#fff1f2] px-6 py-10 text-center">
      <Icon name="cloud_off" className="mb-3 text-[32px] text-error" />
      <p className="font-display text-title text-on-error-container">Something went wrong</p>
      <p className="mt-1 max-w-md text-body-sm text-on-error-container/80">{message}</p>
      {onRetry && (
        <button className="btn-secondary mt-5" onClick={onRetry}>
          <Icon name="refresh" className="text-[18px]" /> Try again
        </button>
      )}
    </div>
  );
}
