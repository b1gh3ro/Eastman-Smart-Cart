// Shapes of the JSON the API sends back (see src/app/api).

export type Product = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  image_url: string | null;
  stock: number;
  is_active: boolean;
  is_featured?: boolean;
};

export type Category = { name: string; count: number };

export type CartLine = {
  quantity: number;
  lineTotal: number;
  issue: string | null;
  product: Pick<Product, 'id' | 'name' | 'category' | 'price' | 'image_url' | 'stock' | 'is_active'>;
};

export type Cart = {
  items: CartLine[];
  itemCount: number;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  taxIncluded: boolean;
  total: number;
  coupon: string | null;
  couponError: string | null;
  canCheckout: boolean;
};

export type WishlistEntry = { added_at: string; product: Product | null };

export type Coupon = { code: string; description: string | null; min_order: number };

export type Me = { id: string; email: string; name: string };

export type OrderItem = { product_id: string; name: string; price: number; quantity: number };

export type Order = {
  id: number;
  customer_name: string;
  email: string;
  address: string;
  coupon_code: string | null;
  subtotal: number;
  discount: number;
  total: number;
  created_at: string;
  order_items?: OrderItem[];
};

export type ProductQuery = {
  search?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  page?: number;
  limit?: number;
  featured?: boolean;
};
