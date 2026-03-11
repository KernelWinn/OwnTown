-- OwnTown MVP — Initial Database Schema
-- Run with: psql $DATABASE_URL -f 0001_initial.sql

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────
CREATE TYPE gst_category AS ENUM ('exempt', 'five', 'twelve', 'eighteen');

CREATE TYPE order_status AS ENUM (
  'pending', 'payment_failed', 'confirmed', 'packed',
  'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'
);

CREATE TYPE payment_method AS ENUM ('upi', 'card', 'wallet', 'netbanking', 'cod');

CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

CREATE TYPE shipment_status AS ENUM (
  'created', 'pickup_scheduled', 'picked_up', 'in_transit',
  'out_for_delivery', 'delivered', 'delivery_failed',
  'rto_initiated', 'rto_delivered'
);

CREATE TYPE platform AS ENUM ('ios', 'android', 'web');

-- ─────────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────────
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone       VARCHAR(15) NOT NULL UNIQUE,
  email       VARCHAR(255) UNIQUE,
  name        VARCHAR(100),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_phone ON users(phone);

-- ─────────────────────────────────────────────
-- ADDRESSES
-- ─────────────────────────────────────────────
CREATE TABLE addresses (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label       VARCHAR(50) NOT NULL DEFAULT 'Home',
  name        VARCHAR(100) NOT NULL,
  phone       VARCHAR(15) NOT NULL,
  line1       VARCHAR(255) NOT NULL,
  line2       VARCHAR(255),
  landmark    VARCHAR(255),
  city        VARCHAR(100) NOT NULL,
  state       VARCHAR(100) NOT NULL,
  pincode     VARCHAR(6) NOT NULL,
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  latitude    DOUBLE PRECISION,
  longitude   DOUBLE PRECISION,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_addresses_user_id ON addresses(user_id);

-- ─────────────────────────────────────────────
-- CATEGORIES
-- ─────────────────────────────────────────────
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  image_url   VARCHAR(500),
  parent_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- PRODUCTS
-- ─────────────────────────────────────────────
CREATE TABLE products (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                VARCHAR(255) NOT NULL,
  slug                VARCHAR(255) NOT NULL UNIQUE,
  description         TEXT,
  category_id         UUID NOT NULL REFERENCES categories(id),
  images              TEXT[] NOT NULL DEFAULT '{}',
  price               INTEGER NOT NULL,           -- paise
  mrp                 INTEGER NOT NULL,           -- paise
  unit                VARCHAR(50) NOT NULL,       -- "500g", "1L"
  stock_quantity      INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 10,
  sku                 VARCHAR(100) NOT NULL UNIQUE,
  barcode             VARCHAR(100),
  gst_category        gst_category NOT NULL DEFAULT 'exempt',
  gst_rate            INTEGER NOT NULL DEFAULT 0, -- 0, 5, 12, 18
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured         BOOLEAN NOT NULL DEFAULT FALSE,
  tags                TEXT[] NOT NULL DEFAULT '{}',
  created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_name_search ON products USING GIN(to_tsvector('english', name));

-- ─────────────────────────────────────────────
-- DELIVERY SLOTS
-- ─────────────────────────────────────────────
CREATE TABLE delivery_slots (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date            DATE NOT NULL,
  start_time      VARCHAR(5) NOT NULL,  -- "09:00"
  end_time        VARCHAR(5) NOT NULL,  -- "12:00"
  label           VARCHAR(100) NOT NULL,
  max_orders      INTEGER NOT NULL DEFAULT 50,
  current_orders  INTEGER NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(date, start_time, end_time)
);

CREATE INDEX idx_delivery_slots_date ON delivery_slots(date);

-- ─────────────────────────────────────────────
-- ORDERS
-- ─────────────────────────────────────────────
CREATE TABLE orders (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number         VARCHAR(30) NOT NULL UNIQUE,
  user_id              UUID NOT NULL REFERENCES users(id),
  delivery_slot_id     UUID REFERENCES delivery_slots(id),
  address              JSONB NOT NULL,             -- snapshot at order time
  status               order_status NOT NULL DEFAULT 'pending',
  payment_method       payment_method NOT NULL,
  payment_status       payment_status NOT NULL DEFAULT 'pending',
  razorpay_order_id    VARCHAR(100),
  razorpay_payment_id  VARCHAR(100),
  subtotal             INTEGER NOT NULL,           -- paise
  delivery_fee         INTEGER NOT NULL DEFAULT 0, -- paise
  total_gst            INTEGER NOT NULL DEFAULT 0, -- paise
  discount             INTEGER NOT NULL DEFAULT 0, -- paise
  total                INTEGER NOT NULL,           -- paise
  notes                VARCHAR(500),
  awb_number           VARCHAR(100),
  tracking_url         VARCHAR(500),
  estimated_delivery   TIMESTAMP,
  created_at           TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- ─────────────────────────────────────────────
-- ORDER ITEMS
-- ─────────────────────────────────────────────
CREATE TABLE order_items (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id   UUID NOT NULL REFERENCES products(id),
  name         VARCHAR(255) NOT NULL,   -- snapshot
  unit         VARCHAR(50) NOT NULL,
  image_url    VARCHAR(500),
  price        INTEGER NOT NULL,        -- paise at order time
  mrp          INTEGER NOT NULL,
  quantity     INTEGER NOT NULL,
  total_price  INTEGER NOT NULL,        -- paise
  gst_rate     INTEGER NOT NULL DEFAULT 0,
  gst_amount   INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- ─────────────────────────────────────────────
-- SHIPMENTS
-- ─────────────────────────────────────────────
CREATE TABLE shipments (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id                 UUID NOT NULL UNIQUE REFERENCES orders(id),
  shiprocket_shipment_id   VARCHAR(100),
  shiprocket_order_id      VARCHAR(100),
  awb_number               VARCHAR(100),
  courier_name             VARCHAR(100),
  tracking_url             VARCHAR(500),
  label_url                VARCHAR(500),
  status                   shipment_status NOT NULL DEFAULT 'created',
  estimated_delivery       TIMESTAMP,
  created_at               TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shipments_awb_number ON shipments(awb_number);

-- ─────────────────────────────────────────────
-- ADMIN USERS
-- ─────────────────────────────────────────────
CREATE TABLE admin_users (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email          VARCHAR(255) NOT NULL UNIQUE,
  name           VARCHAR(100) NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- FCM TOKENS (Push Notifications)
-- ─────────────────────────────────────────────
CREATE TABLE fcm_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       VARCHAR(500) NOT NULL,
  platform    platform NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, token)
);

CREATE INDEX idx_fcm_tokens_user_id ON fcm_tokens(user_id);

-- ─────────────────────────────────────────────
-- UPDATED_AT TRIGGER (auto-update timestamp)
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_addresses_updated_at BEFORE UPDATE ON addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_shipments_updated_at BEFORE UPDATE ON shipments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_fcm_tokens_updated_at BEFORE UPDATE ON fcm_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at();
