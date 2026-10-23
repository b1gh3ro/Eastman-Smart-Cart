'use client';

// The storefront: hero, featured products, category chips, search / price / sort controls,
// the product grid with "load more", and current deals. Filters live in the URL so they
// survive reloads and can be shared.

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import ProductCard from '@/components/product/ProductCard';
import QuickView from '@/components/product/QuickView';
import Icon from '@/components/ui/Icon';
import { EmptyState, ErrorState, ProductGridSkeleton } from '@/components/ui/States';
import { api, errorMessage } from '@/lib/api-client';
import { formatPrice } from '@/lib/format';
import type { Category, Product } from '@/lib/types';
import Deals from './Deals';
import Hero from './Hero';

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: 'name', label: 'Name: A → Z' },
  { value: 'name_desc', label: 'Name: Z → A' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
];

const PRICE_PRESETS = [
  { label: 'Under ₹500', min: '', max: '500' },
  { label: '₹500 – ₹1,500', min: '500', max: '1500' },
  { label: 'Over ₹1,500', min: '1500', max: '' },
];

type Listing = { key: string; products: Product[]; total: number; page: number; error: string | null };

export default function Shop() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const search = params.get('search') ?? '';
  const category = params.get('category') ?? '';
  const minPrice = params.get('minPrice') ?? '';
  const maxPrice = params.get('maxPrice') ?? '';
  const sort = params.get('sort') ?? 'name';
  const queryKey = JSON.stringify({ search, category, minPrice, maxPrice, sort });

  const [listing, setListing] = useState<Listing | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [retry, setRetry] = useState(0);
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [quickView, setQuickView] = useState<Product | null>(null);
  const [searchInput, setSearchInput] = useState(search);
  const [priceInput, setPriceInput] = useState({ min: minPrice, max: maxPrice });

  // Keep the inputs in step when the URL changes (back button, header search, chips).
  const [synced, setSynced] = useState({ search, minPrice, maxPrice });
  if (synced.search !== search || synced.minPrice !== minPrice || synced.maxPrice !== maxPrice) {
    setSynced({ search, minPrice, maxPrice });
    setSearchInput(search);
    setPriceInput({ min: minPrice, max: maxPrice });
  }

  const updateParams = useCallback(
    (changes: Record<string, string>) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      const qs = next.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
    },
    [params, pathname, router],
  );

  // Page 1 of the product list whenever the filters change.
  useEffect(() => {
    let live = true;
    api
      .products({ search, category, minPrice, maxPrice, sort, page: 1, limit: PAGE_SIZE })
      .then(({ products, total }) => live && setListing({ key: queryKey, products, total, page: 1, error: null }))
      .catch((err) => live && setListing({ key: queryKey, products: [], total: 0, page: 1, error: errorMessage(err) }));
    return () => {
      live = false;
    };
  }, [queryKey, search, category, minPrice, maxPrice, sort, retry]);

  // Categories and featured products, once.
  useEffect(() => {
    api.categories().then(setCategories).catch(() => setCategories([]));
    // Featured needs the is_featured column (supabase/002_storefront.sql); the section hides without it.
    api
      .products({ featured: true, limit: 4 })
      .then(({ products }) => setFeatured(products))
      .catch(() => setFeatured([]));
  }, []);

  // Typing in the search box updates the URL after a short pause.
  useEffect(() => {
    const term = searchInput.trim();
    if (term === search) return;
    const timer = setTimeout(() => updateParams({ search: term }), 350);
    return () => clearTimeout(timer);
  }, [searchInput, search, updateParams]);

  const closeQuickView = useCallback(() => setQuickView(null), []);
  const current = listing?.key === queryKey ? listing : null;
  const hasMore = current ? current.products.length < current.total : false;

  const loadMore = async () => {
    if (!current) return;
    setLoadingMore(true);
    try {
      const { products, total } = await api.products({ search, category, minPrice, maxPrice, sort, page: current.page + 1, limit: PAGE_SIZE });
      setListing((prev) =>
        prev && prev.key === queryKey
          ? {
              ...prev,
              products: [...prev.products, ...products.filter((p) => !prev.products.some((q) => q.id === p.id))],
              total,
              page: prev.page + 1,
            }
          : prev,
      );
    } catch (err) {
      setListing((prev) => (prev ? { ...prev, error: errorMessage(err) } : prev));
    } finally {
      setLoadingMore(false);
    }
  };

  const applyPrice = (min: string, max: string) => {
    if (min && max && Number(min) > Number(max)) [min, max] = [max, min];
    updateParams({ minPrice: min, maxPrice: max });
  };

  const totalProducts = categories?.reduce((sum, c) => sum + c.count, 0);
  const filtersActive = Boolean(search || category || minPrice || maxPrice);
  const priceLabel =
    minPrice && maxPrice
      ? `${formatPrice(Number(minPrice))} – ${formatPrice(Number(maxPrice))}`
      : minPrice
        ? `From ${formatPrice(Number(minPrice))}`
        : maxPrice
          ? `Up to ${formatPrice(Number(maxPrice))}`
          : '';

  const chip = (active: boolean) =>
    `flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-label-md transition-all ${
      active ? 'border-[#0f172a] bg-[#0f172a] text-white' : 'border-[#e2e8f0] bg-white text-[#1e293b] hover:bg-surface-container-high'
    }`;

  return (
    <div className="pb-6">
      <Hero spotlight={featured[0]} onQuickView={setQuickView} />

      {featured.length > 0 && !filtersActive && (
        <section id="featured" className="container-page mb-12 scroll-mt-24">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <span className="text-label-sm uppercase tracking-wider text-primary">Hand-picked</span>
              <h2 className="font-display text-headline-md">Featured products</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} onQuickView={setQuickView} />
            ))}
          </div>
        </section>
      )}

      {/* Category chips */}
      <section id="categories" className="container-page mb-6 scroll-mt-24">
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0" role="toolbar" aria-label="Categories">
          <button className={chip(!category)} aria-pressed={!category} onClick={() => updateParams({ category: '' })}>
            <Icon name="grid_view" className="text-[18px]" /> All products
            {totalProducts !== undefined && (
              <span className={`tabular rounded-full px-1.5 text-label-sm ${!category ? 'bg-white/20' : 'bg-surface-container'}`}>{totalProducts}</span>
            )}
          </button>
          {categories === null
            ? Array.from({ length: 3 }, (_, i) => <div key={i} className="h-11 w-32 shrink-0 animate-pulse rounded-full bg-surface-container-high" />)
            : categories.map((c) => (
                <button
                  key={c.name}
                  className={chip(category === c.name)}
                  aria-pressed={category === c.name}
                  onClick={() => updateParams({ category: category === c.name ? '' : c.name })}
                >
                  {c.name}
                  <span className={`tabular rounded-full px-1.5 text-label-sm ${category === c.name ? 'bg-white/20' : 'bg-surface-container'}`}>
                    {c.count}
                  </span>
                </button>
              ))}
        </div>
      </section>

      {/* Search, price and sort */}
      <section id="catalog" className="container-page mb-8 scroll-mt-24">
        <div className="card flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-secondary" />
              <label htmlFor="catalog-search" className="sr-only">
                Search products
              </label>
              <input
                id="catalog-search"
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name, description or category"
                className="field !pl-11"
              />
            </div>
            <div className="relative">
              <label htmlFor="sort" className="sr-only">
                Sort products
              </label>
              <Icon name="swap_vert" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-secondary" />
              <select
                id="sort"
                value={sort}
                onChange={(e) => updateParams({ sort: e.target.value === 'name' ? '' : e.target.value })}
                className="field cursor-pointer appearance-none !pl-10 !pr-10 text-label-md md:w-56"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    Sort: {o.label}
                  </option>
                ))}
              </select>
              <Icon name="expand_more" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[18px] text-secondary" />
            </div>
          </div>

          <form
            className="flex flex-wrap items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              applyPrice(priceInput.min, priceInput.max);
            }}
          >
            <span className="mr-1 text-label-md text-secondary">Price</span>
            {PRICE_PRESETS.map((p) => {
              const active = minPrice === p.min && maxPrice === p.max;
              return (
                <button
                  key={p.label}
                  type="button"
                  aria-pressed={active}
                  onClick={() => applyPrice(active ? '' : p.min, active ? '' : p.max)}
                  className={`rounded-full border px-3 py-1.5 text-label-sm ${active ? 'border-primary bg-primary-fixed text-primary' : 'border-[#e2e8f0] hover:bg-surface-container-low'}`}
                >
                  {p.label}
                </button>
              );
            })}
            <div className="flex items-center gap-2">
              <input
                aria-label="Minimum price"
                inputMode="decimal"
                placeholder="Min ₹"
                value={priceInput.min}
                onChange={(e) => setPriceInput((p) => ({ ...p, min: e.target.value.replace(/[^\d.]/g, '') }))}
                className="field !h-9 w-24 !px-3 text-body-sm"
              />
              <span className="text-outline">–</span>
              <input
                aria-label="Maximum price"
                inputMode="decimal"
                placeholder="Max ₹"
                value={priceInput.max}
                onChange={(e) => setPriceInput((p) => ({ ...p, max: e.target.value.replace(/[^\d.]/g, '') }))}
                className="field !h-9 w-24 !px-3 text-body-sm"
              />
              <button className="btn-secondary !min-h-9 !px-3 !py-1.5">Apply</button>
            </div>
          </form>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2.5">
          <h2 className="font-display text-headline-sm">{category || 'All products'}</h2>
          {current && !current.error && (
            <span className="text-body-sm text-secondary" aria-live="polite">
              (Showing {current.products.length} of {current.total} product{current.total === 1 ? '' : 's'})
            </span>
          )}
          {search && <FilterPill label={`“${search}”`} onRemove={() => updateParams({ search: '' })} />}
          {priceLabel && <FilterPill label={priceLabel} onRemove={() => updateParams({ minPrice: '', maxPrice: '' })} />}
          {filtersActive && (
            <button className="text-label-sm text-primary hover:underline" onClick={() => updateParams({ search: '', category: '', minPrice: '', maxPrice: '' })}>
              Clear all
            </button>
          )}
        </div>
      </section>

      {/* Product grid */}
      <section className="container-page" aria-busy={!current}>
        {!current ? (
          <ProductGridSkeleton />
        ) : current.error && current.products.length === 0 ? (
          <ErrorState message={current.error} onRetry={() => setRetry((n) => n + 1)} />
        ) : current.products.length === 0 ? (
          <EmptyState
            icon="search_off"
            title="No products found"
            message={filtersActive ? 'Try a different search, category or price range.' : 'There are no products in the catalog yet.'}
            action={filtersActive ? { label: 'Clear filters', onClick: () => updateParams({ search: '', category: '', minPrice: '', maxPrice: '' }) } : undefined}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {current.products.map((p) => (
                <ProductCard key={p.id} product={p} onQuickView={setQuickView} />
              ))}
            </div>
            {current.error && <p className="mt-6 text-center text-body-sm text-error">{current.error}</p>}
            {hasMore && (
              <div className="mt-10 flex justify-center">
                <button className="btn-secondary min-w-48" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? 'Loading…' : `Load more (${current.total - current.products.length} left)`}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <Deals />

      {quickView && <QuickView key={quickView.id} product={quickView} onClose={closeQuickView} onSelect={setQuickView} />}
    </div>
  );
}

function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-secondary-fixed py-1 pl-2.5 pr-1 text-label-sm text-on-secondary-fixed">
      {label}
      <button aria-label={`Remove filter ${label}`} onClick={onRemove} className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-on-secondary-fixed/10">
        <Icon name="close" className="text-[14px]" />
      </button>
    </span>
  );
}
