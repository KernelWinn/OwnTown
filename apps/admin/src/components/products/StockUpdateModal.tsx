'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { productsApi } from '@/lib/api-helpers'
import type { Product } from '@owntown/types'

interface Props {
  product: Product
  onClose: () => void
  onSuccess: () => void
}

export function StockUpdateModal({ product, onClose, onSuccess }: Props) {
  const [stock, setStock] = useState(product.stockQuantity)

  const mutation = useMutation({
    mutationFn: () => productsApi.updateStock(product.id, stock),
    onSuccess: () => {
      toast.success('Stock updated')
      onSuccess()
    },
    onError: () => toast.error('Failed to update stock'),
  })

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-[#1A1A1A]">Update Stock</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-md transition">
            <X size={16} className="text-gray-500" />
          </button>
        </div>
        <p className="text-sm text-gray-500">{product.name} — {product.unit}</p>
        <div>
          <label className="field-label">New Stock Quantity</label>
          <input
            type="number"
            min={0}
            value={stock}
            onChange={e => setStock(Number(e.target.value))}
            className="field-input"
            autoFocus
          />
          {stock <= product.lowStockThreshold && (
            <p className="text-amber-600 text-xs mt-1">
              Below low-stock threshold ({product.lowStockThreshold})
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="flex-1 bg-[#1A1A1A] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[#2A2A2A] disabled:opacity-50 transition"
          >
            {mutation.isPending ? 'Saving…' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  )
}
