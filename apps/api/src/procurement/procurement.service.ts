import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { eq, and, sql, count } from 'drizzle-orm'
import { DB } from '../database/database.module'
import {
  suppliers, purchaseOrders, purchaseOrderItems, goodsReceivedNotes, products,
} from '../database/schema'
import { CreateSupplierDto } from './dto/create-supplier.dto'
import { CreatePoDto } from './dto/create-po.dto'
import { UpdatePoStatusDto } from './dto/update-po-status.dto'
import { CreateGrnDto } from './dto/create-grn.dto'

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft:     ['sent', 'cancelled'],
  sent:      ['confirmed', 'cancelled'],
  confirmed: ['partial', 'received', 'cancelled'],
  partial:   ['partial', 'received', 'cancelled'],
  received:  [],
  cancelled: [],
}

@Injectable()
export class ProcurementService {
  constructor(@Inject(DB) private readonly db: any) {}

  // ─── Suppliers ────────────────────────────────────────────────────────────

  listSuppliers() {
    return this.db
      .select()
      .from(suppliers)
      .orderBy(suppliers.name)
  }

  async getSupplier(id: string) {
    const [s] = await this.db.select().from(suppliers).where(eq(suppliers.id, id))
    if (!s) throw new NotFoundException('Supplier not found')
    return s
  }

  async createSupplier(dto: CreateSupplierDto) {
    const [created] = await this.db.insert(suppliers).values(dto).returning()
    return created
  }

