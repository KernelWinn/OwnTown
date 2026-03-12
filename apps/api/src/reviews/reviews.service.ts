import { Inject, Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { eq, and, avg, count, desc } from 'drizzle-orm'
import { DB } from '../database/database.module'
import { reviews, orders, orderItems } from '../database/schema'

@Injectable()
export class ReviewsService {
  constructor(@Inject(DB) private readonly db: any) {}

  async createForOrder(
    userId: string,
    orderId: string,
    items: Array<{ productId: string; rating: number; comment?: string }>,
  ) {
    // Validate order belongs to user and is delivered
    const [order] = await this.db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    if (!order) throw new NotFoundException('Order not found')
    if (order.status !== 'delivered') {
      throw new BadRequestException('You can only review delivered orders')
    }

    // Validate products are from this order
    const orderItemRows = await this.db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId))
    const validProductIds = new Set(orderItemRows.map((i: any) => i.productId))

    const toInsert = items
      .filter(i => validProductIds.has(i.productId))
      .map(i => ({
        userId,
        orderId,
        productId: i.productId,
        rating: Math.max(1, Math.min(5, i.rating)),
        comment: i.comment,
      }))

    if (!toInsert.length) throw new BadRequestException('No valid products to review')

    const created = await this.db
      .insert(reviews)
      .values(toInsert)
      .onConflictDoNothing()
      .returning()

    return created
  }

  async findByProduct(productId: string) {
    const rows = await this.db
      .select()
      .from(reviews)
      .where(and(eq(reviews.productId, productId), eq(reviews.isApproved, true)))
      .orderBy(desc(reviews.createdAt))

    const [stats] = await this.db
      .select({ avg: avg(reviews.rating), total: count() })
      .from(reviews)
      .where(and(eq(reviews.productId, productId), eq(reviews.isApproved, true)))

    return {
      reviews: rows,
      averageRating: stats?.avg ? parseFloat(Number(stats.avg).toFixed(1)) : null,
      totalReviews: stats?.total ?? 0,
    }
  }

  async hasReviewedOrder(userId: string, orderId: string): Promise<boolean> {
    const rows = await this.db
      .select()
      .from(reviews)
      .where(and(eq(reviews.orderId, orderId), eq(reviews.userId, userId)))
    return rows.length > 0
  }

  // ─── Admin ─────────────────────────────────────────────────────────────

  async findAll(approved?: boolean) {
    const q = this.db.select().from(reviews).orderBy(desc(reviews.createdAt))
    if (approved !== undefined) return q.where(eq(reviews.isApproved, approved))
    return q
  }

  async approve(id: string) {
    const [review] = await this.db
      .update(reviews)
      .set({ isApproved: true })
      .where(eq(reviews.id, id))
      .returning()
    if (!review) throw new NotFoundException('Review not found')
    return review
  }

  async delete(id: string) {
    await this.db.delete(reviews).where(eq(reviews.id, id))
    return { success: true }
  }
}
