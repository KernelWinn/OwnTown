'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Package, AlertTriangle, Search } from 'lucide-react'
import { toast } from 'sonner'
import { productsApi } from '@/lib/api-helpers'
import { formatPrice } from '@owntown/utils'
import { ProductFormModal } from '@/components/products/ProductFormModal'
import type { Product } from '@owntown/types'

export default function ProductsPage() {
  const qc = useQueryClient()
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => productsApi.list({ limit: 100 }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] })
      toast.success('Product deleted')
    },
    onError: () => toast.error('Failed to delete product'),
  })

  function openEdit(product: Product) {
    setEditProduct(product)
    setShowForm(true)
  }

  function openCreate() {
    setEditProduct(null)
    setShowForm(true)
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Products</h1>
          <p className="text-sm text-gray-500 mt-0.5">{products.length} total products</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10 focus:border-[#1A1A1A] bg-white w-52"
            />
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-[#1A1A1A] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-black/80 transition"
          >
            <Plus size={16} />
            Add Product
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-gray-400">Loading products...</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">SKU</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Price</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stock</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(product => (
                <tr key={product.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover bg-gray-100"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Package size={16} className="text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-[#1A1A1A]">{product.name}</p>
                        <p className="text-gray-400 text-xs">{product.unit}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-500 font-mono text-xs">{product.sku}</td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-[#1A1A1A]">{formatPrice(product.price)}</p>
                    {product.mrp > product.price && (
                      <p className="text-gray-400 text-xs line-through">{formatPrice(product.mrp)}</p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`flex items-center gap-1 text-sm font-medium ${
                      product.stockQuantity <= product.lowStockThreshold
                        ? 'text-amber-600'
                        : 'text-gray-700'
                    }`}>
                      {product.stockQuantity <= product.lowStockThreshold && (
                        <AlertTriangle size={13} />
                      )}
                      {product.stockQuantity}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                      product.isActive
                        ? 'bg-[#E6F9ED] text-[#00843C]'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(product)}
                        className="p-2 text-gray-400 hover:text-[#1A1A1A] hover:bg-gray-100 rounded-lg transition"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${product.name}"?`)) {
                            deleteMutation.mutate(product.id)
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-gray-400">
                    {search ? 'No products match your search.' : 'No products yet. Add your first product.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <ProductFormModal
          product={editProduct}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false)
            qc.invalidateQueries({ queryKey: ['admin-products'] })
          }}
        />
      )}
    </div>
  )
}
