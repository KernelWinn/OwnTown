import { Inject, Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { eq, desc } from 'drizzle-orm'
import { DB } from '../database/database.module'
import { coupons } from '../database/schema'

@Injectable()
export class CouponsService {
  constructor(@Inject(DB) private readonly db: any) {}

  async validate(code: string, orderAmount: number) {
    const [coupon] = await this.db
      .select()
      .from(coupons)
      .where(eq(coupons.code, code.toUpperCase().trim()))

    if (!coupon) throw new NotFoundException('Coupon not found')
    if (!coupon.isActive) throw new BadRequestException('Coupon is no longer active')
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      throw new BadRequestException('Coupon has expired')
    }
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('Coupon usage limit reached')
    }
    if (orderAmount < coupon.minOrderAmount) {
      throw new BadRequestException(
        `Minimum order amount is ₹${(coupon.minOrderAmount / 100).toFixed(0)} for this coupon`,
      )
    }

    const discount = this.calculateDiscount(coupon, orderAmount)
    return {
      couponId: coupon.id,
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discount,
    }
  }

  calculateDiscount(coupon: { discountType: string; discountValue: number; maxDiscount: number | null }, orderAmount: number): number {
    let discount: number
    if (coupon.discountType === 'percentage') {
      discount = Math.round((orderAmount * coupon.discountValue) / 100)
      if (coupon.maxDiscount !== null) discount = Math.min(discount, coupon.maxDiscount)
    } else {
      discount = coupon.discountValue
    }
    return Math.min(discount, orderAmount)  // can't discount more than order total
  }

  async incrementUsage(couponId: string) {
    await this.db
      .update(coupons)
      .set({ usedCount: this.db.raw('used_count + 1') })
      .where(eq(coupons.id, couponId))
  }

  // ─── Admin ─────────────────────────────────────────────────────────────

  async findAll() {
    return this.db.select().from(coupons).orderBy(desc(coupons.createdAt))
  }

  async create(dto: {
    code: string
    description?: string
    discountType: 'percentage' | 'flat'
    discountValue: number
    minOrderAmount?: number
    maxDiscount?: number
    usageLimit?: number
    expiresAt?: string
  }) {
    const [coupon] = await this.db
      .insert(coupons)
      .values({
        ...dto,
        code: dto.code.toUpperCase().trim(),
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      })
      .returning()
    return coupon
  }

  async update(id: string, dto: Partial<{
    description: string
    discountType: 'percentage' | 'flat'
    discountValue: number
    minOrderAmount: number
    maxDiscount: number | null
    usageLimit: number | null
    expiresAt: string | null
    isActive: boolean
  }>) {
    const [coupon] = await this.db
      .update(coupons)
      .set({
        ...dto,
        expiresAt: dto.expiresAt !== undefined
          ? (dto.expiresAt ? new Date(dto.expiresAt) : null)
          : undefined,
      })
      .where(eq(coupons.id, id))
      .returning()
    if (!coupon) throw new NotFoundException('Coupon not found')
    return coupon
  }

  async delete(id: string) {
    await this.db.delete(coupons).where(eq(coupons.id, id))
    return { success: true }
  }
}
