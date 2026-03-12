import { Test } from '@nestjs/testing'
import { BadRequestException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createHmac } from 'crypto'
import { PaymentService } from './payment.service'
import { OrdersService } from '../orders/orders.service'

jest.mock('axios')
import axios from 'axios'

const mockConfig = {
  getOrThrow: jest.fn((key: string) => {
    const map: Record<string, string> = {
      RAZORPAY_KEY_ID: 'rzp_test_key',
      RAZORPAY_KEY_SECRET: 'rzp_test_secret',
      RAZORPAY_WEBHOOK_SECRET: 'webhook_secret',
    }
    if (!map[key]) throw new Error(`Missing config: ${key}`)
    return map[key]
  }),
}

const mockOrders = {
  updateStatus: jest.fn().mockResolvedValue({ success: true }),
  findOne: jest.fn().mockResolvedValue({ id: 'order-1', userId: 'user-1' }),
}

describe('PaymentService', () => {
  let service: PaymentService

  beforeEach(async () => {
    jest.clearAllMocks()
    const module = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: ConfigService, useValue: mockConfig },
        { provide: OrdersService, useValue: mockOrders },
      ],
    }).compile()
    service = module.get(PaymentService)
  })

  describe('createRazorpayOrder', () => {
    it('returns razorpayOrderId and keyId', async () => {
      ;(axios.post as jest.Mock).mockResolvedValueOnce({
        data: { id: 'rzp_order_123', amount: 50000, currency: 'INR' },
      })

      const result = await service.createRazorpayOrder('order-1', 50000)

      expect(result.razorpayOrderId).toBe('rzp_order_123')
      expect(result.amount).toBe(50000)
      expect(result.currency).toBe('INR')
      expect(result.keyId).toBe('rzp_test_key')
      expect(axios.post).toHaveBeenCalledWith(
        'https://api.razorpay.com/v1/orders',
        { amount: 50000, currency: 'INR', receipt: 'order-1' },
        expect.objectContaining({ auth: { username: 'rzp_test_key', password: 'rzp_test_secret' } }),
      )
    })
  })

  describe('verifyPayment', () => {
    it('throws BadRequestException on invalid signature', async () => {
      await expect(service.verifyPayment({
        razorpayOrderId: 'rzp_order_123',
        razorpayPaymentId: 'pay_123',
        razorpaySignature: 'bad-signature',
        orderId: 'order-1',
      }, 'user-1')).rejects.toThrow(BadRequestException)
    })

    it('updates order to confirmed on valid signature', async () => {
      const orderId = 'rzp_order_123'
      const payId = 'pay_123'
      const secret = 'rzp_test_secret'
      const validSig = createHmac('sha256', secret).update(`${orderId}|${payId}`).digest('hex')

      await service.verifyPayment({
        razorpayOrderId: orderId,
        razorpayPaymentId: payId,
        razorpaySignature: validSig,
        orderId: 'order-1',
      }, 'user-1')

      expect(mockOrders.updateStatus).toHaveBeenCalledWith('order-1', 'confirmed')
    })
  })

  describe('handleWebhook', () => {
    it('throws BadRequestException on invalid webhook signature', async () => {
      const body = Buffer.from(JSON.stringify({ event: 'payment.captured' }))
      await expect(service.handleWebhook(body, 'invalid-sig')).rejects.toThrow(BadRequestException)
    })

    it('accepts valid webhook signature', async () => {
      const payload = { event: 'payment.captured' }
      const body = Buffer.from(JSON.stringify(payload))
      const sig = createHmac('sha256', 'webhook_secret').update(body).digest('hex')

      const result = await service.handleWebhook(body, sig)
      expect(result.received).toBe(true)
    })
  })
})
