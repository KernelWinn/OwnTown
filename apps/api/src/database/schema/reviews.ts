import { pgTable, uuid, integer, varchar, boolean, timestamp, unique } from 'drizzle-orm/pg-core'
import { users } from './users'
import { orders } from './orders'
import { products } from './products'

export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  orderId: uuid('order_id').notNull().references(() => orders.id),
  productId: uuid('product_id').notNull().references(() => products.id),
  rating: integer('rating').notNull(),         // 1–5
  comment: varchar('comment', { length: 1000 }),
  isApproved: boolean('is_approved').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, t => ({
  oneReviewPerOrderProduct: unique().on(t.orderId, t.productId),
}))
