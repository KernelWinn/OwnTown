-- Search event type enum
DO $$ BEGIN
  CREATE TYPE search_event_type AS ENUM ('search_click', 'add_to_cart', 'purchase');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Search events table for behavioral ranking
CREATE TABLE IF NOT EXISTS search_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  event_type  search_event_type NOT NULL,
  query       TEXT,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for efficient ranking queries
CREATE INDEX IF NOT EXISTS idx_search_events_user_product
  ON search_events (user_id, product_id);

CREATE INDEX IF NOT EXISTS idx_search_events_product
  ON search_events (product_id);

CREATE INDEX IF NOT EXISTS idx_search_events_created
  ON search_events (created_at);
