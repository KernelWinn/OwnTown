import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient, RedisClientType } from 'redis'
import { ProductsService } from '../products/products.service'
import type { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto'

export interface CartItem {
  productId: string
  name: string
  imageUrl: string
  price: number       // paise
  mrp: number
  unit: string
  quantity: number
  totalPrice: number
}

export interface Cart {
  userId: string
  items: CartItem[]
  itemCount: number
  subtotal: number
}

const CART_TTL = 60 * 60 * 24 * 7   // 7 days

@Injectable()
export class CartService {
  private redis: RedisClientType

  constructor(
    private readonly config: ConfigService,
    private readonly productsService: ProductsService,
  ) {
    this.redis = createClient({ url: config.get('REDIS_URL', 'redis://localhost:6379') }) as RedisClientType
    this.redis.connect().catch(console.error)
  }

  async get(userId: string): Promise<Cart> {
    const raw = await this.redis.get(this.key(userId))
    const items: CartItem[] = raw ? JSON.parse(raw) : []
    return this.buildCart(userId, items)
  }

  async add(userId: string, dto: AddToCartDto): Promise<Cart> {
    const product = await this.productsService.findOne(dto.productId)
    if (!product.isActive) throw new BadRequestException('Product is not available')
    if (product.stockQuantity < dto.quantity) {
      throw new BadRequestException(`Only ${product.stockQuantity} units available`)
    }

    const items = await this.getItems(userId)
    const existing = items.find(i => i.productId === dto.productId)

    if (existing) {
      const newQty = existing.quantity + dto.quantity
      if (product.stockQuantity < newQty) {
        throw new BadRequestException(`Only ${product.stockQuantity} units available`)
      }
      existing.quantity = newQty
      existing.totalPrice = existing.price * newQty
    } else {
      items.push({
        productId: product.id,
        name: product.name,
        imageUrl: product.images?.[0] ?? '',
        price: product.price,
        mrp: product.mrp,
        unit: product.unit,
        quantity: dto.quantity,
        totalPrice: product.price * dto.quantity,
      })
    }

    await this.saveItems(userId, items)
    return this.buildCart(userId, items)
  }

  async update(userId: string, dto: UpdateCartItemDto): Promise<Cart> {
    const items = await this.getItems(userId)
    const idx = items.findIndex(i => i.productId === dto.productId)

    if (idx === -1) throw new NotFoundException('Item not in cart')

    if (dto.quantity === 0) {
      items.splice(idx, 1)
    } else {
      const product = await this.productsService.findOne(dto.productId)
      if (product.stockQuantity < dto.quantity) {
        throw new BadRequestException(`Only ${product.stockQuantity} units available`)
      }
      items[idx].quantity = dto.quantity
      items[idx].totalPrice = items[idx].price * dto.quantity
    }

    await this.saveItems(userId, items)
    return this.buildCart(userId, items)
  }

  async remove(userId: string, productId: string): Promise<Cart> {
    const items = await this.getItems(userId)
    const filtered = items.filter(i => i.productId !== productId)
    await this.saveItems(userId, filtered)
    return this.buildCart(userId, filtered)
  }

  async clear(userId: string): Promise<void> {
    await this.redis.del(this.key(userId))
  }

  /** Validate cart stock before order placement — returns validated items */
  async validate(userId: string): Promise<{ items: CartItem[]; subtotal: number }> {
    const cart = await this.get(userId)
    if (cart.items.length === 0) throw new BadRequestException('Cart is empty')

    const validated: CartItem[] = []

    for (const item of cart.items) {
      const product = await this.productsService.findOne(item.productId)
      if (!product.isActive) {
        throw new BadRequestException(`"${item.name}" is no longer available`)
      }
      if (product.stockQuantity < item.quantity) {
        throw new BadRequestException(
          `"${item.name}" has only ${product.stockQuantity} units available`,
        )
      }
      // Refresh price from DB (price may have changed since added to cart)
      validated.push({
        ...item,
        price: product.price,
        mrp: product.mrp,
        totalPrice: product.price * item.quantity,
      })
    }

    const subtotal = validated.reduce((s, i) => s + i.totalPrice, 0)
    return { items: validated, subtotal }
  }

  private async getItems(userId: string): Promise<CartItem[]> {
    const raw = await this.redis.get(this.key(userId))
    return raw ? JSON.parse(raw) : []
  }

  private async saveItems(userId: string, items: CartItem[]): Promise<void> {
    await this.redis.setEx(this.key(userId), CART_TTL, JSON.stringify(items))
  }

  private buildCart(userId: string, items: CartItem[]): Cart {
    return {
      userId,
      items,
      itemCount: items.reduce((s, i) => s + i.quantity, 0),
      subtotal: items.reduce((s, i) => s + i.totalPrice, 0),
    }
  }

  private key(userId: string): string {
    return `cart:${userId}`
  }
}
