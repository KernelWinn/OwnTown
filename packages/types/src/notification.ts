export type NotificationType =
  | 'order_confirmed'
  | 'order_packed'
  | 'order_shipped'
  | 'order_out_for_delivery'
  | 'order_delivered'
  | 'order_cancelled'
  | 'payment_failed'
  | 'low_stock_alert'     // Admin only

export interface PushNotificationPayload {
  title: string
  body: string
  data?: Record<string, string>
  imageUrl?: string
}

export interface SmsPayload {
  phone: string
  message: string
}
