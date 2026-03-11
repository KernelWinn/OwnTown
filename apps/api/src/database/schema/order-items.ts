import { pgTable, uuid, varchar, integer } from 'drizzle-orm/pg-core'
import { orders } from './orders'
import { products } from './products'

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id),
  name: varchar('name', { length: 255 }).notNull(),     // snapshot at order time
  unit: varchar('unit', { length: 50 }).notNull(),
  imageUrl: varchar('image_url', { length: 500 }),
  price: integer('price').notNull(),                     // paise at order time
  mrp: integer('mrp').notNull(),
  quantity: integer('quantity').notNull(),
  totalPrice: integer('total_price').notNull(),
  gstRate: integer('gst_rate').notNull().default(0),
  gstAmount: integer('gst_amount').notNull().default(0),
})
