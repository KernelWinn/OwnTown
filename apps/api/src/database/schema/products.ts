import {
  pgTable, uuid, varchar, text, integer, boolean,
  timestamp, pgEnum
} from 'drizzle-orm/pg-core'
import { categories } from './categories'

export const gstCategoryEnum = pgEnum('gst_category', ['exempt', 'five', 'twelve', 'eighteen'])

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  categoryId: uuid('category_id').notNull().references(() => categories.id),
  images: text('images').array().notNull().default([]),    // S3 URLs
  price: integer('price').notNull(),                        // paise
  mrp: integer('mrp').notNull(),                            // paise
  unit: varchar('unit', { length: 50 }).notNull(),          // "500g", "1L"
  stockQuantity: integer('stock_quantity').notNull().default(0),
  lowStockThreshold: integer('low_stock_threshold').notNull().default(10),
  sku: varchar('sku', { length: 100 }).notNull().unique(),
  barcode: varchar('barcode', { length: 100 }),
  gstCategory: gstCategoryEnum('gst_category').notNull().default('exempt'),
  gstRate: integer('gst_rate').notNull().default(0),        // 0, 5, 12, 18
  isActive: boolean('is_active').notNull().default(true),
  isFeatured: boolean('is_featured').notNull().default(false),
  costPrice: integer('cost_price').notNull().default(0),            // latest purchase cost in paise (updated by GRN)
  tags: text('tags').array().notNull().default([]),
  optionNames: text('option_names').array().notNull().default([]),  // e.g. ["Size", "Flavor"]
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
