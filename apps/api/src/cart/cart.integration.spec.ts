/**
 * Cart integration tests — JWT-protected endpoints.
 * Uses an overridden JwtAuthGuard that injects a fixed user.
 * Tests ValidationPipe for DTOs and service delegation.
 */
import request = require('supertest')
import { Test } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { CartController } from './cart.controller'
import { CartService } from './cart.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

const TEST_USER = { id: 'user-1', phone: '9876543210' }

// Guard that always injects TEST_USER into the request
const authedGuard = {
  canActivate: (ctx: any) => {
    ctx.switchToHttp().getRequest().user = TEST_USER
    return true
  },
}

const anonGuard = {
  canActivate: () => false,
}

const CART = {
  userId: 'user-1',
  items: [
    { productId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', name: 'Tomato', price: 4000, quantity: 2, totalPrice: 8000 },
  ],
  itemCount: 1,
  subtotal: 8000,
}

const mockCartService = {
  get: jest.fn(),
  add: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  clear: jest.fn(),
  validate: jest.fn(),
}

async function buildApp(guard: any) {
  const module = await Test.createTestingModule({
    controllers: [CartController],
    providers: [
      { provide: CartService, useValue: mockCartService },
    ],
  })
    .overrideGuard(JwtAuthGuard)
    .useValue(guard)
    .compile()

  const app = module.createNestApplication()
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }))
  await app.init()
  return app
}

describe('Cart (integration)', () => {
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
    it('GET /cart returns 403 without valid JWT', async () => {
      await request(anonApp.getHttpServer()).get('/cart').expect(403)
    })

    it('POST /cart/items returns 403 without valid JWT', async () => {
      await request(anonApp.getHttpServer())
        .post('/cart/items')
        .send({ productId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', quantity: 1 })
        .expect(403)
    })
  })

  // ── GET /cart ──────────────────────────────────────────────────────────

  describe('GET /cart', () => {
    it('returns 200 with cart contents', async () => {
      mockCartService.get.mockResolvedValueOnce(CART)

      const res = await request(authedApp.getHttpServer())
        .get('/cart')
        .expect(200)

      expect(res.body.userId).toBe('user-1')
      expect(res.body.items).toHaveLength(1)
      expect(mockCartService.get).toHaveBeenCalledWith('user-1')
    })
  })

  // ── POST /cart/items ───────────────────────────────────────────────────

  describe('POST /cart/items', () => {
    const validProductId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

    it('returns 201 when item is added successfully', async () => {
      mockCartService.add.mockResolvedValueOnce(CART)

      await request(authedApp.getHttpServer())
        .post('/cart/items')
        .send({ productId: validProductId, quantity: 2 })
        .expect(201)

      expect(mockCartService.add).toHaveBeenCalledWith('user-1', { productId: validProductId, quantity: 2 })
    })

    it('returns 400 when productId is not a UUID', async () => {
      await request(authedApp.getHttpServer())
        .post('/cart/items')
        .send({ productId: 'not-a-uuid', quantity: 1 })
        .expect(400)
    })

    it('returns 400 when quantity is less than 1', async () => {
      await request(authedApp.getHttpServer())
        .post('/cart/items')
        .send({ productId: validProductId, quantity: 0 })
        .expect(400)
    })

    it('returns 400 when productId is missing', async () => {
      await request(authedApp.getHttpServer())
        .post('/cart/items')
        .send({ quantity: 1 })
        .expect(400)
    })
  })

  // ── PATCH /cart/items ──────────────────────────────────────────────────

  describe('PATCH /cart/items', () => {
    it('returns 200 when quantity is updated', async () => {
      mockCartService.update.mockResolvedValueOnce(CART)

      await request(authedApp.getHttpServer())
        .patch('/cart/items')
        .send({ productId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', quantity: 3 })
        .expect(200)

      expect(mockCartService.update).toHaveBeenCalledWith(
        'user-1',
        { productId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', quantity: 3 },
      )
    })

    it('returns 400 when productId is missing', async () => {
      await request(authedApp.getHttpServer())
        .patch('/cart/items')
        .send({ quantity: 1 })
        .expect(400)
    })
  })

  // ── DELETE /cart/items/:productId ─────────────────────────────────────

  describe('DELETE /cart/items/:productId', () => {
    it('returns 200 when item is removed', async () => {
      mockCartService.remove.mockResolvedValueOnce({ success: true })

      await request(authedApp.getHttpServer())
        .delete('/cart/items/a1b2c3d4-e5f6-7890-abcd-ef1234567890')
        .expect(200)

      expect(mockCartService.remove).toHaveBeenCalledWith('user-1', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')
    })

    it('returns 400 for non-UUID productId', async () => {
      await request(authedApp.getHttpServer())
        .delete('/cart/items/not-a-uuid')
        .expect(400)
    })
  })

  // ── DELETE /cart ───────────────────────────────────────────────────────

  describe('DELETE /cart', () => {
    it('returns 200 and clears the cart', async () => {
      mockCartService.clear.mockResolvedValueOnce({ success: true })

      await request(authedApp.getHttpServer())
        .delete('/cart')
        .expect(200)

      expect(mockCartService.clear).toHaveBeenCalledWith('user-1')
    })
  })
})
