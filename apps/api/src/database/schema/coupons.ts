import { pgTable, pgEnum, uuid, varchar, integer, boolean, timestamp } from 'drizzle-orm/pg-core'

export const discountTypeEnum = pgEnum('discount_type', ['percentage', 'flat'])

export const coupons = pgTable('coupons', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 30 }).notNull().unique(),
  description: varchar('description', { length: 200 }),
  discountType: discountTypeEnum('discount_type').notNull(),
  discountValue: integer('discount_value').notNull(),      // % or paise
  minOrderAmount: integer('min_order_amount').notNull().default(0),   // paise
  maxDiscount: integer('max_discount'),                    // paise cap (null = no cap)
  usageLimit: integer('usage_limit'),                      // null = unlimited
  usedCount: integer('used_count').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
