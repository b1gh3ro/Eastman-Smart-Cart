'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '@/components/providers/StoreProvider';
import Icon from '@/components/ui/Icon';
import Logo from './Logo';
import SearchDialog from './SearchDialog';

const NAV = [
  { href: '/', label: 'Shop', icon: 'storefront' },
  { href: '/#featured', label: 'Featured', icon: 'auto_awesome' },
  { href: '/#deals', label: 'Deals', icon: 'sell' },
  { href: '/wishlist', label: 'Wishlist', icon: 'favorite' },
  { href: '/orders', label: 'Orders', icon: 'receipt_long' },
];

export default function Header() {
  const pathname = usePathname();
  const { me, cart, logout } = useStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const count = cart?.itemCount ?? 0;
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  // Ctrl/⌘ + K opens search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Close the account menu on outside click.
  useEffect(() => {
    if (!accountOpen) return;
    const onClick = (e: MouseEvent) => !accountRef.current?.contains(e.target as Node) && setAccountOpen(false);
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [accountOpen]);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : !href.includes('#') && pathname.startsWith(href));
  const navLink = (active: boolean) =>
    `rounded-lg px-3 py-2 text-label-md transition-all ${
      active ? 'bg-surface-container-high font-semibold text-on-surface' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
    }`;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#e2e8f0] bg-white/85 backdrop-blur-xl">
        <div className="container-page flex h-16 items-center justify-between gap-4 md:h-20">
          <div className="flex items-center gap-6">
            <button
              className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-surface-container lg:hidden"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <Icon name={menuOpen ? 'close' : 'menu'} />
            </button>
            <Link href="/" className="flex items-center gap-3" onClick={() => setMenuOpen(false)}>
              <Logo />
              <span className="hidden font-display text-title tracking-tight sm:inline">
                Eastman <span className="text-primary">Smart Cart</span>
              </span>
            </Link>
            <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} className={navLink(isActive(item.href))} aria-current={isActive(item.href) ? 'page' : undefined}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search products"
              className="flex h-11 items-center gap-2 rounded-xl px-3 text-secondary hover:bg-surface-container md:bg-surface-container-low"
            >
              <Icon name="search" />
              <span className="hidden text-body-sm md:inline">Search</span>
              <kbd className="hidden rounded-md bg-surface-container-high px-1.5 text-label-sm md:inline">⌘K</kbd>
            </button>

            <Link
              href="/cart"
              aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}
              className={`relative flex h-11 items-center gap-2 rounded-xl px-3 hover:bg-surface-container ${pathname === '/cart' ? 'bg-surface-container-high' : ''}`}
            >
              <Icon name="shopping_cart" />
              {count > 0 && (
                <span className="tabular flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-label-sm text-on-primary">
                  {count}
                </span>
              )}
            </Link>

            <div className="mx-1 hidden h-8 w-px bg-[#e2e8f0] sm:block" />

            {me === undefined ? (
              <div className="h-10 w-10 animate-pulse rounded-full bg-surface-container-high" />
            ) : me ? (
              <div className="relative" ref={accountRef}>
                <button
                  className="flex items-center gap-2 rounded-xl p-1 pr-2 hover:bg-surface-container"
                  aria-haspopup="menu"
                  aria-expanded={accountOpen}
                  onClick={() => setAccountOpen((o) => !o)}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-on-primary">
                    <Icon name="person" className="text-[20px]" />
                  </span>
                  <span className="hidden max-w-32 truncate text-left text-label-md md:block">{me.name || me.email}</span>
                  <Icon name="expand_more" className="hidden text-[18px] text-secondary md:inline-block" />
                </button>
                {accountOpen && (
                  <div role="menu" className="absolute right-0 mt-2 w-56 rounded-xl border border-[#e2e8f0] bg-white p-1.5 shadow-xl">
                    <div className="truncate px-3 py-2 text-body-sm text-secondary">{me.email}</div>
                    {[
                      ['/orders', 'receipt_long', 'My orders'],
                      ['/wishlist', 'favorite', 'Wishlist'],
                      ['/cart', 'shopping_cart', 'Cart'],
                    ].map(([href, icon, label]) => (
                      <Link
                        key={href}
                        role="menuitem"
                        href={href}
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-label-md hover:bg-surface-container-low"
                      >
                        <Icon name={icon} className="text-[18px] text-secondary" /> {label}
                      </Link>
                    ))}
                    <button
                      role="menuitem"
                      onClick={() => {
                        setAccountOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-label-md text-error hover:bg-[#fff1f2]"
                    >
                      <Icon name="logout" className="text-[18px]" /> Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="btn-primary !min-h-10 !px-4">
                <Icon name="login" className="text-[18px]" />
                <span className="hidden sm:inline">Sign in</span>
              </Link>
            )}
          </div>
        </div>

        {menuOpen && (
          <nav className="border-t border-[#e2e8f0] bg-white px-4 py-3 lg:hidden" aria-label="Mobile">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`flex min-h-11 items-center gap-3 ${navLink(isActive(item.href))}`}
              >
                <Icon name={item.icon} className="text-[20px]" /> {item.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      {searchOpen && <SearchDialog onClose={closeSearch} />}
    </>
  );
}