  async updateSupplier(id: string, dto: Partial<CreateSupplierDto>) {
    await this.getSupplier(id)
    const [updated] = await this.db
      .update(suppliers)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(suppliers.id, id))
      .returning()
    return updated
  }

  async removeSupplier(id: string) {
    await this.getSupplier(id)
    await this.db
      .update(suppliers)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(suppliers.id, id))
    return { success: true }
  }

  // ─── Purchase Orders ──────────────────────────────────────────────────────

  async listPurchaseOrders() {
    const pos = await this.db
      .select({
        po: purchaseOrders,
        supplier: { id: suppliers.id, name: suppliers.name, phone: suppliers.phone },
      })
      .from(purchaseOrders)
      .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
      .orderBy(sql`${purchaseOrders.createdAt} DESC`)

    return pos.map(({ po, supplier }: any) => ({ ...po, supplier }))
  }

  async getPurchaseOrder(id: string) {
    const [row] = await this.db
      .select({
        po: purchaseOrders,
        supplier: suppliers,
      })
      .from(purchaseOrders)
      .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
      .where(eq(purchaseOrders.id, id))

    if (!row) throw new NotFoundException('Purchase order not found')

    const items = await this.db
      .select()
      .from(purchaseOrderItems)
      .where(eq(purchaseOrderItems.purchaseOrderId, id))

    return { ...row.po, supplier: row.supplier, items }
  }

  async createPurchaseOrder(dto: CreatePoDto, createdBy?: string) {
    await this.getSupplier(dto.supplierId)

    // Generate PO number: PO-YYYY-NNNN
    const [{ value }] = await this.db
      .select({ value: count() })
      .from(purchaseOrders)
    const seq = String(Number(value) + 1).padStart(4, '0')
    const year = new Date().getFullYear()
    const poNumber = `PO-${year}-${seq}`

    // Fetch product details for each item
    const enrichedItems = await Promise.all(
      dto.items.map(async (item) => {
        const [product] = await this.db
          .select()
          .from(products)
          .where(eq(products.id, item.productId))
        if (!product) throw new NotFoundException(`Product ${item.productId} not found`)

        const gstAmount = Math.round(item.unitCost * item.orderedQty * product.gstRate / 100)
        const totalCost = item.unitCost * item.orderedQty + gstAmount

        return {
          productId: item.productId,
          productName: product.name,
          sku: product.sku,
          orderedQty: item.orderedQty,
          receivedQty: 0,
          unitCost: item.unitCost,
          gstRate: product.gstRate,
          gstAmount,
          totalCost,
        }
      }),
    )

    const subtotal = enrichedItems.reduce((s, i) => s + i.unitCost * i.orderedQty, 0)
    const totalGst = enrichedItems.reduce((s, i) => s + i.gstAmount, 0)
    const total = subtotal + totalGst

    const [po] = await this.db
      .insert(purchaseOrders)
      .values({
        poNumber,
        supplierId: dto.supplierId,
        createdBy: createdBy ?? null,
        expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : null,
        notes: dto.notes ?? null,
        subtotal,
        totalGst,
        total,
      })
      .returning()

    await this.db.insert(purchaseOrderItems).values(
      enrichedItems.map((i) => ({ ...i, purchaseOrderId: po.id })),
    )

    return this.getPurchaseOrder(po.id)
  }

  async updatePoStatus(id: string, dto: UpdatePoStatusDto) {
    const po = await this.getPurchaseOrder(id)
    const allowed = VALID_TRANSITIONS[po.status] ?? []
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from "${po.status}" to "${dto.status}"`,
      )
    }
    const [updated] = await this.db
      .update(purchaseOrders)
      .set({ status: dto.status, updatedAt: new Date() })
      .where(eq(purchaseOrders.id, id))
      .returning()
    return updated
  }

  async deletePurchaseOrder(id: string) {
    const po = await this.getPurchaseOrder(id)
    if (po.status !== 'draft') {
      throw new BadRequestException('Only draft purchase orders can be deleted')
    }
    await this.db.delete(purchaseOrders).where(eq(purchaseOrders.id, id))
    return { success: true }
  }

  // ─── Goods Received Notes ─────────────────────────────────────────────────

  async listGrns(purchaseOrderId?: string) {
    const query = this.db
      .select()
      .from(goodsReceivedNotes)
      .orderBy(sql`${goodsReceivedNotes.createdAt} DESC`)

    if (purchaseOrderId) {
      return query.where(eq(goodsReceivedNotes.purchaseOrderId, purchaseOrderId))
    }
    return query
  }

  async getGrn(id: string) {
    const [grn] = await this.db
      .select()
      .from(goodsReceivedNotes)
      .where(eq(goodsReceivedNotes.id, id))
    if (!grn) throw new NotFoundException('GRN not found')
    return grn
  }

  async createGrn(dto: CreateGrnDto, receivedBy?: string) {
    const po = await this.getPurchaseOrder(dto.purchaseOrderId)

    if (['received', 'cancelled'].includes(po.status)) {
      throw new BadRequestException(`Cannot receive goods for a ${po.status} PO`)
    }

    // Validate all PO item IDs belong to this PO
    const poItemIds = new Set(po.items.map((i: any) => i.id))
    for (const line of dto.lines) {
      if (!poItemIds.has(line.purchaseOrderItemId)) {
        throw new BadRequestException(
          `Item ${line.purchaseOrderItemId} does not belong to this PO`,
        )
      }
    }

    // Generate GRN number
    const [{ value }] = await this.db
      .select({ value: count() })
      .from(goodsReceivedNotes)
    const seq = String(Number(value) + 1).padStart(4, '0')
    const year = new Date().getFullYear()
    const grnNumber = `GRN-${year}-${seq}`

    // Build line item snapshot
    const lineItems = dto.lines.map((line) => {
      const poItem = po.items.find((i: any) => i.id === line.purchaseOrderItemId)
      const gstAmount = Math.round(line.unitCost * line.receivedQty * poItem.gstRate / 100)
      return {
        purchaseOrderItemId: line.purchaseOrderItemId,
        productId: poItem.productId,
        productName: poItem.productName,
        sku: poItem.sku,
        orderedQty: poItem.orderedQty,
        receivedQty: line.receivedQty,
        unitCost: line.unitCost,
        gstRate: poItem.gstRate,
        gstAmount,
      }
    })

    const totalReceived = lineItems.reduce(
      (s: number, l: any) => s + l.unitCost * l.receivedQty + l.gstAmount, 0,
    )

    // Atomic transaction: insert GRN + increment stock + update PO items + update PO status
    await this.db.transaction(async (tx: any) => {
      // 1. Insert GRN
      await tx.insert(goodsReceivedNotes).values({
        grnNumber,
        purchaseOrderId: dto.purchaseOrderId,
        receivedBy: receivedBy ?? null,
        lineItems,
        invoiceNumber: dto.invoiceNumber ?? null,
        invoiceDate: dto.invoiceDate ? new Date(dto.invoiceDate) : null,
        totalReceived,
        notes: dto.notes ?? null,
      })

      // 2. Increment stock + update received qty per item
      for (const line of dto.lines) {
        if (line.receivedQty === 0) continue
        const poItem = po.items.find((i: any) => i.id === line.purchaseOrderItemId)

        await tx
          .update(products)
          .set({
            stockQuantity: sql`stock_quantity + ${line.receivedQty}`,
            updatedAt: new Date(),
          })
          .where(eq(products.id, poItem.productId))

        await tx
          .update(purchaseOrderItems)
          .set({ receivedQty: sql`received_qty + ${line.receivedQty}` })
          .where(eq(purchaseOrderItems.id, line.purchaseOrderItemId))
      }

      // 3. Recalculate PO status
      const updatedItems = await tx
        .select()
        .from(purchaseOrderItems)
        .where(eq(purchaseOrderItems.purchaseOrderId, dto.purchaseOrderId))

      const allReceived = updatedItems.every(
        (i: any) => i.receivedQty >= i.orderedQty,
      )
      const anyReceived = updatedItems.some((i: any) => i.receivedQty > 0)
      const newStatus = allReceived ? 'received' : anyReceived ? 'partial' : po.status

      await tx
        .update(purchaseOrders)
        .set({ status: newStatus, updatedAt: new Date() })
        .where(eq(purchaseOrders.id, dto.purchaseOrderId))
    })

    return this.getGrn(
      await this.db
        .select({ id: goodsReceivedNotes.id })
        .from(goodsReceivedNotes)
        .where(eq(goodsReceivedNotes.grnNumber, grnNumber))
        .then((rows: any[]) => rows[0].id),
    )
  }
}
