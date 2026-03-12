/**
 * Orders integration tests — JWT-protected endpoints.
 * Mocks OrdersService so tests focus on the HTTP layer:
 * JwtAuthGuard, ValidationPipe (CreateOrderDto), ParseUUIDPipe, status codes.
 */
import request = require('supertest')
import { Test } from '@nestjs/testing'
import { INestApplication, ValidationPipe, NotFoundException, BadRequestException } from '@nestjs/common'
import { OrdersController } from './orders.controller'
import { OrdersService } from './orders.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

const TEST_USER = { id: 'user-1', phone: '9876543210' }

const authedGuard = {
  canActivate: (ctx: any) => {
    ctx.switchToHttp().getRequest().user = TEST_USER
    return true
  },
}
const anonGuard = { canActivate: () => false }

const ORDER_ID = 'a1b2c3d4-e5f6-4890-abcd-ef1234567890'
const ADDR_ID  = 'b2c3d4e5-f6a7-4901-9cde-f12345678901'
const SLOT_ID  = 'c3d4e5f6-a7b8-4012-8def-123456789012'

const VALID_ORDER_BODY = { addressId: ADDR_ID, deliverySlotId: SLOT_ID, paymentMethod: 'cod' }

const SLOT = {
  id: SLOT_ID, date: '2027-01-01', startTime: '09:00', endTime: '12:00',
  label: 'Morning', maxOrders: 50, currentOrders: 5, isActive: true,
}

const ORDER = {
  id: ORDER_ID, orderNumber: 'OT-270101-001', status: 'confirmed', total: 8000,
  userId: 'user-1', items: [],
}

const mockOrdersService = {
  create: jest.fn(),
  findOne: jest.fn(),
  findByUser: jest.fn(),
  cancel: jest.fn(),
  getAvailableSlots: jest.fn(),
}

async function buildApp(guard: any) {
  const module = await Test.createTestingModule({
    controllers: [OrdersController],
    providers: [{ provide: OrdersService, useValue: mockOrdersService }],
  })
    .overrideGuard(JwtAuthGuard)
    .useValue(guard)
    .compile()

  const app = module.createNestApplication()
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }))
  await app.init()
  return app
}

