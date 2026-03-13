-- Migration: Product Variants
-- Run with: psql $DATABASE_URL -f 0002_product_variants.sql

-- Add option_names column to products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS option_names text[] NOT NULL DEFAULT '{}';

-- Create product_variants table
CREATE TABLE IF NOT EXISTS product_variants (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  title           varchar(255) NOT NULL,
  options         jsonb NOT NULL DEFAULT '{}',
  price           integer NOT NULL,
  mrp             integer NOT NULL,
  sku             varchar(100) NOT NULL UNIQUE,
  barcode         varchar(100),
  stock_quantity  integer NOT NULL DEFAULT 0,
  low_stock_threshold integer NOT NULL DEFAULT 10,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamp NOT NULL DEFAULT now(),
  updated_at      timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
