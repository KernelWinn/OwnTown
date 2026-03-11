import { pgTable, uuid, varchar, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { users } from './users'

export const platformEnum = pgEnum('platform', ['ios', 'android', 'web'])

export const fcmTokens = pgTable('fcm_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 500 }).notNull(),
  platform: platformEnum('platform').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
