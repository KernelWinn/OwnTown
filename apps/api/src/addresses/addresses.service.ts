import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { eq, and } from 'drizzle-orm'
import { DB } from '../database/database.module'
import { addresses } from '../database/schema'
import { CreateAddressDto } from './dto/create-address.dto'
import type { UpdateAddressDto } from './dto/update-address.dto'

@Injectable()
export class AddressesService {
  constructor(@Inject(DB) private readonly db: any) {}

  async findAll(userId: string) {
    return this.db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, userId))
      .orderBy(addresses.isDefault, addresses.createdAt)
  }

  async findOne(id: string, userId: string) {
    const [address] = await this.db
      .select()
      .from(addresses)
      .where(and(eq(addresses.id, id), eq(addresses.userId, userId)))
    if (!address) throw new NotFoundException('Address not found')
    return address
  }

  async create(userId: string, dto: CreateAddressDto) {
    // If this is first address or isDefault requested, clear existing defaults first
    if (dto.isDefault) {
      await this.clearDefault(userId)
    } else {
      // Auto-set default if user has no addresses yet
      const existing = await this.findAll(userId)
      if (existing.length === 0) dto.isDefault = true
    }

    const [created] = await this.db
      .insert(addresses)
      .values({
        userId,
        label: dto.label,
        name: dto.name,
        phone: dto.phone,
        line1: dto.line1,
        line2: dto.line2,
        landmark: dto.landmark,
        city: dto.city,
        state: dto.state,
        pincode: dto.pincode,
        isDefault: dto.isDefault ?? false,
        latitude: dto.latitude,
        longitude: dto.longitude,
      })
      .returning()

    return created
  }

  async update(id: string, userId: string, dto: UpdateAddressDto) {
    await this.findOne(id, userId)

    if ((dto as CreateAddressDto).isDefault) {
      await this.clearDefault(userId)
    }

    const [updated] = await this.db
      .update(addresses)
      .set({ ...dto, updatedAt: new Date() })
      .where(and(eq(addresses.id, id), eq(addresses.userId, userId)))
      .returning()

    return updated
  }

  async remove(id: string, userId: string) {
    const address = await this.findOne(id, userId)

    await this.db
      .delete(addresses)
      .where(and(eq(addresses.id, id), eq(addresses.userId, userId)))

    // If deleted address was default, set the next one as default
    if (address.isDefault) {
      const remaining = await this.findAll(userId)
      if (remaining.length > 0) {
        await this.db
          .update(addresses)
          .set({ isDefault: true, updatedAt: new Date() })
          .where(eq(addresses.id, remaining[0].id))
      }
    }

    return { success: true }
  }

  async setDefault(id: string, userId: string) {
    await this.findOne(id, userId)
    await this.clearDefault(userId)
    const [updated] = await this.db
      .update(addresses)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(and(eq(addresses.id, id), eq(addresses.userId, userId)))
      .returning()
    return updated
  }

  private async clearDefault(userId: string) {
    await this.db
      .update(addresses)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(and(eq(addresses.userId, userId), eq(addresses.isDefault, true)))
  }
}
