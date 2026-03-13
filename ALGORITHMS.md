# OwnTown — Algorithm Reference

A living document recording the key algorithms and ranking systems used across the platform.

---

## 1. Product Search Ranking

**Location:** `apps/api/src/products/products.service.ts` → `search()`

### Overview

Products are ranked using a composite score built from six independent signals. The score is computed entirely in PostgreSQL via CTEs so no application-side sorting is needed.

### Scoring Formula

```
_score =
    text_score   × 10.0   (full-text relevance on name + description + tags)
  + prefix_boost ×  5.0   (name starts with the query string)
  + popularity   ×  3.0   (global order-count signal, capped)
  + behavior     ×  4.0   (per-user behavioral history, capped)
  + featured     ×  2.0   (editorial boost)
  + in_stock     ×  1.5   (stock > low-stock threshold)
  + discount     ×  1.0   (MRP > selling price)
```

### Signals in Detail

| Signal | Weight | Cap | Source |
|--------|--------|-----|--------|
| `text_score` | ×10 | — | `ts_rank()` on `to_tsvector(name \|\| description \|\| tags)` |
| `prefix_boost` | +5 | — | `name ILIKE 'query%'` (exact prefix, boolean) |
| `popularity` | ×0.1 | 3.0 | `COUNT(order_items)` per product (global) |
| `behavior` | ×0.5 | 4.0 | Weighted sum of user's past events (personal) |
| `featured` | +2 | — | `is_featured = true` (editorial flag) |
| `in_stock` | +1.5 | — | `stock_quantity > low_stock_threshold` |
| `discount` | +1 | — | `mrp > price` |

### Behavioral Event Weights

Events are stored in the `search_events` table and contribute to the `behavior` signal:

| Event | Weight |
|-------|--------|
| `purchase` | 4 |
| `add_to_cart` | 2 |
| `search_click` | 1 |

Behavioral score is user-scoped — only events from the authenticated user are counted. Anonymous users receive no behavioral boost.

### SQL (simplified)

```sql
WITH
  text_rank AS (
    SELECT id,
      ts_rank(
        to_tsvector('english', name || ' ' || COALESCE(description,'') || ' ' || array_to_string(tags,' ')),
        plainto_tsquery('english', :query)
      ) AS rank
    FROM products WHERE is_active = true
  ),
  popularity AS (
    SELECT product_id, COUNT(*)::float AS order_count
    FROM order_items GROUP BY product_id
  ),
  behavior AS (
    SELECT product_id,
      SUM(CASE event_type
        WHEN 'purchase'    THEN 4
        WHEN 'add_to_cart' THEN 2
        WHEN 'search_click'THEN 1
        ELSE 0 END)::float AS score
    FROM search_events
    WHERE user_id = :userId
    GROUP BY product_id
  )
SELECT p.*,
  (
    COALESCE(tr.rank, 0) * 10.0
    + CASE WHEN p.name ILIKE :query||'%' THEN 5.0 ELSE 0 END
    + LEAST(COALESCE(pop.order_count, 0) * 0.1, 3.0)
    + LEAST(COALESCE(beh.score,       0) * 0.5, 4.0)
    + CASE WHEN p.is_featured             THEN 2.0 ELSE 0 END
    + CASE WHEN p.stock_quantity > p.low_stock_threshold THEN 1.5 ELSE 0 END
    + CASE WHEN p.mrp > p.price           THEN 1.0 ELSE 0 END
  ) AS _score
FROM products p
LEFT JOIN text_rank  tr  ON tr.id           = p.id
LEFT JOIN popularity pop ON pop.product_id  = p.id
LEFT JOIN behavior   beh ON beh.product_id  = p.id
WHERE p.is_active = true
  AND (tr.rank > 0 OR p.name ILIKE '%'||:query||'%')
ORDER BY _score DESC
LIMIT 40;
```

### Event Tracking

Events are recorded from the web/mobile clients and stored in `search_events`:

```
Table: search_events
  id          UUID PK
  user_id     UUID → users(id)   (nullable for anonymous)
  product_id  UUID → products(id)
  event_type  ENUM('search_click', 'add_to_cart', 'purchase')
  query       TEXT               (the search term, if applicable)
  created_at  TIMESTAMP
```

**Client-side recording:**

- `search_click` — fired when a user clicks a product in search results
- `add_to_cart` — fired when a product is added to the cart (hook into cart store)
- `purchase` — fired from the order completion flow

**API endpoint:** `POST /products/search-event` (JWT-authenticated)

### Design Decisions

- **Caps on popularity and behavior** prevent a single runaway bestseller from drowning out relevant new products.
- **Text score weight (×10) dominates** intentionally — relevance first, signals second.
- **Prefix boost (+5)** ensures "tom" surfaces "Tomato" at the top even if the text rank is moderate.
- **`_score` is stripped** from the API response before returning to clients.
- **No background job needed** — all signals are computed live from existing tables; acceptable for catalogs up to ~10k products.

---

*Add new algorithms below as they are introduced.*
