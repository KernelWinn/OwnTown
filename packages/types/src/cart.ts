export interface CartItem {
  productId: string
  name: string
  imageUrl: string
  price: number           // current price in paise
  mrp: number
  unit: string
  quantity: number
  totalPrice: number      // price * quantity
}

export interface Cart {
  userId: string
  items: CartItem[]
  itemCount: number
  subtotal: number        // sum of item prices in paise
  updatedAt: string
}

export interface AddToCartDto {
  productId: string
  quantity: number
}

export interface UpdateCartItemDto {
  productId: string
  quantity: number        // 0 to remove
}
