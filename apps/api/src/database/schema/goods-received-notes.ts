import { pgTable, uuid, varchar, integer, timestamp, jsonb, text } from 'drizzle-orm/pg-core'
import { purchaseOrders } from './purchase-orders'
import { adminUsers } from './admin-users'

export const goodsReceivedNotes = pgTable('goods_received_notes', {
  id:              uuid('id').primaryKey().defaultRandom(),
  grnNumber:       varchar('grn_number', { length: 30 }).notNull().unique(),
  purchaseOrderId: uuid('purchase_order_id').notNull()
                     .references(() => purchaseOrders.id),
  receivedBy:      uuid('received_by').references(() => adminUsers.id),
  lineItems:       jsonb('line_items').notNull(),
  invoiceNumber:   varchar('invoice_number', { length: 100 }),
  invoiceDate:     timestamp('invoice_date'),
  totalReceived:   integer('total_received').notNull(),
  notes:           text('notes'),
  createdAt:       timestamp('created_at').notNull().defaultNow(),
})
