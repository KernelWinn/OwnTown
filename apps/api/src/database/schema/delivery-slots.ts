import { pgTable, uuid, varchar, date, integer, boolean, timestamp } from 'drizzle-orm/pg-core'

export const deliverySlots = pgTable('delivery_slots', {
  id: uuid('id').primaryKey().defaultRandom(),
  date: date('date').notNull(),
  startTime: varchar('start_time', { length: 5 }).notNull(),   // "09:00"
  endTime: varchar('end_time', { length: 5 }).notNull(),       // "12:00"
  label: varchar('label', { length: 100 }).notNull(),          // "Morning (9AM–12PM)"
  maxOrders: integer('max_orders').notNull().default(50),
  currentOrders: integer('current_orders').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
