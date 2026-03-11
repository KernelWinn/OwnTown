import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { eq, ilike, and, lte } from 'drizzle-orm'
import { DB } from '../database/database.module'
import { products, categories } from '../database/schema'

@Injectable()
export class ProductsService {
  constructor(@Inject(DB) private readonly db: any) {}

  async findAll({ featured, limit }: { featured?: boolean; limit: number }) {
    const where = featured
      ? and(eq(products.isActive, true), eq(products.isFeatured, true))
      : eq(products.isActive, true)
    return this.db.select().from(products).where(where).limit(limit)
  }

  async getCategories() {
    return this.db.select().from(categories).where(eq(categories.isActive, true))
      .orderBy(categories.sortOrder)
  }

  async findOne(id: string) {
    const [product] = await this.db.select().from(products).where(eq(products.id, id))
    if (!product) throw new NotFoundException('Product not found')
    return product
  }

  async search(query: string) {
    return this.db.select().from(products)
      .where(and(eq(products.isActive, true), ilike(products.name, `%${query}%`)))
      .limit(20)
  }

  async findLowStock() {
    return this.db.select().from(products)
      .where(and(eq(products.isActive, true), lte(products.stockQuantity, products.lowStockThreshold)))
  }

  async decrementStock(productId: string, quantity: number) {
    const [product] = await this.db.select().from(products).where(eq(products.id, productId))
    if (!product) throw new NotFoundException('Product not found')
    await this.db.update(products)
      .set({ stockQuantity: product.stockQuantity - quantity, updatedAt: new Date() })
      .where(eq(products.id, productId))
  }
}
