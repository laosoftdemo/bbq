-- ============================================================
-- Sindat (ຊິ້ນດາດ) BBQ Table Ordering System
-- Initial Schema Migration
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES (physical restaurant tables)
-- ============================================================
CREATE TABLE tables (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_number    TEXT NOT NULL UNIQUE,
  status          TEXT NOT NULL DEFAULT 'vacant' CHECK (status IN ('vacant', 'active')),
  current_session_id UUID,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE categories (
  id            SERIAL PRIMARY KEY,
  name_lo       TEXT NOT NULL,
  name_en       TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  icon          TEXT -- emoji or icon name
);

-- ============================================================
-- MENU ITEMS
-- ============================================================
CREATE TABLE menu_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id     INT REFERENCES categories(id) ON DELETE SET NULL,
  name_lo         TEXT NOT NULL,
  name_en         TEXT NOT NULL,
  description_lo  TEXT,
  description_en  TEXT,
  price           NUMERIC(10, 2) NOT NULL DEFAULT 0,
  image_url       TEXT,
  is_available    BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE orders (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_id    UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  session_id  UUID NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'served', 'cancelled')),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE order_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id      UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id  UUID NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
  quantity      INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_orders_table_id ON orders(table_id);
CREATE INDEX idx_orders_session_id ON orders(session_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_menu_items_category ON menu_items(category_id);
CREATE INDEX idx_menu_items_available ON menu_items(is_available);

-- ============================================================
-- AUTO-UPDATE updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Public read access for menu browsing (anon users scanning QR)
CREATE POLICY "Public read tables" ON tables FOR SELECT USING (true);
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read menu_items" ON menu_items FOR SELECT USING (is_available = true);

-- Customers can insert orders
CREATE POLICY "Public insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert order_items" ON order_items FOR INSERT WITH CHECK (true);

-- Customers can read their session orders
CREATE POLICY "Public read orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Public read order_items" ON order_items FOR SELECT USING (true);

-- Staff can update order status (use service role key on server-side)
CREATE POLICY "Public update orders" ON orders FOR UPDATE USING (true);

-- Update table status
CREATE POLICY "Public update tables" ON tables FOR UPDATE USING (true);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Tables (seats 1-10)
INSERT INTO tables (table_number, status) VALUES
  ('1', 'vacant'), ('2', 'vacant'), ('3', 'vacant'),
  ('4', 'vacant'), ('5', 'vacant'), ('6', 'vacant'),
  ('7', 'vacant'), ('8', 'vacant'), ('9', 'vacant'),
  ('10', 'vacant');

-- Categories
INSERT INTO categories (name_lo, name_en, display_order, icon) VALUES
  ('ຊີ້ນ', 'Meats', 1, '🥩'),
  ('ຜັກ', 'Vegetables', 2, '🥦'),
  ('ນ້ຳຈິ້ມ', 'Dipping Sauces', 3, '🫙'),
  ('ເຄື່ອງດື່ມ', 'Drinks', 4, '🥤'),
  ('ແກງ / ນ້ຳແກງ', 'Soup & Refills', 5, '🍲');

-- Menu Items — Meats (category 1)
INSERT INTO menu_items (category_id, name_lo, name_en, description_lo, description_en, price, image_url) VALUES
  (1, 'ຊີ້ນໝູ (ສາມຊັ້ນ)', 'Pork Belly', 'ຊີ້ນໝູສາມຊັ້ນ ສົດໆ', 'Fresh sliced pork belly', 45000, NULL),
  (1, 'ຊີ້ນໝູ (ຄໍ)', 'Pork Collar', 'ຊີ້ນຄໍໝູ ນຸ່ມ ແລະ ມັນ', 'Tender marinated pork collar', 45000, NULL),
  (1, 'ຊີ້ນງົວ (ຫມັກ)', 'Marinated Beef', 'ຊີ້ນງົວຫມັກຊອດພິເສດ', 'Premium beef marinated in house sauce', 65000, NULL),
  (1, 'ຊີ້ນງົວ (ສົດ)', 'Fresh Beef', 'ຊີ້ນງົວສົດ ຄຸນນະພາບດີ', 'Quality fresh beef slices', 60000, NULL),
  (1, 'ກຸ້ງ', 'Prawns', 'ກຸ້ງສົດ ຂະໜາດໃຫຍ່', 'Large fresh river prawns', 75000, NULL),
  (1, 'ໄສ້ກອກລາວ', 'Lao Sausage', 'ໄສ້ກອກລາວຕ່ຳໃຫ່ຍ', 'Traditional Lao pork sausage', 40000, NULL),
  (1, 'ໄກ່ (ຫມັກ)', 'Marinated Chicken', 'ໄກ່ຫມັກຊອດ ຫວານ-ເຜັດ', 'Chicken in sweet & spicy marinade', 45000, NULL),
  (1, 'ຕັບໝູ', 'Pork Liver', 'ຕັບໝູສົດ ຫມັກ', 'Fresh marinated pork liver', 35000, NULL);

-- Vegetables (category 2)
INSERT INTO menu_items (category_id, name_lo, name_en, description_lo, description_en, price, image_url) VALUES
  (2, 'ເຫັດ (ຊຸດ)', 'Mushroom Platter', 'ເຫັດຫຼາກຫຼາຍຊະນິດ', 'Assorted fresh mushrooms', 30000, NULL),
  (2, 'ຜັກກາດຂາວ', 'Cabbage', 'ຜັກກາດຂາວສົດ', 'Fresh white cabbage', 15000, NULL),
  (2, 'ສາລີ', 'Corn', 'ສາລີຫວານ', 'Sweet corn on the cob', 20000, NULL),
  (2, 'ໝາກເຂືອ', 'Eggplant', 'ໝາກເຂືອຫຼາກຊະນິດ', 'Assorted eggplant', 20000, NULL),
  (2, 'ຜັກຮາດ', 'Morning Glory', 'ຜັກຮາດສົດ', 'Fresh morning glory', 15000, NULL),
  (2, 'ເຕົ້າຮູ້ (ຊຸດ)', 'Tofu Set', 'ເຕົ້າຮູ້ຫຼາຍຊະນິດ', 'Assorted tofu varieties', 25000, NULL);

-- Dipping Sauces (category 3)
INSERT INTO menu_items (category_id, name_lo, name_en, description_lo, description_en, price, image_url) VALUES
  (3, 'ນ້ຳຈິ້ມແຈ່ວ', 'Jeow Dipping Sauce', 'ນ້ຳຈິ້ມແຈ່ວ ລົດຊາດດັ້ງເດີມ', 'Classic Lao jeow sauce', 10000, NULL),
  (3, 'ນ້ຳຈິ້ມງາ', 'Sesame Sauce', 'ນ້ຳຈິ້ມງາ ຄີມ ແລະ ນ້ຳ', 'Creamy sesame dipping sauce', 10000, NULL),
  (3, 'ນ້ຳຈິ້ມສີ', 'Sweet Chili Sauce', 'ນ້ຳຈິ້ມສີ ຫວານ-ເຜັດ', 'Sweet chili sauce', 10000, NULL);

-- Drinks (category 4)
INSERT INTO menu_items (category_id, name_lo, name_en, description_lo, description_en, price, image_url) VALUES
  (4, 'ເບຍລາວ (ດ້ວງ)', 'BeerLao (Bottle)', 'ເບຍລາວດ້ວງ 640ml', 'BeerLao large bottle 640ml', 25000, NULL),
  (4, 'ເບຍລາວ (ກະປ໋ອງ)', 'BeerLao (Can)', 'ເບຍລາວກະປ໋ອງ 330ml', 'BeerLao can 330ml', 15000, NULL),
  (4, 'ນ້ຳດ່ຶມ', 'Water', 'ນ້ຳດ່ຶມຂວດ', 'Drinking water bottle', 5000, NULL),
  (4, 'ນ້ຳໝາກ (ຊຸດ)', 'Juice', 'ນ້ຳໝາກໄມ້ຫຼາກຊະນິດ', 'Assorted fruit juices', 15000, NULL),
  (4, 'ໂຄ້ກ / ເປບຊີ', 'Cola', 'ໂຄ້ກ ຫຼື ເປບຊີ', 'Coca-Cola or Pepsi', 10000, NULL),
  (4, 'ຊາ (ເຢັນ/ຮ້ອນ)', 'Tea (Hot/Cold)', 'ຊານົມ ຫຼື ຊາຮ້ອນ', 'Milk tea or hot tea', 12000, NULL);

-- Soup (category 5)
INSERT INTO menu_items (category_id, name_lo, name_en, description_lo, description_en, price, image_url) VALUES
  (5, 'ແກງດ່ຶມ (ຕົ້ນ)', 'Soup Pot (Initial)', 'ແກງດ່ຶມ ສຳລັບໂຕະ', 'Soup broth for the grill pot', 30000, NULL),
  (5, 'ເຕີມນ້ຳແກງ', 'Soup Refill', 'ເຕີມນ້ຳແກງເພີ່ມ', 'Soup broth refill', 15000, NULL),
  (5, 'ຂ້າວ (ໂຕ)', 'Sticky Rice', 'ຂ້າວໜຽວ 1 ໂຕ', 'One serving sticky rice', 10000, NULL);
