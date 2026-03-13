import {
  pgTable, uuid, varchar, integer, boolean, timestamp, jsonb,
} from 'drizzle-orm/pg-core'
import { products } from './products'

export const productVariants = pgTable('product_variants', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),             // e.g. "500g / Mango"
  options: jsonb('options').notNull().default({}),                 // { "Size": "500g", "Flavor": "Mango" }
  price: integer('price').notNull(),                               // paise
  mrp: integer('mrp').notNull(),                                   // paise
  sku: varchar('sku', { length: 100 }).notNull().unique(),
  barcode: varchar('barcode', { length: 100 }),
  stockQuantity: integer('stock_quantity').notNull().default(0),
  lowStockThreshold: integer('low_stock_threshold').notNull().default(10),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
