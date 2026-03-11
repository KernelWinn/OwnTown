export interface RazorpayOrder {
  id: string
  amount: number          // paise
  currency: string        // "INR"
  receipt: string
}

export interface PaymentVerifyDto {
  razorpayOrderId: string
  razorpayPaymentId: string
  razorpaySignature: string
  orderId: string
}

export interface RazorpayWebhookPayload {
  event: string
  payload: {
    payment?: {
      entity: {
        id: string
        order_id: string
        status: string
        amount: number
        method: string
      }
    }
  }
}
