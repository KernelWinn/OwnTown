import { pgTable, uuid, varchar, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { orders } from './orders'

export const shipmentStatusEnum = pgEnum('shipment_status', [
  'created', 'pickup_scheduled', 'picked_up', 'in_transit',
  'out_for_delivery', 'delivered', 'delivery_failed',
  'rto_initiated', 'rto_delivered',
])

export const shipments = pgTable('shipments', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id).unique(),
  shiprocketShipmentId: varchar('shiprocket_shipment_id', { length: 100 }),
  shiprocketOrderId: varchar('shiprocket_order_id', { length: 100 }),
  awbNumber: varchar('awb_number', { length: 100 }),
  courierName: varchar('courier_name', { length: 100 }),
  trackingUrl: varchar('tracking_url', { length: 500 }),
  labelUrl: varchar('label_url', { length: 500 }),
  status: shipmentStatusEnum('status').notNull().default('created'),
  estimatedDelivery: timestamp('estimated_delivery'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
