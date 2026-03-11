import {
  pgTable, uuid, varchar, integer, timestamp, jsonb, pgEnum
} from 'drizzle-orm/pg-core'
import { users } from './users'
import { deliverySlots } from './delivery-slots'

export const orderStatusEnum = pgEnum('order_status', [
  'pending', 'payment_failed', 'confirmed', 'packed',
  'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned',
])

export const paymentMethodEnum = pgEnum('payment_method', [
  'upi', 'card', 'wallet', 'netbanking', 'cod',
])

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending', 'paid', 'failed', 'refunded',
])

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderNumber: varchar('order_number', { length: 30 }).notNull().unique(),
  userId: uuid('user_id').notNull().references(() => users.id),
  deliverySlotId: uuid('delivery_slot_id').references(() => deliverySlots.id),
  // Snapshot of delivery address at time of order
  address: jsonb('address').notNull(),
  status: orderStatusEnum('status').notNull().default('pending'),
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  paymentStatus: paymentStatusEnum('payment_status').notNull().default('pending'),
  razorpayOrderId: varchar('razorpay_order_id', { length: 100 }),
  razorpayPaymentId: varchar('razorpay_payment_id', { length: 100 }),
  subtotal: integer('subtotal').notNull(),        // paise
  deliveryFee: integer('delivery_fee').notNull().default(0),
  totalGst: integer('total_gst').notNull().default(0),
  discount: integer('discount').notNull().default(0),
  total: integer('total').notNull(),              // paise
  notes: varchar('notes', { length: 500 }),
  awbNumber: varchar('awb_number', { length: 100 }),
  trackingUrl: varchar('tracking_url', { length: 500 }),
  estimatedDelivery: timestamp('estimated_delivery'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
