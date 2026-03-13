import { pgTable, uuid, varchar, integer, timestamp, pgEnum, text } from 'drizzle-orm/pg-core'
import { suppliers } from './suppliers'
import { adminUsers } from './admin-users'

export const poStatusEnum = pgEnum('po_status', [
  'draft',
  'sent',
  'confirmed',
  'partial',
  'received',
  'cancelled',
])

export const purchaseOrders = pgTable('purchase_orders', {
  id:           uuid('id').primaryKey().defaultRandom(),
  poNumber:     varchar('po_number', { length: 30 }).notNull().unique(),
  supplierId:   uuid('supplier_id').notNull().references(() => suppliers.id),
  createdBy:    uuid('created_by').references(() => adminUsers.id),
  status:       poStatusEnum('status').notNull().default('draft'),
  expectedDate: timestamp('expected_date'),
  subtotal:     integer('subtotal').notNull().default(0),
  totalGst:     integer('total_gst').notNull().default(0),
  total:        integer('total').notNull().default(0),
  notes:        text('notes'),
  createdAt:    timestamp('created_at').notNull().defaultNow(),
  updatedAt:    timestamp('updated_at').notNull().defaultNow(),
})
