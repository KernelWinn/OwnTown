import { pgTable, uuid, varchar, integer } from 'drizzle-orm/pg-core'
import { purchaseOrders } from './purchase-orders'
import { products } from './products'

export const purchaseOrderItems = pgTable('purchase_order_items', {
  id:              uuid('id').primaryKey().defaultRandom(),
  purchaseOrderId: uuid('purchase_order_id').notNull()
                     .references(() => purchaseOrders.id, { onDelete: 'cascade' }),
  productId:       uuid('product_id').notNull().references(() => products.id),
  productName:     varchar('product_name', { length: 255 }).notNull(),
  sku:             varchar('sku', { length: 100 }).notNull(),
  orderedQty:      integer('ordered_qty').notNull(),
  receivedQty:     integer('received_qty').notNull().default(0),
  unitCost:        integer('unit_cost').notNull(),
  gstRate:         integer('gst_rate').notNull().default(0),
  gstAmount:       integer('gst_amount').notNull().default(0),
  totalCost:       integer('total_cost').notNull(),
})
