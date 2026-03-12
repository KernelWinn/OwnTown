import { Test } from '@nestjs/testing'
import { NotFoundException, BadRequestException } from '@nestjs/common'
import { getQueueToken } from '@nestjs/bullmq'
import { OrdersService } from './orders.service'
import { CartService } from '../cart/cart.service'
import { ProductsService } from '../products/products.service'
import { CouponsService } from '../coupons/coupons.service'
import { DB } from '../database/database.module'
import { NOTIFICATION_QUEUE } from '../notification/notification.module'

const ADDRESS = {
  id: 'addr-1', userId: 'user-1', name: 'Ravi', phone: '9999999999',
  line1: '12 MG Road', city: 'Mumbai', state: 'MH', pincode: '400001',
}

const SLOT = {
  id: 'slot-1', date: '2026-03-20', startTime: '09:00', endTime: '12:00',
  label: 'Morning', maxOrders: 50, currentOrders: 5, isActive: true,
}

const CART_RESULT = {
  items: [
    { productId: 'prod-1', name: 'Tomato', unit: '1 kg', imageUrl: null, price: 4000, mrp: 5000, quantity: 2, totalPrice: 8000 },
  ],
  subtotal: 8000,
}

const mockDb = {
  select: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  from: jest.fn(),
  where: jest.fn(),
  limit: jest.fn(),
  orderBy: jest.fn(),
  values: jest.fn(),
  set: jest.fn(),
  returning: jest.fn(),
}

const mockCart = { validate: jest.fn(), clear: jest.fn() }
const mockProducts = { decrementStock: jest.fn() }
const mockCoupons = { validate: jest.fn(), incrementUsage: jest.fn() }
const mockQueue = { add: jest.fn() }

describe('OrdersService', () => {
  let service: OrdersService

  beforeEach(async () => {
    jest.resetAllMocks()
    // Chainable
    mockDb.select.mockReturnThis()
    mockDb.insert.mockReturnThis()
    mockDb.update.mockReturnThis()
    mockDb.delete.mockReturnThis()
    mockDb.from.mockReturnThis()
    mockDb.orderBy.mockReturnThis()
    mockDb.values.mockReturnThis()
    mockDb.set.mockReturnThis()
    // Terminal (default empty)
    mockDb.where.mockResolvedValue([])
    mockDb.limit.mockResolvedValue([])
    mockDb.returning.mockResolvedValue([])

    const module = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: DB, useValue: mockDb },
        { provide: CartService, useValue: mockCart },
        { provide: ProductsService, useValue: mockProducts },
        { provide: CouponsService, useValue: mockCoupons },
        { provide: getQueueToken(NOTIFICATION_QUEUE), useValue: mockQueue },
      ],
    }).compile()
    service = module.get(OrdersService)
  })

  describe('create', () => {
    const dto = { addressId: 'addr-1', deliverySlotId: 'slot-1', paymentMethod: 'cod' }

    it('throws NotFoundException when address not found', async () => {
      // where default returns [] — address not found
      await expect(service.create('user-1', dto as any)).rejects.toThrow(NotFoundException)
    })

    it('throws BadRequestException when slot is full', async () => {
      const fullSlot = { ...SLOT, currentOrders: 50, maxOrders: 50 }
      mockDb.where
        .mockResolvedValueOnce([ADDRESS])
        .mockResolvedValueOnce([fullSlot])
      mockCart.validate.mockResolvedValueOnce(CART_RESULT)

      await expect(service.create('user-1', dto as any)).rejects.toThrow(BadRequestException)
    })

    it('creates COD order with confirmed status', async () => {
      const createdOrder = {
        id: 'order-1', orderNumber: 'OT-240320-001', status: 'confirmed', total: 8000,
        userId: 'user-1',
      }
      mockDb.where
        .mockResolvedValueOnce([ADDRESS])       // address
        .mockResolvedValueOnce([SLOT])          // slot
        .mockResolvedValueOnce([])              // update deliverySlots.where
        .mockResolvedValueOnce([createdOrder])  // findOne: order
        // findOne: items → default []
      mockDb.returning.mockResolvedValueOnce([createdOrder])
      // limit: default [] for getNextSequence
      mockCart.validate.mockResolvedValueOnce(CART_RESULT)
      mockProducts.decrementStock.mockResolvedValue(undefined)

      const result = await service.create('user-1', dto as any)
      expect(result.isCod).toBe(true)
      expect(mockCart.clear).toHaveBeenCalledWith('user-1')
    })

    it('applies coupon discount when couponCode provided', async () => {
      const dtoWithCoupon = { ...dto, couponCode: 'SAVE10' }
      const couponResult = { couponId: 'coupon-1', code: 'SAVE10', discount: 800 }
      const returnedOrder = {
        id: 'order-1', orderNumber: 'OT-240320-001', status: 'confirmed', total: 7200, userId: 'user-1',
      }

      mockDb.where
        .mockResolvedValueOnce([ADDRESS])        // address
        .mockResolvedValueOnce([SLOT])           // slot
        .mockResolvedValueOnce([])               // update deliverySlots.where
        .mockResolvedValueOnce([returnedOrder])  // findOne: order
        // findOne: items → default []
      mockDb.returning.mockResolvedValueOnce([returnedOrder])
      mockCart.validate.mockResolvedValueOnce(CART_RESULT)
      mockCoupons.validate.mockResolvedValueOnce(couponResult)

      await service.create('user-1', dtoWithCoupon as any)
      expect(mockCoupons.validate).toHaveBeenCalledWith('SAVE10', 8000)
      expect(mockCoupons.incrementUsage).toHaveBeenCalledWith('coupon-1')
    })
  })

  describe('updateStatus', () => {
    it('updates status in DB and enqueues notification job', async () => {
      await service.updateStatus('order-1', 'packed')
      expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({ status: 'packed' }))
      expect(mockQueue.add).toHaveBeenCalledWith('order-status-changed', { orderId: 'order-1', status: 'packed' })
    })
  })

  describe('cancel', () => {
    it('throws NotFoundException when order not found', async () => {
      // where default [] → no order found
      await expect(service.cancel('missing', 'user-1')).rejects.toThrow(NotFoundException)
    })

    it('throws BadRequestException when order is already shipped', async () => {
      mockDb.where.mockResolvedValueOnce([{ id: 'order-1', status: 'shipped', userId: 'user-1' }])
      await expect(service.cancel('order-1', 'user-1')).rejects.toThrow(BadRequestException)
    })

    it('cancels a pending order', async () => {
      mockDb.where
        .mockResolvedValueOnce([{ id: 'order-1', status: 'pending', userId: 'user-1' }])
        // items query → default []
        // update where → default []

      const result = await service.cancel('order-1', 'user-1')
      expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({ status: 'cancelled' }))
      expect(result.success).toBe(true)
    })
  })
})
