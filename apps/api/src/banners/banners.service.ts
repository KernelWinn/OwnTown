import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { eq, asc } from 'drizzle-orm'
import { DB } from '../database/database.module'
import { banners } from '../database/schema'

@Injectable()
export class BannersService {
  constructor(@Inject(DB) private readonly db: any) {}

  async findActive() {
    return this.db
      .select()
      .from(banners)
      .where(eq(banners.isActive, true))
      .orderBy(asc(banners.sortOrder), asc(banners.createdAt))
  }

  async findAll() {
    return this.db.select().from(banners).orderBy(asc(banners.sortOrder))
  }

  async create(dto: {
    title: string
    subtitle?: string
    imageUrl: string
    deepLink?: string
    sortOrder?: number
  }) {
    const [banner] = await this.db.insert(banners).values(dto).returning()
    return banner
  }

  async update(id: string, dto: Partial<{
    title: string
    subtitle: string | null
    imageUrl: string
    deepLink: string | null
    sortOrder: number
    isActive: boolean
  }>) {
    const [banner] = await this.db
      .update(banners)
      .set(dto)
      .where(eq(banners.id, id))
      .returning()
    if (!banner) throw new NotFoundException('Banner not found')
    return banner
  }

  async delete(id: string) {
    await this.db.delete(banners).where(eq(banners.id, id))
    return { success: true }
  }
}
