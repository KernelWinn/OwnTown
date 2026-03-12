import { Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { eq } from 'drizzle-orm'
import axios from 'axios'
import { DB } from '../database/database.module'
import { shipments, orders } from '../database/schema'
import { mapShiprocketStatus } from '@owntown/utils'
import { OrdersService } from '../orders/orders.service'

const SHIPROCKET_API = 'https://apiv2.shiprocket.in/v1/external'

@Injectable()
export class ShippingService {
  private readonly logger = new Logger(ShippingService.name)
  private shiprocketToken: string | null = null

  constructor(
    @Inject(DB) private readonly db: any,
    private readonly config: ConfigService,
    private readonly ordersService: OrdersService,
  ) {}

  async checkServiceability(pincode: string) {
    const token = await this.getToken()
    try {
      const { data } = await axios.get(`${SHIPROCKET_API}/courier/serviceability/`, {
        params: { pickup_postcode: this.config.get('WAREHOUSE_PINCODE'), delivery_postcode: pincode, weight: 1 },
        headers: { Authorization: `Bearer ${token}` },
      })
      const couriers = data.data?.available_courier_companies ?? []
      return {
        pincode,
        isServiceable: couriers.length > 0,
        estimatedDays: couriers[0]?.estimated_delivery_days,
        couriers: couriers.map((c: any) => c.courier_name),
      }
    } catch {
      return { pincode, isServiceable: false }
    }
  }

  async createShipment(orderId: string) {
    const token = await this.getToken()
    const [order] = await this.db.select().from(orders).where(eq(orders.id, orderId))
    if (!order) return

    // Create shipment in Shiprocket
    const { data } = await axios.post(
      `${SHIPROCKET_API}/orders/create/adhoc`,
      this.buildShiprocketPayload(order),
      { headers: { Authorization: `Bearer ${token}` } },
    )

    await this.db.insert(shipments).values({
      orderId,
      shiprocketShipmentId: String(data.shipment_id),
      shiprocketOrderId: String(data.order_id),
      awbNumber: data.awb_code,
      courierName: data.courier_name,
      trackingUrl: `https://shiprocket.co/tracking/${data.awb_code}`,
      status: 'created',
    })

    // Update order with AWB
    await this.db.update(orders)
      .set({ awbNumber: data.awb_code, trackingUrl: `https://shiprocket.co/tracking/${data.awb_code}`, updatedAt: new Date() })
      .where(eq(orders.id, orderId))

    this.logger.log(`Shipment created for order ${orderId}: AWB ${data.awb_code}`)
    return data
  }

  async generateLabel(orderId: string): Promise<{ labelUrl: string }> {
    const [shipment] = await this.db
      .select()
      .from(shipments)
      .where(eq(shipments.orderId, orderId))

    if (!shipment) throw new Error('Shipment not found for this order')

    // Return cached label if already generated
    if (shipment.labelUrl) return { labelUrl: shipment.labelUrl }

    const token = await this.getToken()
    const { data } = await axios.post(
      `${SHIPROCKET_API}/courier/generate/label`,
      { shipment_id: [shipment.shiprocketShipmentId] },
      { headers: { Authorization: `Bearer ${token}` } },
    )

    const labelUrl: string = data.label_url
    await this.db
      .update(shipments)
      .set({ labelUrl, updatedAt: new Date() })
      .where(eq(shipments.orderId, orderId))

    this.logger.log(`Label generated for order ${orderId}: ${labelUrl}`)
    return { labelUrl }
  }

  async handleWebhook(payload: any) {
    const awb = payload.awb
    const newStatus = mapShiprocketStatus(payload.current_status)
    this.logger.log(`Shiprocket webhook: AWB ${awb} → ${newStatus}`)

    const [shipment] = await this.db.select().from(shipments).where(eq(shipments.awbNumber, awb))
    if (!shipment) return

    await this.db.update(shipments)
      .set({ status: newStatus as any, updatedAt: new Date() })
      .where(eq(shipments.awbNumber, awb))

    // Map shipment status to order status
    const orderStatusMap: Record<string, string> = {
      'picked_up': 'shipped',
      'out_for_delivery': 'out_for_delivery',
      'delivered': 'delivered',
    }
    if (orderStatusMap[newStatus]) {
      await this.ordersService.updateStatus(shipment.orderId, orderStatusMap[newStatus])
    }

    return { received: true }
  }

  private async getToken(): Promise<string> {
    if (this.shiprocketToken) return this.shiprocketToken
    const { data } = await axios.post(`${SHIPROCKET_API}/auth/login`, {
      email: this.config.getOrThrow('SHIPROCKET_EMAIL'),
      password: this.config.getOrThrow('SHIPROCKET_PASSWORD'),
    })
    this.shiprocketToken = data.token
    return data.token
  }

  private buildShiprocketPayload(order: any) {
    const addr = order.address
    return {
      order_id: order.orderNumber,
      order_date: order.createdAt,
      pickup_location: 'Primary',
      billing_customer_name: addr.name,
      billing_phone: addr.phone,
      billing_address: addr.line1,
      billing_city: addr.city,
      billing_state: addr.state,
      billing_country: 'India',
      billing_pincode: addr.pincode,
      shipping_is_billing: true,
      payment_method: order.paymentMethod === 'cod' ? 'COD' : 'Prepaid',
      sub_total: order.subtotal / 100,
      length: 20, breadth: 15, height: 10, weight: 1,
      order_items: [],  // populated from order items
    }
  }
}
