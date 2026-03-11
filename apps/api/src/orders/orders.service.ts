import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { eq, and, gte, desc } from 'drizzle-orm'
import { DB } from '../database/database.module'
import { orders, orderItems, addresses, deliverySlots } from '../database/schema'
import { generateOrderNumber } from '@owntown/utils'
import type { CreateOrderDto } from './dto/create-order.dto'

@Injectable()
export class OrdersService {
  constructor(@Inject(DB) private readonly db: any) {}

  async findByUser(userId: string) {
    return this.db.select().from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt))
  }

  async findOne(id: string, userId: string) {
    const [order] = await this.db.select().from(orders)
      .where(and(eq(orders.id, id), eq(orders.userId, userId)))
    if (!order) throw new NotFoundException('Order not found')
    const items = await this.db.select().from(orderItems).where(eq(orderItems.orderId, id))
    return { ...order, items }
  }

  async getAvailableSlots() {
    const today = new Date().toISOString().split('T')[0]
    return this.db.select().from(deliverySlots)
      .where(and(eq(deliverySlots.isActive, true), gte(deliverySlots.date, today)))
      .orderBy(deliverySlots.date, deliverySlots.startTime)
  }

  async create(userId: string, dto: CreateOrderDto) {
    // 1. Validate address belongs to user
    const [address] = await this.db.select().from(addresses)
      .where(and(eq(addresses.id, dto.addressId), eq(addresses.userId, userId)))
    if (!address) throw new NotFoundException('Address not found')

    // 2. Validate slot availability
    const [slot] = await this.db.select().from(deliverySlots)
      .where(eq(deliverySlots.id, dto.deliverySlotId))
    if (!slot || !slot.isActive) throw new BadRequestException('Delivery slot not available')
    if (slot.currentOrders >= slot.maxOrders) throw new BadRequestException('Delivery slot is full')

    // NOTE: Cart is stored in Redis/client — items will be passed from payment service
    // Full order creation with items happens after payment confirmation (Razorpay webhook)
    // This endpoint creates a pending order and returns Razorpay order details

    const orderNumber = generateOrderNumber(new Date(), await this.getNextSequence())
    const [order] = await this.db.insert(orders).values({
      orderNumber,
      userId,
      deliverySlotId: dto.deliverySlotId,
      address: { name: address.name, phone: address.phone, line1: address.line1,
        line2: address.line2, landmark: address.landmark, city: address.city,
        state: address.state, pincode: address.pincode },
      paymentMethod: dto.paymentMethod as any,
      subtotal: 0,
      total: 0,
      notes: dto.notes,
    }).returning()

    return order
  }

  async updateStatus(orderId: string, status: string) {
    await this.db.update(orders)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(orders.id, orderId))
  }

  private async getNextSequence(): Promise<number> {
    const [result] = await this.db.select().from(orders).orderBy(desc(orders.createdAt)).limit(1)
    return (result ? parseInt(result.orderNumber.split('-')[2] ?? '0') : 0) + 1
  }
}
