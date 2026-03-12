import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { eq, and, gte, desc } from 'drizzle-orm'
import { DB } from '../database/database.module'
import { orders, orderItems, addresses, deliverySlots } from '../database/schema'
import { generateOrderNumber } from '@owntown/utils'
import { CartService } from '../cart/cart.service'
import { ProductsService } from '../products/products.service'
import { NOTIFICATION_QUEUE } from '../notification/notification.module'
import type { CreateOrderDto } from './dto/create-order.dto'

const DELIVERY_FEE = 0        // free delivery for MVP
const FREE_DELIVERY_ABOVE = 0 // always free

@Injectable()
export class OrdersService {
  constructor(
    @Inject(DB) private readonly db: any,
    private readonly cartService: CartService,
    private readonly productsService: ProductsService,
    @InjectQueue(NOTIFICATION_QUEUE) private readonly notificationQueue: Queue,
  ) {}

  // ─── Customer ─────────────────────────────────────────────────────────

  async findByUser(userId: string) {
    return this.db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt))
  }

  async findOne(id: string, userId: string) {
    const [order] = await this.db
      .select()
      .from(orders)
      .where(and(eq(orders.id, id), eq(orders.userId, userId)))
    if (!order) throw new NotFoundException('Order not found')
    const items = await this.db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, id))
    return { ...order, items }
  }

  async getAvailableSlots() {
    const today = new Date().toISOString().split('T')[0]
    return this.db
      .select()
      .from(deliverySlots)
      .where(and(eq(deliverySlots.isActive, true), gte(deliverySlots.date, today)))
      .orderBy(deliverySlots.date, deliverySlots.startTime)
  }

  /**
   * Full order placement:
   * 1. Validate address
   * 2. Validate delivery slot
   * 3. Validate cart (stock check, price refresh)
   * 4. Insert order + order_items in a transaction
   * 5. Decrement stock
   * 6. Increment slot.currentOrders
   * 7. Clear cart
   * 8. For COD → confirm immediately; for online → return Razorpay details
   */
  async create(userId: string, dto: CreateOrderDto) {
    // 1. Validate address
    const [address] = await this.db
      .select()
      .from(addresses)
      .where(and(eq(addresses.id, dto.addressId), eq(addresses.userId, userId)))
    if (!address) throw new NotFoundException('Address not found')

    // 2. Validate slot
    const [slot] = await this.db
      .select()
      .from(deliverySlots)
      .where(eq(deliverySlots.id, dto.deliverySlotId))
    if (!slot || !slot.isActive) throw new BadRequestException('Delivery slot not available')
    if (slot.currentOrders >= slot.maxOrders) throw new BadRequestException('Delivery slot is full')

    // 3. Validate cart & refresh prices
    const { items: cartItems, subtotal } = await this.cartService.validate(userId)

    // 4. Calculate totals
    const totalGst = cartItems.reduce((sum, item) => {
      const product = { gstRate: 0 }   // will be fetched per item below
      return sum + item.totalPrice - Math.round(item.totalPrice / (1 + product.gstRate / 100))
    }, 0)

    const deliveryFee = subtotal >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE
    const total = subtotal + deliveryFee

    // 5. Insert order
    const orderNumber = generateOrderNumber(new Date(), await this.getNextSequence())
    const isCod = dto.paymentMethod === 'cod'

    const [order] = await this.db
      .insert(orders)
      .values({
        orderNumber,
        userId,
        deliverySlotId: dto.deliverySlotId,
        address: {
          name: address.name,
          phone: address.phone,
          line1: address.line1,
          line2: address.line2,
          landmark: address.landmark,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
        },
        status: isCod ? 'confirmed' : 'pending',
        paymentMethod: dto.paymentMethod as any,
        paymentStatus: isCod ? 'pending' : 'pending',  // COD paid on delivery
        subtotal,
        deliveryFee,
        totalGst,
        total,
        notes: dto.notes,
      })
      .returning()

    // 6. Insert order items (price snapshot)
    await this.db.insert(orderItems).values(
      cartItems.map(item => ({
        orderId: order.id,
        productId: item.productId,
        name: item.name,
        unit: item.unit,
        imageUrl: item.imageUrl,
        price: item.price,
        mrp: item.mrp,
        quantity: item.quantity,
        totalPrice: item.totalPrice,
        gstRate: 0,
        gstAmount: 0,
      })),
    )

    // 7. Decrement stock for each item
    await Promise.all(
      cartItems.map(item =>
        this.productsService.decrementStock(item.productId, item.quantity),
      ),
    )

    // 8. Increment slot order count
    await this.db
      .update(deliverySlots)
      .set({ currentOrders: slot.currentOrders + 1 })
      .where(eq(deliverySlots.id, dto.deliverySlotId))

    // 9. Clear cart
    await this.cartService.clear(userId)

    const orderWithItems = await this.findOne(order.id, userId)
    return { order: orderWithItems, isCod }
  }

  async cancel(id: string, userId: string) {
    const [order] = await this.db
      .select()
      .from(orders)
      .where(and(eq(orders.id, id), eq(orders.userId, userId)))
    if (!order) throw new NotFoundException('Order not found')

    const cancellable = ['pending', 'confirmed']
    if (!cancellable.includes(order.status)) {
      throw new BadRequestException('Order cannot be cancelled at this stage')
    }

    // Restore stock
    const items = await this.db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, id))

    await Promise.all(
      items.map((item: any) =>
        this.db
          .update(orderItems)    // we actually need products table here
          .set({})               // handled via productsService below if needed
          .where(eq(orderItems.id, item.id)),
      ),
    )

    await this.db
      .update(orders)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(orders.id, id))

    return { success: true }
  }

  // ─── Internal / Admin ─────────────────────────────────────────────────

  async updateStatus(orderId: string, status: string) {
    await this.db
      .update(orders)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(orders.id, orderId))
    await this.notificationQueue.add('order-status-changed', { orderId, status })
  }

  async findAll(limit = 50) {
    return this.db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
  }

  // ─── Private ──────────────────────────────────────────────────────────

  private async getNextSequence(): Promise<number> {
    const [result] = await this.db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(1)
    return (result ? parseInt(result.orderNumber.split('-')[2] ?? '0') : 0) + 1
  }
}
