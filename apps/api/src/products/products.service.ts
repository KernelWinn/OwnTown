import { Inject, Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { eq, and, sql } from 'drizzle-orm'
import { DB } from '../database/database.module'
import { products, categories, productVariants, searchEvents } from '../database/schema'
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

  async search(query: string, userId?: string) {
    const q = query.trim()
    if (!q) return this.findAll({ limit: 40 })

    // Custom scored search:
    //   text_score   × 10  — full-text rank on name + description + tags
    //   prefix_boost × 5   — name starts with query (exact-prefix match)
    //   popularity   × 3   — capped global order count signal
    //   behavior     × 4   — personal: click/cart/purchase history (user-specific)
    //   featured     × 2   — editorial boost
    //   in_stock     × 1.5 — available products rank higher
    //   discount     × 1   — has a price reduction
    const rows = await this.db.execute(sql`
      WITH
        text_rank AS (
          SELECT id,
            ts_rank(
              to_tsvector('english',
                ${products.name} || ' ' ||
                COALESCE(${products.description}, '') || ' ' ||
                array_to_string(${products.tags}, ' ')
              ),
              plainto_tsquery('english', ${q})
            ) AS rank
          FROM products
          WHERE is_active = true
        ),
        popularity AS (
          SELECT product_id, COUNT(*)::float AS order_count
          FROM order_items
          GROUP BY product_id
        ),
        behavior AS (
          SELECT product_id,
            SUM(
              CASE event_type
                WHEN 'purchase'      THEN 4
                WHEN 'add_to_cart'   THEN 2
                WHEN 'search_click'  THEN 1
                ELSE 0
              END
            )::float AS score
          FROM search_events
          WHERE user_id = ${userId ?? null}
          GROUP BY product_id
        )
      SELECT p.*,
        (
          COALESCE(tr.rank, 0) * 10.0
          + CASE WHEN p.name ILIKE ${q + '%'} THEN 5.0 ELSE 0 END
          + LEAST(COALESCE(pop.order_count, 0) * 0.1, 3.0)
          + LEAST(COALESCE(beh.score, 0) * 0.5, 4.0)
          + CASE WHEN p.is_featured  THEN 2.0  ELSE 0 END
          + CASE WHEN p.stock_quantity > p.low_stock_threshold THEN 1.5 ELSE 0 END
          + CASE WHEN p.mrp > p.price THEN 1.0  ELSE 0 END
        ) AS _score
      FROM products p
      LEFT JOIN text_rank  tr  ON tr.id            = p.id
      LEFT JOIN popularity pop ON pop.product_id   = p.id
      LEFT JOIN behavior   beh ON beh.product_id   = p.id
      WHERE p.is_active = true
        AND (
          tr.rank > 0
          OR p.name ILIKE ${'%' + q + '%'}
        )
      ORDER BY _score DESC
      LIMIT 40
    `)

    // strip internal _score from response
    const resultRows: any[] = (rows as any).rows ?? rows
    return resultRows.map(({ _score, ...rest }) => rest)
  }

  async recordSearchEvent(
    productId: string,
    eventType: 'search_click' | 'add_to_cart' | 'purchase',
    userId?: string,
    query?: string,
  ) {
    await this.db.insert(searchEvents).values({
      productId,
      eventType,
      userId: userId ?? null,
      query: query ?? null,
    })
    return { ok: true }
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
