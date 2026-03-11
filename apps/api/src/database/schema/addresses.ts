import { pgTable, uuid, varchar, boolean, timestamp, doublePrecision } from 'drizzle-orm/pg-core'
import { users } from './users'

export const addresses = pgTable('addresses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  label: varchar('label', { length: 50 }).notNull().default('Home'),
  name: varchar('name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 15 }).notNull(),
  line1: varchar('line1', { length: 255 }).notNull(),
  line2: varchar('line2', { length: 255 }),
  landmark: varchar('landmark', { length: 255 }),
  city: varchar('city', { length: 100 }).notNull(),
  state: varchar('state', { length: 100 }).notNull(),
  pincode: varchar('pincode', { length: 6 }).notNull(),
  isDefault: boolean('is_default').notNull().default(false),
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
