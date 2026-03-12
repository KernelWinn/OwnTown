import { pgTable, uuid, varchar, boolean, integer, timestamp } from 'drizzle-orm/pg-core'

export const banners = pgTable('banners', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 100 }).notNull(),
  subtitle: varchar('subtitle', { length: 200 }),
  imageUrl: varchar('image_url', { length: 500 }).notNull(),
  deepLink: varchar('deep_link', { length: 200 }),   // e.g. "product/abc" or "categories"
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
