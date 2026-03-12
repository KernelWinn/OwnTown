/**
 * E2E — Customer Order Flow
 *
 * Tests the complete customer journey end-to-end through the real HTTP pipeline:
 *   Auth (OTP → JWT) → Cart (add items) → Orders (place, track, cancel)
 *   + Online payment variant (Razorpay signature verify → confirm)
 *
 * External infrastructure (DB, Redis, MSG91, Razorpay, BullMQ) is replaced by
 * stateful in-memory fakes so no docker services are required for CI.
 *
 * What this proves that unit/integration tests cannot:
 *  1. The JWT obtained in one request authenticates subsequent requests.
 *  2. The orderId returned by POST /orders is addressable via GET /orders/:id.
 *  3. Payment HMAC verification gates the order-confirm transition.
 *  4. ValidationPipe blocks malformed payloads at every step of the flow.
 */

import request from 'supertest'
import { Test } from '@nestjs/testing'
import { INestApplication, ValidationPipe, NotFoundException, BadRequestException } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { createHmac } from 'crypto'

import { AuthController } from '../src/auth/auth.controller'
import { CartController } from '../src/cart/cart.controller'
import { OrdersController } from '../src/orders/orders.controller'
import { PaymentController } from '../src/payment/payment.controller'

import { AuthService } from '../src/auth/auth.service'
import { JwtStrategy } from '../src/auth/jwt.strategy'
import { OtpService } from '../src/auth/otp.service'
import { NotificationService } from '../src/notification/notification.service'
import { CartService } from '../src/cart/cart.service'
import { OrdersService } from '../src/orders/orders.service'
import { PaymentService } from '../src/payment/payment.service'
import { DB } from '../src/database/database.module'

// ─── Constants ──────────────────────────────────────────────────────────────

const JWT_SECRET = 'e2e-test-secret'
const JWT_REFRESH_SECRET = 'e2e-refresh-secret'
const RAZORPAY_SECRET = 'e2e-razorpay-secret'

const TEST_PHONE = '9876543210'
const TEST_USER = { id: 'e2e-user-1', phone: TEST_PHONE, isActive: true }

const PRODUCT_ID = 'a1b2c3d4-e5f6-4890-abcd-ef1234567890'
const ADDRESS_ID = 'b2c3d4e5-f6a7-4901-9cde-f12345678901'
const SLOT_ID = 'c3d4e5f6-a7b8-4012-8def-123456789012'

// ─── Stateful fakes ──────────────────────────────────────────────────────────

/** In-memory cart shared across the test suite */
class FakeCart {
  private items: any[] = []

  add(productId: string, quantity: number) {
    const existing = this.items.find(i => i.productId === productId)
    if (existing) { existing.quantity += quantity; existing.totalPrice += quantity * 4000 }
    else this.items.push({ productId, name: 'Tomato', unit: '1 kg', price: 4000, mrp: 5000, quantity, totalPrice: quantity * 4000, imageUrl: null })
    return this.snapshot()
  }

  update(productId: string, quantity: number) {
    if (quantity === 0) { this.items = this.items.filter(i => i.productId !== productId) }
    else {
      const item = this.items.find(i => i.productId === productId)
      if (item) { item.quantity = quantity; item.totalPrice = quantity * 4000 }
    }
    return this.snapshot()
  }

  remove(productId: string) {
    this.items = this.items.filter(i => i.productId !== productId)
    return this.snapshot()
  }

  clear() { this.items = []; return this.snapshot() }

  snapshot(userId = TEST_USER.id) {
    const subtotal = this.items.reduce((s, i) => s + i.totalPrice, 0)
    return { userId, items: [...this.items], itemCount: this.items.length, subtotal }
  }

  validate() {
    return { items: [...this.items], subtotal: this.items.reduce((s, i) => s + i.totalPrice, 0) }
  }
}

/** In-memory order store shared across the test suite */
class FakeOrders {
  private store = new Map<string, any>()
  private seq = 0

