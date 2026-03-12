import { Test } from '@nestjs/testing'
import { NotFoundException, ConflictException } from '@nestjs/common'
import { ProductsService } from './products.service'
import { DB } from '../database/database.module'

const mockDb = {
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockResolvedValue([]),
  limit: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  returning: jest.fn().mockResolvedValue([]),
}

const PRODUCT = {
  id: 'prod-1',
  name: 'Tomato',
  slug: 'tomato',
  sku: 'TOM-001',
  price: 4000,
  mrp: 5000,
  unit: '1 kg',
  stockQuantity: 100,
  lowStockThreshold: 10,
  images: ['https://example.com/tomato.jpg'],
  isActive: true,
}

describe('ProductsService', () => {
  let service: ProductsService

  beforeEach(async () => {
    jest.clearAllMocks()
    const module = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: DB, useValue: mockDb },
      ],
    }).compile()
    service = module.get(ProductsService)
  })

  describe('findOne', () => {
    it('returns product when found', async () => {
      mockDb.where.mockResolvedValueOnce([PRODUCT])
      const result = await service.findOne('prod-1')
      expect(result).toEqual(PRODUCT)
    })

    it('throws NotFoundException when product not found', async () => {
      mockDb.where.mockResolvedValueOnce([])
      await expect(service.findOne('missing-id')).rejects.toThrow(NotFoundException)
    })
  })

  describe('create', () => {
    const dto = {
      name: 'Onion',
      sku: 'ONI-001',
      price: 3000,
      mrp: 4000,
      unit: '1 kg',
      stockQuantity: 50,
      categoryId: 'cat-1',
      gstCategory: 'exempt',
    }

    it('throws ConflictException when SKU already exists', async () => {
      // uniqueSlug check → no existing slug; SKU check → existing product
      mockDb.where
        .mockResolvedValueOnce([])           // slug check
        .mockResolvedValueOnce([PRODUCT])    // SKU check

      await expect(service.create(dto as any)).rejects.toThrow(ConflictException)
    })

    it('creates product with correct gstRate for exempt category', async () => {
      const newProduct = { id: 'prod-2', ...dto, slug: 'onion', gstRate: 0 }
      mockDb.where
        .mockResolvedValueOnce([])   // slug check
        .mockResolvedValueOnce([])   // SKU check
      mockDb.returning.mockResolvedValueOnce([newProduct])

      const result = await service.create(dto as any)
      expect(result.gstRate).toBe(0)
      expect(result.id).toBe('prod-2')
    })
  })

  describe('remove', () => {
    it('soft-deletes by setting isActive=false', async () => {
      mockDb.where
        .mockResolvedValueOnce([PRODUCT])  // findOne
        .mockReturnThis()                  // update where
      await service.remove('prod-1')
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false }),
      )
    })
  })

  describe('updateStock', () => {
    it('throws NotFoundException when product does not exist', async () => {
      mockDb.where.mockResolvedValueOnce([])
      await expect(service.updateStock('missing', 50)).rejects.toThrow(NotFoundException)
    })

    it('updates stockQuantity', async () => {
      const updated = { ...PRODUCT, stockQuantity: 200 }
      mockDb.where.mockResolvedValueOnce([PRODUCT])
      mockDb.returning.mockResolvedValueOnce([updated])

      const result = await service.updateStock('prod-1', 200)
      expect(result.stockQuantity).toBe(200)
    })
  })

  describe('decrementStock', () => {
    it('reduces stockQuantity by quantity', async () => {
      mockDb.where.mockResolvedValueOnce([PRODUCT])

      await service.decrementStock('prod-1', 5)
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({ stockQuantity: PRODUCT.stockQuantity - 5 }),
      )
    })
  })
})
