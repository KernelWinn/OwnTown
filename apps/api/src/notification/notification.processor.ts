import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Inject } from '@nestjs/common'
import { Job } from 'bullmq'
import { eq } from 'drizzle-orm'
import { DB } from '../database/database.module'
import { orders, users } from '../database/schema'
import { NotificationService } from './notification.service'

interface OrderStatusJob {
  orderId: string
  status: string
}

const MESSAGES: Record<string, { title: string; body: (n: string) => string }> = {
  confirmed:        { title: 'Order Confirmed ✅',    body: n => `Your order ${n} is confirmed! We'll get it packed soon.` },
  packed:           { title: 'Order Packed 📦',        body: n => `Your order ${n} is packed and ready to ship.` },
  shipped:          { title: 'Order Shipped 🚚',       body: n => `Your order ${n} is on its way!` },
  out_for_delivery: { title: 'Out for Delivery 🛵',   body: n => `Your order ${n} is out for delivery. Expect it soon!` },
  delivered:        { title: 'Order Delivered 🎉',     body: n => `Your order ${n} has been delivered. Enjoy!` },
  cancelled:        { title: 'Order Cancelled',         body: n => `Your order ${n} has been cancelled.` },
}

@Processor('notifications')
export class NotificationProcessor extends WorkerHost {
  constructor(
    @Inject(DB) private readonly db: any,
    private readonly notificationService: NotificationService,
  ) {
    super()
  }

  async process(job: Job<OrderStatusJob>) {
    const { orderId, status } = job.data
    const msg = MESSAGES[status]
    if (!msg) return

    const [order] = await this.db.select().from(orders).where(eq(orders.id, orderId))
    if (!order) return

    const [user] = await this.db.select().from(users).where(eq(users.id, order.userId))
    if (!user) return

    const body = msg.body(order.orderNumber)

    await Promise.allSettled([
      this.notificationService.sendPush(order.userId, msg.title, body, {
        orderId,
        screen: 'order-detail',
      }),
      this.notificationService.sendSms(user.phone, body),
    ])
  }
}