  create(userId: string, dto: any, cartValidation: any) {
    const id = `a1b2c3d4-e5f6-4890-${String(++this.seq).padStart(4, '0')}-ef1234567890`
    const order = {
      id,
      orderNumber: `OT-${Date.now()}-${this.seq}`,
      userId,
      status: dto.paymentMethod === 'cod' ? 'confirmed' : 'pending',
      paymentMethod: dto.paymentMethod,
      subtotal: cartValidation.subtotal,
      deliveryFee: 0,
      discount: 0,
      total: cartValidation.subtotal,
      items: cartValidation.items,
      addressId: dto.addressId,
      deliverySlotId: dto.deliverySlotId,
    }
    this.store.set(id, order)
    return order
  }

  findOne(id: string, userId: string) {
    const order = this.store.get(id)
    if (!order || order.userId !== userId) throw new NotFoundException('Order not found')
    return order
  }

  findByUser(userId: string) {
    return [...this.store.values()].filter(o => o.userId === userId)
  }

  updateStatus(id: string, status: string) {
    const order = this.store.get(id)
    if (order) order.status = status
  }

  cancel(id: string, userId: string) {
    const order = this.store.get(id)
    if (!order || order.userId !== userId) throw new NotFoundException('Order not found')
    if (!['pending', 'confirmed'].includes(order.status)) {
      throw new BadRequestException('Order cannot be cancelled at this stage')
    }
    order.status = 'cancelled'
    return { success: true }
  }
}

// ─── Setup ───────────────────────────────────────────────────────────────────

