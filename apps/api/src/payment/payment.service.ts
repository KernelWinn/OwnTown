import { Injectable, BadRequestException, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createHmac } from 'crypto'
import axios from 'axios'
import { OrdersService } from '../orders/orders.service'

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name)

  constructor(
    private readonly config: ConfigService,
    private readonly ordersService: OrdersService,
  ) {}

  async createRazorpayOrder(orderId: string, amountPaise: number) {
    const keyId = this.config.getOrThrow('RAZORPAY_KEY_ID')
    const keySecret = this.config.getOrThrow('RAZORPAY_KEY_SECRET')

    const { data } = await axios.post(
      'https://api.razorpay.com/v1/orders',
      { amount: amountPaise, currency: 'INR', receipt: orderId },
      { auth: { username: keyId, password: keySecret } },
    )
    return { razorpayOrderId: data.id, amount: data.amount, currency: data.currency, keyId }
  }

  async verifyPayment(
    body: {
      razorpayOrderId: string
      razorpayPaymentId: string
      razorpaySignature: string
      orderId: string
    },
    userId: string,
  ) {
    const secret = this.config.getOrThrow('RAZORPAY_KEY_SECRET')
    const expected = createHmac('sha256', secret)
      .update(`${body.razorpayOrderId}|${body.razorpayPaymentId}`)
      .digest('hex')

    if (expected !== body.razorpaySignature) {
      throw new BadRequestException('Invalid payment signature')
    }
    // Verify the authenticated user owns this order before confirming
    await this.ordersService.findOne(body.orderId, userId)
    return this.ordersService.updateStatus(body.orderId, 'confirmed')
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    const secret = this.config.getOrThrow('RAZORPAY_WEBHOOK_SECRET')
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
    if (expected !== signature) throw new BadRequestException('Invalid webhook signature')

    const payload = JSON.parse(rawBody.toString())
    this.logger.log(`Razorpay webhook: ${payload.event}`)
    // Handle payment.captured, payment.failed events
    return { received: true }
  }
}
