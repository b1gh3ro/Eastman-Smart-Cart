import Link from 'next/link';
import NewsletterForm from '@/components/NewsletterForm';
import Logo from './Logo';

const LINKS = [
  {
    title: 'Shop',
    items: [
      ['/', 'Product catalog'],
      ['/#featured', 'Featured'],
      ['/#deals', 'Deals & coupons'],
    ],
  },
  {
    title: 'Your account',
    items: [
      ['/cart', 'Shopping cart'],
      ['/wishlist', 'Wishlist'],
      ['/orders', 'Order history'],
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-[#e2e8f0] bg-white">
      <div className="container-page grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1.5fr]">
        <div>
          <div className="flex items-center gap-3">
            <Logo className="h-8 w-8" />
            <span className="font-display text-title">Eastman Smart Cart</span>
          </div>
          <p className="mt-4 max-w-sm text-body-md text-on-surface-variant">
            Campus retail made quick: browse, fill your cart, apply a coupon and check out in a few taps.
          </p>
        </div>
        {LINKS.map((group) => (
          <div key={group.title}>
            <h2 className="font-display text-title">{group.title}</h2>
            <ul className="mt-4 space-y-3">
              {group.items.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="text-body-md text-on-surface-variant hover:text-primary">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <h2 className="font-display text-title">Stay connected</h2>
          <p className="mt-4 text-body-sm text-on-surface-variant">Get flash discount codes and student deals in your inbox.</p>
          <NewsletterForm />
        </div>
      </div>
      <div className="container-page flex flex-col gap-2 border-t border-[#f1f5f9] py-6 text-body-sm text-outline sm:flex-row sm:justify-between">
        <span>© {2026} Eastman Smart Cart. All rights reserved.</span>
        <span>Prices in INR, taxes included.</span>
      </div>
    </footer>
  );
}