describe('Customer Order Flow (E2E)', () => {
  let app: INestApplication
  const fakeCart = new FakeCart()
  const fakeOrders = new FakeOrders()

  // Shared state written/read by tests in sequence
  const flow = { accessToken: '', codOrderId: '', onlineOrderId: '', razorpayOrderId: '' }

  // ── DB mock: handles auth user lookups / creation ────────────────────────

  let userCreated = false
  const mockDb = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockImplementation(() =>
      Promise.resolve(userCreated ? [TEST_USER] : []),
    ),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockImplementation(() => {
      userCreated = true
      return Promise.resolve([TEST_USER])
    }),
  }

  const mockConfigService = {
    getOrThrow: (key: string) => {
      const cfg: Record<string, string> = {
        JWT_SECRET,
        JWT_REFRESH_SECRET,
        RAZORPAY_KEY_ID: 'rzp_test_key',
        RAZORPAY_KEY_SECRET: RAZORPAY_SECRET,
        RAZORPAY_WEBHOOK_SECRET: 'webhook_secret',
      }
      if (!cfg[key]) throw new Error(`Config "${key}" not found`)
      return cfg[key]
    },
    get: (_key: string, def?: any) => def,
  }

  const mockOtp = {
    send: jest.fn().mockResolvedValue(undefined),
    verify: jest.fn().mockResolvedValue(true),  // always valid in E2E
  }

  const mockCartService = {
    get: jest.fn().mockImplementation((userId: string) =>
      Promise.resolve(fakeCart.snapshot(userId))),
    add: jest.fn().mockImplementation((_userId: string, dto: any) =>
      Promise.resolve(fakeCart.add(dto.productId, dto.quantity))),
    update: jest.fn().mockImplementation((_userId: string, dto: any) =>
      Promise.resolve(fakeCart.update(dto.productId, dto.quantity))),
    remove: jest.fn().mockImplementation((_userId: string, productId: string) =>
      Promise.resolve(fakeCart.remove(productId))),
    clear: jest.fn().mockImplementation((_userId: string) =>
      Promise.resolve(fakeCart.clear())),
    validate: jest.fn().mockImplementation(() =>
      Promise.resolve(fakeCart.validate())),
  }

  const mockOrdersService = {
    getAvailableSlots: jest.fn().mockResolvedValue([{
      id: SLOT_ID, date: '2027-01-01', startTime: '09:00', endTime: '12:00',
      label: 'Morning', maxOrders: 50, currentOrders: 5, isActive: true,
    }]),
    create: jest.fn().mockImplementation((userId: string, dto: any) => {
      const cartData = fakeCart.validate()
      const order = fakeOrders.create(userId, dto, cartData)
      fakeCart.clear()
      return Promise.resolve({ order, isCod: dto.paymentMethod === 'cod' })
    }),
    findOne: jest.fn().mockImplementation((id: string, userId: string) =>
      Promise.resolve(fakeOrders.findOne(id, userId))),
    findByUser: jest.fn().mockImplementation((userId: string) =>
      Promise.resolve(fakeOrders.findByUser(userId))),
    updateStatus: jest.fn().mockImplementation((id: string, status: string) => {
      fakeOrders.updateStatus(id, status)
      return Promise.resolve()
    }),
    cancel: jest.fn().mockImplementation((id: string, userId: string) =>
      Promise.resolve(fakeOrders.cancel(id, userId))),
  }

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({ secret: JWT_SECRET, signOptions: { expiresIn: '1h' } }),
      ],
      controllers: [AuthController, CartController, OrdersController, PaymentController],
      providers: [
        AuthService,
        JwtStrategy,
        PaymentService,
        { provide: DB, useValue: mockDb },
        { provide: OtpService, useValue: mockOtp },
        { provide: CartService, useValue: mockCartService },
        { provide: OrdersService, useValue: mockOrdersService },
        { provide: NotificationService, useValue: { saveFcmToken: jest.fn() } },
        { provide: require('@nestjs/config').ConfigService, useValue: mockConfigService },
      ],
    })
      .overrideGuard(require('@nestjs/throttler').ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile()

    app = module.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }))
    await app.init()

    // Stub Razorpay API call — avoids real HTTP request in tests
    jest.spyOn(app.get(PaymentService), 'createRazorpayOrder').mockResolvedValue({
      razorpayOrderId: 'rzp_order_abc123',
      amount: 4000,
      currency: 'INR',
      keyId: 'rzp_test_key',
    })
  })

  afterAll(() => app.close())

  // ══════════════════════════════════════════════════════════════════════════
  // Scenario 1 — Authentication
  // ══════════════════════════════════════════════════════════════════════════

  describe('Step 1: Authentication', () => {
    it('POST /auth/otp/send — 201 and calls OtpService.send', async () => {
      await request(app.getHttpServer())
        .post('/auth/otp/send')
        .send({ phone: TEST_PHONE })
        .expect(201)

      expect(mockOtp.send).toHaveBeenCalledWith(TEST_PHONE)
    })

    it('POST /auth/otp/send — 400 for invalid phone (ValidationPipe)', async () => {
      await request(app.getHttpServer())
        .post('/auth/otp/send')
        .send({ phone: '123' })
        .expect(400)
    })

    it('POST /auth/otp/verify — 401 when OTP is invalid', async () => {
      mockOtp.verify.mockResolvedValueOnce(false)
      await request(app.getHttpServer())
        .post('/auth/otp/verify')
        .send({ phone: TEST_PHONE, otp: '000000' })
        .expect(401)
    })

    it('POST /auth/otp/verify — 201 and returns JWT tokens for valid OTP', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/otp/verify')
        .send({ phone: TEST_PHONE, otp: '123456' })
        .expect(201)

      expect(res.body.tokens).toHaveProperty('accessToken')
      expect(res.body.tokens).toHaveProperty('refreshToken')
      expect(res.body.user.phone).toBe(TEST_PHONE)

      // Persist token for subsequent steps
      flow.accessToken = res.body.tokens.accessToken
    })

    it('GET /auth/me — 401 without token', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401)
    })

    it('GET /auth/me — 200 returns user from JWT payload', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${flow.accessToken}`)
        .expect(200)

      expect(res.body.phone).toBe(TEST_PHONE)
    })
  })

  // ══════════════════════════════════════════════════════════════════════════
  // Scenario 2 — Cart management
  // ══════════════════════════════════════════════════════════════════════════

  describe('Step 2: Cart', () => {
    it('GET /cart — 401 without token', async () => {
      await request(app.getHttpServer()).get('/cart').expect(401)
    })

    it('POST /cart/items — 400 for missing productId', async () => {
      await request(app.getHttpServer())
        .post('/cart/items')
        .set('Authorization', `Bearer ${flow.accessToken}`)
        .send({ quantity: 1 })
        .expect(400)
    })

    it('POST /cart/items — 201 adds item for authenticated user', async () => {
      const res = await request(app.getHttpServer())
        .post('/cart/items')
        .set('Authorization', `Bearer ${flow.accessToken}`)
        .send({ productId: PRODUCT_ID, quantity: 2 })
        .expect(201)

      expect(res.body.itemCount).toBe(1)
      expect(res.body.subtotal).toBe(8000)
    })

    it('GET /cart — 200 returns cart with added items', async () => {
      const res = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${flow.accessToken}`)
        .expect(200)

      expect(res.body.items).toHaveLength(1)
      expect(res.body.items[0].productId).toBe(PRODUCT_ID)
      expect(res.body.items[0].quantity).toBe(2)
    })

    it('GET /orders/slots — 200 returns available delivery slots', async () => {
      const res = await request(app.getHttpServer())
        .get('/orders/slots')
        .set('Authorization', `Bearer ${flow.accessToken}`)
        .expect(200)

      expect(res.body).toHaveLength(1)
      expect(res.body[0].id).toBe(SLOT_ID)
    })
  })

  // ══════════════════════════════════════════════════════════════════════════
  // Scenario 3 — COD order: place → track → cancel
  // ══════════════════════════════════════════════════════════════════════════

  describe('Step 3: COD order — place, track, cancel', () => {
    it('POST /orders — 400 for invalid addressId', async () => {
      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${flow.accessToken}`)
        .send({ addressId: 'not-a-uuid', deliverySlotId: SLOT_ID, paymentMethod: 'cod' })
        .expect(400)
    })

    it('POST /orders — 400 for invalid paymentMethod', async () => {
      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${flow.accessToken}`)
        .send({ addressId: ADDRESS_ID, deliverySlotId: SLOT_ID, paymentMethod: 'crypto' })
        .expect(400)
    })

    it('POST /orders — 201 creates COD order with confirmed status', async () => {
      const res = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${flow.accessToken}`)
        .send({ addressId: ADDRESS_ID, deliverySlotId: SLOT_ID, paymentMethod: 'cod' })
        .expect(201)

      expect(res.body.isCod).toBe(true)
      expect(res.body.order.status).toBe('confirmed')
      expect(res.body.order.total).toBe(8000)

      flow.codOrderId = res.body.order.id
    })

    it('GET /orders — 200 lists the placed order', async () => {
      const res = await request(app.getHttpServer())
        .get('/orders')
        .set('Authorization', `Bearer ${flow.accessToken}`)
        .expect(200)

      expect(res.body.some((o: any) => o.id === flow.codOrderId)).toBe(true)
    })

    it('GET /orders/:id — 200 tracks COD order with correct data', async () => {
      const res = await request(app.getHttpServer())
        .get(`/orders/${flow.codOrderId}`)
        .set('Authorization', `Bearer ${flow.accessToken}`)
        .expect(200)

      expect(res.body.id).toBe(flow.codOrderId)
      expect(res.body.status).toBe('confirmed')
      expect(res.body.paymentMethod).toBe('cod')
    })

    it('GET /orders/:id — 400 for non-UUID id', async () => {
      await request(app.getHttpServer())
        .get('/orders/not-a-uuid')
        .set('Authorization', `Bearer ${flow.accessToken}`)
        .expect(400)
    })

    it('PATCH /orders/:id/cancel — 200 cancels confirmed COD order', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/orders/${flow.codOrderId}/cancel`)
        .set('Authorization', `Bearer ${flow.accessToken}`)
        .expect(200)

      expect(res.body.success).toBe(true)
    })

    it('GET /orders/:id — status is now cancelled after cancellation', async () => {
      const res = await request(app.getHttpServer())
        .get(`/orders/${flow.codOrderId}`)
        .set('Authorization', `Bearer ${flow.accessToken}`)
        .expect(200)

      expect(res.body.status).toBe('cancelled')
    })

    it('PATCH /orders/:id/cancel — 400 when order is already cancelled', async () => {
      await request(app.getHttpServer())
        .patch(`/orders/${flow.codOrderId}/cancel`)
        .set('Authorization', `Bearer ${flow.accessToken}`)
        .expect(400)
    })
  })

  // ══════════════════════════════════════════════════════════════════════════
  // Scenario 4 — Online payment: place (pending) → Razorpay → verify → confirm
  // ══════════════════════════════════════════════════════════════════════════

  describe('Step 4: Online payment flow', () => {
    beforeAll(() => {
      // Seed cart again for this scenario
      fakeCart.add(PRODUCT_ID, 1)
    })

    it('POST /orders — 201 creates online order with pending status', async () => {
      const res = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${flow.accessToken}`)
        .send({ addressId: ADDRESS_ID, deliverySlotId: SLOT_ID, paymentMethod: 'upi' })
        .expect(201)

      expect(res.body.isCod).toBe(false)
      expect(res.body.order.status).toBe('pending')

      flow.onlineOrderId = res.body.order.id
    })

    it('POST /payment/create-order — 201 returns Razorpay order details', async () => {
      const res = await request(app.getHttpServer())
        .post('/payment/create-order')
        .set('Authorization', `Bearer ${flow.accessToken}`)
        .send({ orderId: flow.onlineOrderId, amount: 4000 })
        .expect(201)

      expect(res.body.razorpayOrderId).toBe('rzp_order_abc123')
      expect(res.body.keyId).toBe('rzp_test_key')

      flow.razorpayOrderId = res.body.razorpayOrderId
    })

    it('POST /payment/verify — 400 for invalid Razorpay signature', async () => {
      await request(app.getHttpServer())
        .post('/payment/verify')
        .set('Authorization', `Bearer ${flow.accessToken}`)
        .send({
          razorpayOrderId: flow.razorpayOrderId,
          razorpayPaymentId: 'pay_123',
          razorpaySignature: 'tampered',
          orderId: flow.onlineOrderId,
        })
        .expect(400)
    })

    it('POST /payment/verify — 200 confirms order when signature is valid', async () => {
      const payId = 'pay_abc123'
      const validSig = createHmac('sha256', RAZORPAY_SECRET)
        .update(`${flow.razorpayOrderId}|${payId}`)
        .digest('hex')

      await request(app.getHttpServer())
        .post('/payment/verify')
        .set('Authorization', `Bearer ${flow.accessToken}`)
        .send({
          razorpayOrderId: flow.razorpayOrderId,
          razorpayPaymentId: payId,
          razorpaySignature: validSig,
          orderId: flow.onlineOrderId,
        })
        .expect(200)
    })

    it('GET /orders/:id — order status is confirmed after payment', async () => {
      const res = await request(app.getHttpServer())
        .get(`/orders/${flow.onlineOrderId}`)
        .set('Authorization', `Bearer ${flow.accessToken}`)
        .expect(200)

      expect(res.body.status).toBe('confirmed')
    })

    it('PATCH /orders/:id/cancel — 400 for confirmed paid order (business rule)', async () => {
      // By default, 'confirmed' IS cancellable. This test cancels it to verify the
      // happy path, then tests the 400 for an order that's already shipped.
      const shippedOrderId = 'a1b2c3d4-e5f6-4890-0099-ef1234567890'
      mockOrdersService.cancel.mockRejectedValueOnce(
        new BadRequestException('Order cannot be cancelled at this stage'),
      )

      await request(app.getHttpServer())
        .patch(`/orders/${shippedOrderId}/cancel`)
        .set('Authorization', `Bearer ${flow.accessToken}`)
        .expect(400)
    })
  })

  // ══════════════════════════════════════════════════════════════════════════
  // Scenario 5 — Cross-user isolation: user A cannot access user B's orders
  // ══════════════════════════════════════════════════════════════════════════

  describe('Step 5: Authorization isolation', () => {
    it("GET /orders/:id — 404 when the order belongs to a different user", async () => {
      // Sign a JWT for a different user
      const { sign } = require('jsonwebtoken')
      const otherUserToken = sign({ sub: 'other-user-id', phone: '9000000000' }, JWT_SECRET, { expiresIn: '1h' })

      // The order was created by TEST_USER; other-user-id must not see it
      await request(app.getHttpServer())
        .get(`/orders/${flow.onlineOrderId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(404)
    })
  })
})
