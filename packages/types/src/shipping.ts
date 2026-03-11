export type ShipmentStatus =
  | 'created'
  | 'pickup_scheduled'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'delivery_failed'
  | 'rto_initiated'       // Return to Origin
  | 'rto_delivered'

export interface ServiceabilityCheck {
  pincode: string
  isServiceable: boolean
  estimatedDays?: number
  couriers?: string[]
}

export interface CreateShipmentDto {
  orderId: string
  courierCode?: string    // optional — Shiprocket auto-selects if not provided
}

export interface Shipment {
  id: string
  orderId: string
  shiprocketShipmentId: string
  awbNumber: string
  courierName: string
  trackingUrl: string
  status: ShipmentStatus
  estimatedDelivery?: string
  createdAt: string
  updatedAt: string
}

export interface ShiprocketWebhookPayload {
  awb: string
  current_status: string
  shipment_id: string
  order_id: string
  etd?: string
}
