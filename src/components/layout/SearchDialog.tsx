'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import ProductImage from '@/components/product/ProductImage';
import Icon from '@/components/ui/Icon';
import { api, errorMessage } from '@/lib/api-client';
import { formatPrice } from '@/lib/format';
import type { Product } from '@/lib/types';

type Results = { query: string; products: Product[]; total: number; error: string | null };

// Search box with live results from GET /api/products?search=. Enter shows all matches on the shop page.
export default function SearchDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Results | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const term = query.trim();

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Waits for a short pause in typing, then searches.
  useEffect(() => {
    if (!term) return;
    let live = true;
    const timer = setTimeout(() => {
      api
        .products({ search: term, limit: 6 })
        .then(({ products, total }) => live && setResults({ query: term, products, total, error: null }))
        .catch((err) => live && setResults({ query: term, products: [], total: 0, error: errorMessage(err) }));
    }, 250);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [term]);

  const loading = Boolean(term) && results?.query !== term;
  const current = term && results?.query === term ? results : null;

  const showAll = () => {
    if (!term) return;
    router.push(`/?search=${encodeURIComponent(term)}#catalog`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[85] flex items-start justify-center bg-on-surface/40 p-4 pt-[10vh] backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search products"
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-[#e2e8f0] bg-surface-container-lowest shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <form
          className="flex items-center gap-3 border-b border-[#e2e8f0] px-4"
          onSubmit={(e) => {
            e.preventDefault();
            showAll();
          }}
        >
          <Icon name="search" className="text-secondary" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, descriptions, categories…"
            aria-label="Search products"
            className="h-14 flex-1 bg-transparent text-body-md outline-none"
          />
          <kbd className="rounded-md bg-surface-container px-1.5 py-0.5 text-label-sm text-secondary">Esc</kbd>
        </form>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {!term && <p className="px-3 py-6 text-center text-body-sm text-outline">Start typing to search the catalog.</p>}
          {loading && <p className="px-3 py-6 text-center text-body-sm text-outline">Searching…</p>}
          {current?.error && <p className="px-3 py-6 text-center text-body-sm text-error">{current.error}</p>}
          {current && !current.error && current.products.length === 0 && (
            <p className="px-3 py-6 text-center text-body-sm text-outline">No products match “{term}”.</p>
          )}
          {current?.products.map((p) => (
            <Link
              key={p.id}
              href={`/products/${p.id}`}
              onClick={onClose}
              className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-surface-container-low"
            >
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#f8fafc]">
                <ProductImage src={p.image_url} alt="" category={p.category} iconSize="text-[22px]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-label-md">{p.name}</div>
                <div className="text-body-sm text-secondary">{p.category}</div>
              </div>
              <span className="tabular text-label-md">{formatPrice(p.price)}</span>
            </Link>
          ))}
          {current && current.total > current.products.length && (
            <button className="w-full rounded-xl px-3 py-3 text-label-md text-primary hover:bg-surface-container-low" onClick={showAll}>
              See all {current.total} results
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