describe('Orders (integration)', () => {
  let authedApp: INestApplication
  let anonApp: INestApplication

  beforeAll(async () => {
    authedApp = await buildApp(authedGuard)
    anonApp = await buildApp(anonGuard)
  })

  afterAll(async () => {
    await authedApp.close()
    await anonApp.close()
  })

  beforeEach(() => jest.resetAllMocks())

  // ── Authentication guard ───────────────────────────────────────────────

  describe('unauthenticated requests', () => {
    it('GET /orders returns 403 without valid JWT', async () => {
      await request(anonApp.getHttpServer()).get('/orders').expect(403)
    })

    it('POST /orders returns 403 without valid JWT', async () => {
      await request(anonApp.getHttpServer())
        .post('/orders')
        .send(VALID_ORDER_BODY)
        .expect(403)
    })
  })

  // ── GET /orders/slots ──────────────────────────────────────────────────

  describe('GET /orders/slots', () => {
    it('returns 200 with available delivery slots', async () => {
      mockOrdersService.getAvailableSlots.mockResolvedValueOnce([SLOT])

      const res = await request(authedApp.getHttpServer())
        .get('/orders/slots')
        .expect(200)

      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body[0].id).toBe(SLOT_ID)
    })
  })

  // ── GET /orders ────────────────────────────────────────────────────────

  describe('GET /orders', () => {
    it('returns 200 with orders for the authenticated user', async () => {
      mockOrdersService.findByUser.mockResolvedValueOnce([ORDER])

      const res = await request(authedApp.getHttpServer())
        .get('/orders')
        .expect(200)

      expect(Array.isArray(res.body)).toBe(true)
      expect(mockOrdersService.findByUser).toHaveBeenCalledWith('user-1')
    })
  })

  // ── POST /orders ───────────────────────────────────────────────────────

  describe('POST /orders', () => {
    it('returns 400 when addressId is not a UUID', async () => {
      await request(authedApp.getHttpServer())
        .post('/orders')
        .send({ ...VALID_ORDER_BODY, addressId: 'not-a-uuid' })
        .expect(400)
    })

    it('returns 400 when deliverySlotId is not a UUID', async () => {
      await request(authedApp.getHttpServer())
        .post('/orders')
        .send({ ...VALID_ORDER_BODY, deliverySlotId: 'not-a-uuid' })
        .expect(400)
    })

    it('returns 400 when paymentMethod is not a valid enum value', async () => {
      await request(authedApp.getHttpServer())
        .post('/orders')
        .send({ ...VALID_ORDER_BODY, paymentMethod: 'bitcoin' })
        .expect(400)
    })

    it('returns 400 when required fields are missing', async () => {
      await request(authedApp.getHttpServer()).post('/orders').send({}).expect(400)
    })

    it('returns 404 when service throws NotFoundException (address not found)', async () => {
      mockOrdersService.create.mockRejectedValueOnce(new NotFoundException('Address not found'))

      await request(authedApp.getHttpServer())
        .post('/orders')
        .send(VALID_ORDER_BODY)
        .expect(404)
    })

    it('returns 400 when service throws BadRequestException (slot full)', async () => {
      mockOrdersService.create.mockRejectedValueOnce(new BadRequestException('Delivery slot is full'))

      await request(authedApp.getHttpServer())
        .post('/orders')
        .send(VALID_ORDER_BODY)
        .expect(400)
    })

    it('returns 201 and calls service with user id from JWT', async () => {
      mockOrdersService.create.mockResolvedValueOnce({ order: ORDER, isCod: true })

      const res = await request(authedApp.getHttpServer())
        .post('/orders')
        .send(VALID_ORDER_BODY)
        .expect(201)

      expect(res.body.isCod).toBe(true)
      expect(mockOrdersService.create).toHaveBeenCalledWith('user-1', expect.objectContaining(VALID_ORDER_BODY))
    })
  })

  // ── GET /orders/:id ────────────────────────────────────────────────────

  describe('GET /orders/:id', () => {
    it('returns 400 for a non-UUID id (ParseUUIDPipe rejects)', async () => {
      await request(authedApp.getHttpServer()).get('/orders/not-a-uuid').expect(400)
    })

    it('returns 404 when order does not exist', async () => {
      mockOrdersService.findOne.mockRejectedValueOnce(new NotFoundException('Order not found'))

      await request(authedApp.getHttpServer())
        .get(`/orders/${ORDER_ID}`)
        .expect(404)
    })

    it('returns 200 with order and items', async () => {
      mockOrdersService.findOne.mockResolvedValueOnce(ORDER)

      const res = await request(authedApp.getHttpServer())
        .get(`/orders/${ORDER_ID}`)
        .expect(200)

      expect(res.body.id).toBe(ORDER_ID)
      expect(mockOrdersService.findOne).toHaveBeenCalledWith(ORDER_ID, 'user-1')
    })
  })

  // ── PATCH /orders/:id/cancel ───────────────────────────────────────────

  describe('PATCH /orders/:id/cancel', () => {
    it('returns 404 when order does not exist', async () => {
      mockOrdersService.cancel.mockRejectedValueOnce(new NotFoundException('Order not found'))

      await request(authedApp.getHttpServer())
        .patch(`/orders/${ORDER_ID}/cancel`)
        .expect(404)
    })

    it('returns 400 when order cannot be cancelled (wrong status)', async () => {
      mockOrdersService.cancel.mockRejectedValueOnce(
        new BadRequestException('Order cannot be cancelled at this stage'),
      )

      await request(authedApp.getHttpServer())
        .patch(`/orders/${ORDER_ID}/cancel`)
        .expect(400)
    })

    it('returns 200 when order is successfully cancelled', async () => {
      mockOrdersService.cancel.mockResolvedValueOnce({ success: true })

      const res = await request(authedApp.getHttpServer())
        .patch(`/orders/${ORDER_ID}/cancel`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(mockOrdersService.cancel).toHaveBeenCalledWith(ORDER_ID, 'user-1')
    })
  })
})
