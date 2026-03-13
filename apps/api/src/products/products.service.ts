import { Inject, Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { eq, and, sql } from 'drizzle-orm'
import { DB } from '../database/database.module'
import { products, categories, productVariants } from '../database/schema'
import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'
import { CreateCategoryDto } from './dto/create-category.dto'

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

const GST_RATE_MAP: Record<string, number> = {
  exempt: 0, five: 5, twelve: 12, eighteen: 18,
}

export interface CreateVariantDto {
  title: string
  options: Record<string, string>
  price: number
  mrp: number
  sku: string
  barcode?: string
  stockQuantity?: number
  lowStockThreshold?: number
}

@Injectable()
export class ProductsService {
  constructor(@Inject(DB) private readonly db: any) {}

  async findAll({ featured, limit }: { featured?: boolean; limit: number }) {
    const where = featured
      ? and(eq(products.isActive, true), eq(products.isFeatured, true))
      : eq(products.isActive, true)
    return this.db.select().from(products).where(where).limit(limit)
  }

  async findAllAdmin(limit = 50, offset = 0) {
    return this.db.select().from(products).limit(limit).offset(offset)
  }

  async getCategories() {
    return this.db
      .select()
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(categories.sortOrder)
  }

  async getAllCategories() {
    return this.db.select().from(categories).orderBy(categories.sortOrder)
  }

  async findOne(id: string) {
    const [product] = await this.db.select().from(products).where(eq(products.id, id))
    if (!product) throw new NotFoundException('Product not found')
    return product
  }

  async search(query: string) {
    return this.db
      .select()
      .from(products)
      .where(
        and(
          eq(products.isActive, true),
          sql`to_tsvector('english', ${products.name}) @@ plainto_tsquery('english', ${query})`,
        ),
      )
      .limit(20)
  }

  async findLowStock() {
    return this.db
      .select()
      .from(products)
      .where(
        and(
          eq(products.isActive, true),
          sql`${products.stockQuantity} <= ${products.lowStockThreshold}`,
        ),
      )
  }

  async create(dto: CreateProductDto) {
    const slug = await this.uniqueSlug(dto.name)
    const [existing] = await this.db.select().from(products).where(eq(products.sku, dto.sku))
    if (existing) throw new ConflictException(`SKU "${dto.sku}" already exists`)

    const [created] = await this.db
      .insert(products)
      .values({
        name: dto.name,
        slug,
        description: dto.description,
        categoryId: dto.categoryId,
        images: dto.images ?? [],
        price: dto.price,
        mrp: dto.mrp,
        unit: dto.unit,
        stockQuantity: dto.stockQuantity,
        lowStockThreshold: dto.lowStockThreshold ?? 10,
        sku: dto.sku,
        barcode: dto.barcode,
        gstCategory: dto.gstCategory as any,
        gstRate: GST_RATE_MAP[dto.gstCategory] ?? 0,
        isFeatured: dto.isFeatured ?? false,
        tags: dto.tags ?? [],
        optionNames: (dto as any).optionNames ?? [],
      })
      .returning()
    return created
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id)
    const updateData: Record<string, unknown> = { ...dto, updatedAt: new Date() }
    if (dto.name) updateData.slug = await this.uniqueSlug(dto.name, id)
    if (dto.gstCategory) updateData.gstRate = GST_RATE_MAP[dto.gstCategory] ?? 0
    const [updated] = await this.db
      .update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning()
    return updated
  }

  async remove(id: string) {
    await this.findOne(id)
    await this.db.update(products).set({ isActive: false, updatedAt: new Date() }).where(eq(products.id, id))
    return { success: true }
  }

  async updateStock(id: string, stockQuantity: number) {
    await this.findOne(id)
    const [updated] = await this.db
      .update(products)
      .set({ stockQuantity, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning()
    return updated
  }

  async addImages(id: string, imageUrls: string[]) {
    const product = await this.findOne(id)
    const merged = [...(product.images ?? []), ...imageUrls]
    const [updated] = await this.db
      .update(products)
      .set({ images: merged, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning()
    return updated
  }

  async removeImage(id: string, imageUrl: string) {
    const product = await this.findOne(id)
    const filtered = (product.images ?? []).filter((img: string) => img !== imageUrl)
    const [updated] = await this.db
      .update(products)
      .set({ images: filtered, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning()
    return updated
  }

  // ─── Variants ─────────────────────────────────────────────────────────

  async listVariants(productId: string) {
    await this.findOne(productId)
    return this.db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, productId))
      .orderBy(productVariants.createdAt)
  }

  async createVariant(productId: string, dto: CreateVariantDto) {
    await this.findOne(productId)
    const [existing] = await this.db.select().from(productVariants).where(eq(productVariants.sku, dto.sku))
    if (existing) throw new ConflictException(`Variant SKU "${dto.sku}" already exists`)

    const [created] = await this.db
      .insert(productVariants)
      .values({
        productId,
        title: dto.title,
        options: dto.options,
        price: dto.price,
        mrp: dto.mrp,
        sku: dto.sku,
        barcode: dto.barcode,
        stockQuantity: dto.stockQuantity ?? 0,
        lowStockThreshold: dto.lowStockThreshold ?? 10,
      })
      .returning()
    return created
  }

  async updateVariant(productId: string, variantId: string, dto: Partial<CreateVariantDto>) {
    const [variant] = await this.db
      .select()
      .from(productVariants)
      .where(and(eq(productVariants.id, variantId), eq(productVariants.productId, productId)))
    if (!variant) throw new NotFoundException('Variant not found')
    const [updated] = await this.db
      .update(productVariants)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(productVariants.id, variantId))
      .returning()
    return updated
  }

  async deleteVariant(productId: string, variantId: string) {
    const [variant] = await this.db
      .select()
      .from(productVariants)
      .where(and(eq(productVariants.id, variantId), eq(productVariants.productId, productId)))
    if (!variant) throw new NotFoundException('Variant not found')
    await this.db.delete(productVariants).where(eq(productVariants.id, variantId))
    return { success: true }
  }

  // ─── Category CRUD ────────────────────────────────────────────────────

  async createCategory(dto: CreateCategoryDto) {
    const slug = await this.uniqueCategorySlug(dto.name)
    const [created] = await this.db
      .insert(categories)
      .values({ ...dto, slug, sortOrder: dto.sortOrder ?? 0 })
      .returning()
    return created
  }

  async updateCategory(id: string, dto: Partial<CreateCategoryDto>) {
    const updateData: Record<string, unknown> = { ...dto, updatedAt: new Date() }
    if (dto.name) updateData.slug = await this.uniqueCategorySlug(dto.name, id)
    const [updated] = await this.db
      .update(categories)
      .set(updateData)
      .where(eq(categories.id, id))
      .returning()
    if (!updated) throw new NotFoundException('Category not found')
    return updated
  }

  async removeCategory(id: string) {
    await this.db.update(categories).set({ isActive: false, updatedAt: new Date() }).where(eq(categories.id, id))
    return { success: true }
  }

  async decrementStock(productId: string, quantity: number) {
    const product = await this.findOne(productId)
    await this.db
      .update(products)
      .set({ stockQuantity: product.stockQuantity - quantity, updatedAt: new Date() })
      .where(eq(products.id, productId))
  }

  private async uniqueSlug(name: string, excludeId?: string): Promise<string> {
    const base = toSlug(name)
    let slug = base, counter = 1
    while (true) {
      const [existing] = await this.db.select().from(products).where(eq(products.slug, slug))
      if (!existing || existing.id === excludeId) break
      slug = `${base}-${counter++}`
    }
    return slug
  }

  private async uniqueCategorySlug(name: string, excludeId?: string): Promise<string> {
    const base = toSlug(name)
    let slug = base, counter = 1
    while (true) {
      const [existing] = await this.db.select().from(categories).where(eq(categories.slug, slug))
      if (!existing || existing.id === excludeId) break
      slug = `${base}-${counter++}`
    }
    return slug
  }
}
