export type OrderStatus =
  | 'pending'           // Placed, awaiting payment
  | 'payment_failed'    // Payment failed
  | 'confirmed'         // Payment received
  | 'packed'            // Admin packed the order
  | 'shipped'           // Handed to courier
  | 'out_for_delivery'  // Courier out for delivery
  | 'delivered'         // Delivered to customer
  | 'cancelled'         // Cancelled (by customer or admin)
  | 'returned'          // Return initiated

export type PaymentMethod = 'upi' | 'card' | 'wallet' | 'netbanking' | 'cod'

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export interface DeliverySlot {
  id: string
  date: string            // ISO date string
  startTime: string       // "09:00"
  endTime: string         // "12:00"
  label: string           // "Morning (9AM–12PM)"
  isAvailable: boolean
  maxOrders: number
  currentOrders: number
}

export interface OrderItem {
  id?: string
  productId: string
  name: string
  unit: string
  imageUrl: string
  price: number           // selling price at time of order (paise)
  mrp: number
  costPrice: number       // purchase cost at time of order (paise) — for gross margin
  quantity: number
  totalPrice: number
  gstRate: number
  gstAmount: number
}

export interface OrderAddress {
  name: string
  phone: string
  line1: string
  line2?: string
  landmark?: string
  city: string
  state: string
  pincode: string
}

export interface Order {
  id: string
  orderNumber: string     // Human-readable: OT-20240312-001
  userId: string
  items: OrderItem[]
  address: OrderAddress
  deliverySlotId: string
  deliverySlot?: DeliverySlot
  status: OrderStatus
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  razorpayOrderId?: string
  razorpayPaymentId?: string
  subtotal: number        // paise
  deliveryFee: number     // paise
  totalGst: number        // paise
  discount: number        // paise
  total: number           // paise
  notes?: string
  shipmentId?: string
  awbNumber?: string      // Shiprocket AWB
  trackingUrl?: string
  estimatedDelivery?: string
  createdAt: string
  updatedAt: string
}

export interface CreateOrderDto {
  addressId: string
  deliverySlotId: string
  paymentMethod: PaymentMethod
  notes?: string
}

export interface OrderSummary {
  items: OrderItem[]
  address: OrderAddress
  deliverySlot: DeliverySlot
  subtotal: number
  deliveryFee: number
  totalGst: number
  discount: number
  total: number
}
