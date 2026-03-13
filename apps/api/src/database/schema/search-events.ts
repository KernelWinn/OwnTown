import { pgTable, uuid, varchar, text, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { products } from './products'
import { users } from './users'

export const searchEventTypeEnum = pgEnum('search_event_type', [
  'search_click',   // user clicked a product from search results
  'add_to_cart',    // user added product to cart
  'purchase',       // user purchased product
])

export const searchEvents = pgTable('search_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  eventType: searchEventTypeEnum('event_type').notNull(),
  query: text('query'),                          // search query that led to this event
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
