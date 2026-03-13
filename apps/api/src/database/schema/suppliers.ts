import { pgTable, uuid, varchar, boolean, timestamp } from 'drizzle-orm/pg-core'

export const suppliers = pgTable('suppliers', {
  id:           uuid('id').primaryKey().defaultRandom(),
  name:         varchar('name', { length: 255 }).notNull(),
  contactName:  varchar('contact_name', { length: 100 }),
  phone:        varchar('phone', { length: 20 }),
  email:        varchar('email', { length: 255 }),
  address:      varchar('address', { length: 500 }),
  gstNumber:    varchar('gst_number', { length: 20 }),
  paymentTerms: varchar('payment_terms', { length: 100 }),
  notes:        varchar('notes', { length: 500 }),
  isActive:     boolean('is_active').notNull().default(true),
  createdAt:    timestamp('created_at').notNull().defaultNow(),
  updatedAt:    timestamp('updated_at').notNull().defaultNow(),
})
