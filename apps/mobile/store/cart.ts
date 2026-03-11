import { create } from 'zustand'
import type { CartItem } from '@owntown/types'

interface CartState {
  items: CartItem[]
  itemCount: number
  total: number
  addItem: (item: Omit<CartItem, 'quantity' | 'totalPrice'>) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
}

function calcTotals(items: CartItem[]) {
  return {
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    total: items.reduce((sum, i) => sum + i.totalPrice, 0),
  }
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  itemCount: 0,
  total: 0,

  addItem: (product) => {
    const items = [...get().items]
    const existing = items.find(i => i.productId === product.productId)
    if (existing) {
      existing.quantity += 1
      existing.totalPrice = existing.price * existing.quantity
    } else {
      items.push({ ...product, quantity: 1, totalPrice: product.price })
    }
    set({ items, ...calcTotals(items) })
  },

  removeItem: (productId) => {
    const items = get().items.filter(i => i.productId !== productId)
    set({ items, ...calcTotals(items) })
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId)
      return
    }
    const items = get().items.map(i =>
      i.productId === productId
        ? { ...i, quantity, totalPrice: i.price * quantity }
        : i,
    )
    set({ items, ...calcTotals(items) })
  },

  clearCart: () => set({ items: [], itemCount: 0, total: 0 }),
}))
