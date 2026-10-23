'use client';

// Who is logged in, their cart and their wishlist. All of it comes from the API;
// this only keeps the latest server response so every component shows the same numbers.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiRequestError, errorMessage } from '@/lib/api-client';
import type { Cart, Me, WishlistEntry } from '@/lib/types';
import { useToast } from './FeedbackProvider';

const COUPON_KEY = 'eastman.coupon';

type Store = {
  me: Me | null | undefined; // undefined = still checking
  cart: Cart | null;
  cartLoading: boolean;
  cartError: string | null;
  coupon: string | null;
  wishlist: WishlistEntry[];
  wishlistIds: Set<string>;
  busy: Set<string>; // product ids with a request in flight
  refreshMe: () => Promise<Me | null>;
  logout: () => Promise<void>;
  loadCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number, name?: string) => Promise<boolean>;
  setQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string, name?: string) => Promise<void>;
  saveForLater: (productId: string, name?: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string | null) => Promise<Cart | null>;
  toggleWishlist: (productId: string, name?: string) => Promise<void>;
  afterOrder: () => void;
};

const StoreContext = createContext<Store | null>(null);

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside <StoreProvider>.');
  return store;
}

function readCoupon() {
  try {
    return sessionStorage.getItem(COUPON_KEY);
  } catch {
    return null;
  }
}
function writeCoupon(code: string | null) {
  try {
    if (code) sessionStorage.setItem(COUPON_KEY, code);
    else sessionStorage.removeItem(COUPON_KEY);
  } catch {
    // storage blocked: the coupon just won't survive a reload
  }
}

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const toast = useToast();
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const [cart, setCartState] = useState<Cart | null>(null);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  // Read during the first render; nothing shows the coupon until the cart has loaded, so server and browser HTML match.
  const [coupon, setCouponState] = useState<string | null>(readCoupon);
  const [wishlist, setWishlist] = useState<WishlistEntry[]>([]);
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const couponRef = useRef<string | null>(coupon);
  const cartSeq = useRef(0); // only the newest cart response is shown, even if replies arrive out of order

  const setCoupon = useCallback((code: string | null) => {
    couponRef.current = code;
    setCouponState(code);
    writeCoupon(code);
  }, []);

  // Runs a cart request and keeps its result if it's still the newest.
  const cartRequest = useCallback(async (run: () => Promise<Cart>) => {
    const seq = ++cartSeq.current;
    const next = await run();
    if (seq === cartSeq.current) {
      setCartState(next);
      setCartError(null);
    }
    return next;
  }, []);

  const withBusy = useCallback(async <T,>(id: string, run: () => Promise<T>) => {
    setBusy((s) => new Set(s).add(id));
    try {
      return await run();
    } finally {
      setBusy((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
    }
  }, []);

  const resetUserData = useCallback(() => {
    cartSeq.current++;
    setCartState(null);
    setWishlist([]);
  }, []);

  const loadCart = useCallback(async () => {
    setCartLoading(true);
    try {
      await cartRequest(() => api.cart(couponRef.current));
    } catch (err) {
      setCartError(errorMessage(err));
    } finally {
      setCartLoading(false);
    }
  }, [cartRequest]);

  const loadWishlist = useCallback(async () => {
    try {
      setWishlist(await api.wishlist());
    } catch (err) {
      // e.g. the wishlist table hasn't been created yet (supabase/002_storefront.sql)
      console.warn('Wishlist unavailable:', errorMessage(err));
    }
  }, []);

  const refreshMe = useCallback(async () => {
    try {
      const user = await api.me();
      setMe(user);
      return user;
    } catch (err) {
      if (!(err instanceof ApiRequestError && err.status === 401)) console.warn(errorMessage(err));
      setMe(null);
      resetUserData();
      return null;
    }
  }, [resetUserData]);

  // On first load, find out who is logged in.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loads data from the API; state updates after the request
    refreshMe();
  }, [refreshMe]);

  // Whenever someone logs in, load their cart and wishlist.
  useEffect(() => {
    if (!me) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loads data from the API; state updates after the requests
    loadCart();
    loadWishlist();
  }, [me, loadCart, loadWishlist]);

  // Cart and wishlist need an account. Sends guests to the login page and reports false.
  const requireLogin = useCallback(
    (action: string) => {
      if (me) return true;
      toast('info', `Please log in to ${action}.`);
      router.push(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return false;
    },
    [me, router, toast],
  );

  const logout = useCallback(async () => {
    try {
      await api.logout();
      setMe(null);
      resetUserData();
      setCoupon(null);
      toast('success', 'You have been logged out.');
      router.push('/');
    } catch (err) {
      toast('error', errorMessage(err));
    }
  }, [resetUserData, router, setCoupon, toast]);

  const addToCart = useCallback(
    async (productId: string, quantity = 1, name?: string) => {
      if (!requireLogin('add items to your cart')) return false;
      return withBusy(productId, async () => {
        try {
          await cartRequest(() => api.addToCart(productId, quantity, couponRef.current));
          toast('success', `${name ?? 'Item'} added to your cart.`);
          return true;
        } catch (err) {
          toast('error', errorMessage(err));
          return false;
        }
      });
    },
    [cartRequest, requireLogin, toast, withBusy],
  );

  const setQuantity = useCallback(
    async (productId: string, quantity: number) => {
      await withBusy(productId, async () => {
        try {
          await cartRequest(() => api.setQuantity(productId, quantity, couponRef.current));
        } catch (err) {
          toast('error', errorMessage(err));
        }
      });
    },
    [cartRequest, toast, withBusy],
  );

  const removeFromCart = useCallback(
    async (productId: string, name?: string) => {
      await withBusy(productId, async () => {
        try {
          await cartRequest(() => api.removeFromCart(productId, couponRef.current));
          toast('success', `${name ?? 'Item'} removed from your cart.`);
        } catch (err) {
          toast('error', errorMessage(err));
        }
      });
    },
    [cartRequest, toast, withBusy],
  );

  const saveForLater = useCallback(
    async (productId: string, name?: string) => {
      await withBusy(productId, async () => {
        try {
          await cartRequest(() => api.saveForLater(productId, couponRef.current));
          toast('success', `${name ?? 'Item'} moved to your wishlist.`);
          await loadWishlist();
        } catch (err) {
          toast('error', errorMessage(err));
        }
      });
    },
    [cartRequest, loadWishlist, toast, withBusy],
  );

  const clearCart = useCallback(async () => {
    try {
      await cartRequest(() => api.clearCart());
      setCoupon(null);
      toast('success', 'Your cart is now empty.');
    } catch (err) {
      toast('error', errorMessage(err));
    }
  }, [cartRequest, setCoupon, toast]);

  // Applies (or with null, removes) a coupon. The server decides whether it's valid.
  const applyCoupon = useCallback(
    async (code: string | null) => {
      const clean = code?.trim().toUpperCase() || null;
      try {
        const next = await cartRequest(() => api.cart(clean));
        if (clean && next.couponError) {
          setCoupon(null);
          return next;
        }
        setCoupon(clean);
        return next;
      } catch (err) {
        toast('error', errorMessage(err));
        return null;
      }
    },
    [cartRequest, setCoupon, toast],
  );

  const wishlistIds = useMemo(
    () => new Set(wishlist.map((w) => w.product?.id).filter((id): id is string => Boolean(id))),
    [wishlist],
  );

  const toggleWishlist = useCallback(
    async (productId: string, name?: string) => {
      if (!requireLogin('save items to your wishlist')) return;
      const saved = wishlistIds.has(productId);
      await withBusy(`wish:${productId}`, async () => {
        try {
          setWishlist(saved ? await api.removeFromWishlist(productId) : await api.addToWishlist(productId));
          toast('success', `${name ?? 'Item'} ${saved ? 'removed from' : 'saved to'} your wishlist.`);
        } catch (err) {
          toast('error', errorMessage(err));
        }
      });
    },
    [requireLogin, toast, wishlistIds, withBusy],
  );

  // After checkout the server empties the cart and may have used the coupon.
  const afterOrder = useCallback(() => {
    setCoupon(null);
    loadCart();
  }, [loadCart, setCoupon]);

  const value: Store = {
    me,
    cart,
    cartLoading,
    cartError,
    coupon,
    wishlist,
    wishlistIds,
    busy,
    refreshMe,
    logout,
    loadCart,
    addToCart,
    setQuantity,
    removeFromCart,
    saveForLater,
    clearCart,
    applyCoupon,
    toggleWishlist,
    afterOrder,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
