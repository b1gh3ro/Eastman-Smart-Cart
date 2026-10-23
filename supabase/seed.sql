-- Sample data to try the store with.

insert into products (name, description, category, price, stock) values
  ('Ceramic Coffee Mug', '350 ml, dishwasher safe', 'Kitchen', 299, 40),
  ('Steel Water Bottle', '1 litre, keeps drinks cold for 24 hours', 'Kitchen', 549, 25),
  ('Cotton T-Shirt', 'Plain crew neck, 100% cotton', 'Clothing', 399, 60),
  ('Denim Jacket', 'Classic blue, regular fit', 'Clothing', 1999, 10),
  ('Wireless Earbuds', 'Bluetooth 5.3, 20 hour battery', 'Electronics', 1499, 15),
  ('Smart Watch', 'Heart rate, steps and sleep tracking', 'Electronics', 2999, 8);

insert into coupons (code, description, discount_type, discount_value, max_discount, min_order) values
  ('SAVE10', '10% off, up to ₹200', 'PERCENT', 10, 200, 0),
  ('FLAT100', '₹100 off orders above ₹999', 'FLAT', 100, null, 999);
