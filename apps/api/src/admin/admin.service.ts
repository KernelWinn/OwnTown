import { Inject, Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { compare } from 'bcrypt'
import { eq, desc, gte, count } from 'drizzle-orm'
import { DB } from '../database/database.module'
import { adminUsers, orders, orderItems, users, deliverySlots } from '../database/schema'

@Injectable()
export class AdminService {
  constructor(
    @Inject(DB) private readonly db: any,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const [admin] = await this.db.select().from(adminUsers).where(eq(adminUsers.email, email))
    if (!admin || !admin.isActive) throw new UnauthorizedException('Invalid credentials')

    const valid = await compare(password, admin.passwordHash)
    if (!valid) throw new UnauthorizedException('Invalid credentials')

    const token = this.jwtService.sign({ sub: admin.id, email: admin.email, role: 'admin' })
    return { admin: { id: admin.id, email: admin.email, name: admin.name }, token }
  }

  async getDashboardStats() {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const [todayOrdersResult] = await this.db
      .select({ count: count() })
      .from(orders)
      .where(gte(orders.createdAt, todayStart))

    const [pendingResult] = await this.db
      .select({ count: count() })
      .from(orders)
      .where(eq(orders.status, 'pending'))

    const [customersResult] = await this.db.select({ count: count() }).from(users)

    return {
      todayOrders: todayOrdersResult?.count ?? 0,
      todayRevenue: 0,  // TODO: sum of today's confirmed orders
      pendingOrders: pendingResult?.count ?? 0,
      totalCustomers: customersResult?.count ?? 0,
    }
  }

  async getOrders(limit: number) {
    return this.db.select().from(orders).orderBy(desc(orders.createdAt)).limit(limit)
  }

  async getOrderWithItems(id: string) {
    const [order] = await this.db.select().from(orders).where(eq(orders.id, id))
    if (!order) throw new NotFoundException('Order not found')
    const items = await this.db.select().from(orderItems).where(eq(orderItems.orderId, id))
    return { ...order, items }
  }

  async getUsers(limit: number) {
    return this.db
      .select({
        id: users.id,
        name: users.name,
        phone: users.phone,
        email: users.email,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(limit)
  }

  async getSlots(date?: string) {
    const q = this.db.select().from(deliverySlots).orderBy(deliverySlots.date, deliverySlots.startTime)
    if (date) return q.where(eq(deliverySlots.date, date))
    return q
  }

  async createSlot(dto: {
    date: string
    startTime: string
    endTime: string
    label: string
    maxOrders: number
  }) {
    const [slot] = await this.db.insert(deliverySlots).values(dto).returning()
    return slot
  }

  async updateSlot(id: string, dto: Partial<{
    date: string
    startTime: string
    endTime: string
    label: string
    maxOrders: number
    isActive: boolean
  }>) {
    const [slot] = await this.db
      .update(deliverySlots)
      .set(dto)
      .where(eq(deliverySlots.id, id))
      .returning()
    if (!slot) throw new NotFoundException('Slot not found')
    return slot
  }

  async deleteSlot(id: string) {
    await this.db.delete(deliverySlots).where(eq(deliverySlots.id, id))
    return { success: true }
  }
}
