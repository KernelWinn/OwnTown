import { Inject, Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { eq } from 'drizzle-orm'
import axios, { AxiosError } from 'axios'
import { DB } from '../database/database.module'
import { shipments, orders, orderItems } from '../database/schema'
import { mapShiprocketStatus } from '@owntown/utils'
import { OrdersService } from '../orders/orders.service'

const SHIPROCKET_API = 'https://apiv2.shiprocket.in/v1/external'

@Injectable()
export class ShippingService {
  private readonly logger = new Logger(ShippingService.name)
  private shiprocketToken: string | null = null
  private tokenExpiresAt: number = 0   // unix ms

  constructor(
    @Inject(DB) private readonly db: any,
    private readonly config: ConfigService,
    private readonly ordersService: OrdersService,
  ) {}

  // ─── Serviceability ─────────────────────────────────────────────────────────

  async checkServiceability(pincode: string) {
    const token = await this.getToken()
    try {
      const { data } = await axios.get(`${SHIPROCKET_API}/courier/serviceability/`, {
        params: {
          pickup_postcode: this.config.get('WAREHOUSE_PINCODE'),
          delivery_postcode: pincode,
          weight: 1,
          cod: 0,
        },
        headers: { Authorization: `Bearer ${token}` },
      })
      const couriers = data.data?.available_courier_companies ?? []
      return {
        pincode,
        isServiceable: couriers.length > 0,
        estimatedDays: couriers[0]?.estimated_delivery_days ?? null,
        couriers: couriers.map((c: any) => ({
          id: c.courier_company_id,
          name: c.courier_name,
          etd: c.etd,
          rate: c.rate,
        })),
      }
    } catch {
      return { pincode, isServiceable: false, couriers: [] }
    }
  }

  // ─── Create Shipment ─────────────────────────────────────────────────────────

  async createShipment(orderId: string) {
    // Guard: already has a shipment
    const [existing] = await this.db.select().from(shipments).where(eq(shipments.orderId, orderId))
    if (existing) {
      throw new BadRequestException('Shipment already exists for this order')
    }

    const [order] = await this.db.select().from(orders).where(eq(orders.id, orderId))
    if (!order) throw new NotFoundException('Order not found')

    // Fetch order items for the payload
    const items = await this.db.select().from(orderItems).where(eq(orderItems.orderId, orderId))

    const token = await this.getToken()

    // Step 1: Create order on Shiprocket
    let createData: any
    try {
      const { data } = await axios.post(
        `${SHIPROCKET_API}/orders/create/adhoc`,
        this.buildShiprocketPayload(order, items),
        { headers: { Authorization: `Bearer ${token}` } },
      )
      createData = data
    } catch (err) {
      const msg = (err as AxiosError<any>).response?.data?.message ?? 'Shiprocket create order failed'
      this.logger.error(`Shiprocket createOrder error: ${JSON.stringify(msg)}`)
      throw new BadRequestException(`Shiprocket error: ${msg}`)
    }

    const shiprocketOrderId = String(createData.order_id)
    const shiprocketShipmentId = String(createData.shipment_id)

    // Step 2: Auto-assign best courier to get AWB
    let awbNumber: string | null = null
    let courierName: string | null = null
    try {
      const { data: assignData } = await axios.post(
        `${SHIPROCKET_API}/courier/assign/awb`,
        { shipment_id: shiprocketShipmentId },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      awbNumber = assignData.response?.data?.awb_code ?? null
      courierName = assignData.response?.data?.courier_name ?? null
    } catch (err) {
      // AWB assignment can fail if pickup not set up yet — store shipment without AWB
      this.logger.warn(`AWB auto-assign failed for shipment ${shiprocketShipmentId}: ${(err as AxiosError).message}`)
    }

    const trackingUrl = awbNumber ? `https://shiprocket.co/tracking/${awbNumber}` : null

    // Persist shipment record
    await this.db.insert(shipments).values({
      orderId,
      shiprocketShipmentId,
      shiprocketOrderId,
      awbNumber,
      courierName,
      trackingUrl,
      status: 'created',
    })

    // Update order with AWB if we got one
    if (awbNumber) {
      await this.db.update(orders)
        .set({ awbNumber, trackingUrl, updatedAt: new Date() })
        .where(eq(orders.id, orderId))
      await this.ordersService.updateStatus(orderId, 'shipped')
    }

    this.logger.log(`Shipment created for order ${orderId} — SR order: ${shiprocketOrderId}, AWB: ${awbNumber ?? 'pending'}`)
    return {
      shiprocketOrderId,
      shiprocketShipmentId,
      awbNumber,
      courierName,
      trackingUrl,
    }
  }

  // ─── Generate Shipping Label ─────────────────────────────────────────────────

  async generateLabel(orderId: string): Promise<{ labelUrl: string }> {
    const [shipment] = await this.db.select().from(shipments).where(eq(shipments.orderId, orderId))
    if (!shipment) throw new NotFoundException('Shipment not found for this order')
    if (!shipment.shiprocketShipmentId) throw new BadRequestException('Shipment has no Shiprocket ID yet')

    if (shipment.labelUrl) return { labelUrl: shipment.labelUrl }

    const token = await this.getToken()
    const { data } = await axios.post(
      `${SHIPROCKET_API}/courier/generate/label`,
      { shipment_id: [shipment.shiprocketShipmentId] },
      { headers: { Authorization: `Bearer ${token}` } },
    )

    const labelUrl: string = data.label_url
    if (!labelUrl) throw new BadRequestException('Label not ready yet — try again in a moment')

    await this.db.update(shipments)
      .set({ labelUrl, updatedAt: new Date() })
      .where(eq(shipments.orderId, orderId))

    this.logger.log(`Label generated for order ${orderId}: ${labelUrl}`)
    return { labelUrl }
  }

  // ─── Cancel Shipment ─────────────────────────────────────────────────────────

  async cancelShipment(orderId: string) {
    const [shipment] = await this.db.select().from(shipments).where(eq(shipments.orderId, orderId))
    if (!shipment) throw new NotFoundException('No shipment found for this order')
    if (!shipment.shiprocketOrderId) throw new BadRequestException('Shipment has no Shiprocket order ID')

    const token = await this.getToken()
    try {
      await axios.post(
        `${SHIPROCKET_API}/orders/cancel`,
        { ids: [shipment.shiprocketOrderId] },
        { headers: { Authorization: `Bearer ${token}` } },
      )
    } catch (err) {
      const msg = (err as AxiosError<any>).response?.data?.message ?? 'Shiprocket cancel failed'
      throw new BadRequestException(`Shiprocket cancel error: ${msg}`)
    }

    await this.db.delete(shipments).where(eq(shipments.orderId, orderId))

    // Revert order status back to confirmed
    await this.ordersService.updateStatus(orderId, 'confirmed')
    // Clear AWB from order
    await this.db.update(orders)
      .set({ awbNumber: null, trackingUrl: null, updatedAt: new Date() })
      .where(eq(orders.id, orderId))

    this.logger.log(`Shipment cancelled for order ${orderId}`)
    return { success: true }
  }

  // ─── Track Shipment ──────────────────────────────────────────────────────────

  async trackShipment(orderId: string) {
    const [shipment] = await this.db.select().from(shipments).where(eq(shipments.orderId, orderId))
    if (!shipment) throw new NotFoundException('No shipment found for this order')
    if (!shipment.awbNumber) return { status: shipment.status, awbNumber: null, activities: [] }

    const token = await this.getToken()
    try {
      const { data } = await axios.get(
        `${SHIPROCKET_API}/courier/track/awb/${shipment.awbNumber}`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      return {
        status: shipment.status,
        awbNumber: shipment.awbNumber,
        courierName: shipment.courierName,
        trackingUrl: shipment.trackingUrl,
        estimatedDelivery: data.tracking_data?.etd ?? null,
        activities: (data.tracking_data?.shipment_track_activities ?? []).map((a: any) => ({
          date: a.date,
          activity: a.activity,
          location: a.location,
        })),
      }
    } catch {
      return {
        status: shipment.status,
        awbNumber: shipment.awbNumber,
        courierName: shipment.courierName,
        trackingUrl: shipment.trackingUrl,
        activities: [],
      }
    }
  }

  // ─── Webhook ─────────────────────────────────────────────────────────────────

  async handleWebhook(payload: any) {
    const awb = payload.awb
    const newStatus = mapShiprocketStatus(payload.current_status)
    this.logger.log(`Shiprocket webhook: AWB ${awb} → ${newStatus}`)

    const [shipment] = await this.db.select().from(shipments).where(eq(shipments.awbNumber, awb))
    if (!shipment) {
      this.logger.warn(`Webhook: no shipment found for AWB ${awb}`)
      return { received: true }
    }

    await this.db.update(shipments)
      .set({ status: newStatus as any, updatedAt: new Date() })
      .where(eq(shipments.awbNumber, awb))

    const orderStatusMap: Record<string, string> = {
      pickup_scheduled: 'confirmed',
      picked_up: 'shipped',
      in_transit: 'shipped',
      out_for_delivery: 'out_for_delivery',
      delivered: 'delivered',
    }
    if (orderStatusMap[newStatus]) {
      await this.ordersService.updateStatus(shipment.orderId, orderStatusMap[newStatus])
    }

    return { received: true }
  }

  // ─── Token (24h expiry) ──────────────────────────────────────────────────────

  private async getToken(): Promise<string> {
    if (this.shiprocketToken && Date.now() < this.tokenExpiresAt) {
      return this.shiprocketToken
    }

    const email = this.config.get('SHIPROCKET_EMAIL')
    const password = this.config.get('SHIPROCKET_PASSWORD')
    if (!email || !password) throw new BadRequestException('Shiprocket credentials not configured')

    const { data } = await axios.post(`${SHIPROCKET_API}/auth/login`, { email, password })
    this.shiprocketToken = data.token
    this.tokenExpiresAt = Date.now() + 23 * 60 * 60 * 1000  // 23h (tokens last 24h)
    this.logger.log('Shiprocket token refreshed')
    return data.token
  }

  // ─── Payload Builder ─────────────────────────────────────────────────────────

  private buildShiprocketPayload(order: any, items: any[]) {
    const addr = order.address ?? {}
    return {
      order_id: order.orderNumber,
      order_date: new Date(order.createdAt).toISOString().split('T')[0],
      pickup_location: 'Primary',
      channel_id: '',
      comment: order.notes ?? '',

      // Billing = Shipping
      billing_customer_name: addr.name ?? '',
      billing_last_name: '',
      billing_address: addr.line1 ?? '',
      billing_address_2: addr.line2 ?? '',
      billing_city: addr.city ?? '',
      billing_pincode: addr.pincode ?? '',
      billing_state: addr.state ?? '',
      billing_country: 'India',
      billing_email: '',
      billing_phone: addr.phone ?? '',
      shipping_is_billing: true,

      payment_method: order.paymentMethod === 'cod' ? 'COD' : 'Prepaid',
      shipping_charges: order.deliveryFee / 100,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: order.discount / 100,
      sub_total: order.subtotal / 100,

      // Package dimensions (defaults — can be improved per product later)
      length: 20,
      breadth: 15,
      height: 10,
      weight: Math.max(0.5, items.reduce((s, i) => s + i.quantity * 0.3, 0)),  // rough 300g/item

      order_items: items.map(i => ({
        name: i.name,
        sku: i.productId.slice(0, 20),
        units: i.quantity,
        selling_price: i.price / 100,
        discount: '',
        tax: i.gstAmount / 100,
        hsn: '',
      })),
    }
  }
}
