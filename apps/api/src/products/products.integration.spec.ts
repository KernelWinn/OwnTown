/**
 * Products integration tests — public endpoints (no auth required).
 * Mocks ProductsService to focus on HTTP routing, ValidationPipe, and
 * ParseUUIDPipe behaviour.
 */
import request = require('supertest')
import { Test } from '@nestjs/testing'
import { INestApplication, NotFoundException, ValidationPipe } from '@nestjs/common'
import { ProductsController } from './products.controller'
import { ProductsService } from './products.service'

const PRODUCT_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

const PRODUCT = {
  id: PRODUCT_ID,
  name: 'Tomato',
  slug: 'tomato',
  price: 4000,
  mrp: 5000,
  unit: '1 kg',
  stockQuantity: 100,
  isActive: true,
}

const CATEGORY = { id: 'c1b2c3d4-e5f6-7890-abcd-ef1234567890', name: 'Vegetables', slug: 'vegetables' }

const mockProductsService = {
  findAll: jest.fn(),
  getCategories: jest.fn(),
  search: jest.fn(),
  findOne: jest.fn(),
}

describe('Products (integration)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [{ provide: ProductsService, useValue: mockProductsService }],
    }).compile()

    app = module.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
    await app.init()
  })

  afterAll(() => app.close())

  beforeEach(() => jest.resetAllMocks())

  // ── GET /products ──────────────────────────────────────────────────────

  describe('GET /products', () => {
    it('returns 200 with product list', async () => {
      mockProductsService.findAll.mockResolvedValueOnce([PRODUCT])

      const res = await request(app.getHttpServer())
        .get('/products')
        .expect(200)

      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body[0].name).toBe('Tomato')
      expect(mockProductsService.findAll).toHaveBeenCalledWith({ featured: false, limit: 20 })
    })

    it('returns 200 with empty array when no products', async () => {
      mockProductsService.findAll.mockResolvedValueOnce([])

      const res = await request(app.getHttpServer()).get('/products').expect(200)
      expect(res.body).toEqual([])
    })

    it('passes the limit query param to the service', async () => {
      mockProductsService.findAll.mockResolvedValueOnce([])

      await request(app.getHttpServer()).get('/products?limit=5').expect(200)
      expect(mockProductsService.findAll).toHaveBeenCalledWith({ featured: false, limit: 5 })
    })
  })

  // ── GET /products/categories ───────────────────────────────────────────

  describe('GET /products/categories', () => {
    it('returns 200 with categories list', async () => {
      mockProductsService.getCategories.mockResolvedValueOnce([CATEGORY])

      const res = await request(app.getHttpServer()).get('/products/categories').expect(200)
      expect(Array.isArray(res.body)).toBe(true)
    })
  })

  // ── GET /products/search ───────────────────────────────────────────────

  describe('GET /products/search', () => {
    it('returns 200 with matching products', async () => {
      mockProductsService.search.mockResolvedValueOnce([PRODUCT])

      const res = await request(app.getHttpServer())
        .get('/products/search?q=tomato')
        .expect(200)

      expect(res.body[0].name).toBe('Tomato')
      expect(mockProductsService.search).toHaveBeenCalledWith('tomato')
    })

    it('returns 200 with empty array when no matches', async () => {
      mockProductsService.search.mockResolvedValueOnce([])

      const res = await request(app.getHttpServer())
        .get('/products/search?q=xyznotfound')
        .expect(200)

      expect(res.body).toEqual([])
    })
  })

  // ── GET /products/:id ──────────────────────────────────────────────────

  describe('GET /products/:id', () => {
    it('returns 200 with product for a valid UUID', async () => {
      mockProductsService.findOne.mockResolvedValueOnce(PRODUCT)

      const res = await request(app.getHttpServer())
        .get(`/products/${PRODUCT_ID}`)
        .expect(200)

      expect(res.body.id).toBe(PRODUCT_ID)
    })

    it('returns 404 when product does not exist', async () => {
      mockProductsService.findOne.mockRejectedValueOnce(new NotFoundException())

      await request(app.getHttpServer())
        .get(`/products/${PRODUCT_ID}`)
        .expect(404)
    })

    it('returns 400 for a non-UUID id (ParseUUIDPipe rejects)', async () => {
      await request(app.getHttpServer())
        .get('/products/not-a-uuid')
        .expect(400)
    })
  })
})
