'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { procurementApi, productsApi } from '@/lib/api-helpers'
import { formatPrice } from '@owntown/utils'
import type { Supplier, Product } from '@owntown/types'

interface LineItem {
  productId: string
  productName: string
  sku: string
  gstRate: number
  orderedQty: number
  unitCost: number   // paise
}

interface Props {
  onClose: () => void
  onSuccess: () => void
}

export default function CreatePoModal({ onClose, onSuccess }: Props) {
  const [step, setStep] = useState<'details' | 'items'>('details')
  const [supplierId, setSupplierId] = useState('')
  const [expectedDate, setExpectedDate] = useState('')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<LineItem[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ['suppliers'],
    queryFn: procurementApi.listSuppliers,
  })

  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ['admin-products'],
    queryFn: () => productsApi.list({ limit: 200 }),
  })

  const filteredProducts = allProducts.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(productSearch.toLowerCase()),
  ).slice(0, 8)

  function addProduct(p: Product) {
    if (lines.find(l => l.productId === p.id)) return
    setLines(prev => [...prev, {
      productId: p.id,
      productName: p.name,
      sku: p.sku,
      gstRate: p.gstRate,
      orderedQty: 1,
      unitCost: p.price,   // default to selling price as starting point
    }])
    setProductSearch('')
  }

  function updateLine(idx: number, field: 'orderedQty' | 'unitCost', value: number) {
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l))
  }

  function removeLine(idx: number) {
    setLines(prev => prev.filter((_, i) => i !== idx))
  }

  const subtotal = lines.reduce((s, l) => s + l.unitCost * l.orderedQty, 0)
  const totalGst = lines.reduce((s, l) => s + Math.round(l.unitCost * l.orderedQty * l.gstRate / 100), 0)
  const total = subtotal + totalGst

  async function handleSubmit() {
    if (!supplierId) return toast.error('Select a supplier')
    if (lines.length === 0) return toast.error('Add at least one product')
    setLoading(true)
    try {
      await procurementApi.createPo({
        supplierId,
        expectedDate: expectedDate || undefined,
        notes: notes || undefined,
        items: lines.map(l => ({
          productId: l.productId,
          orderedQty: l.orderedQty,
          unitCost: l.unitCost,
        })),
      })
      toast.success('Purchase order created')
      onSuccess()
    } catch {
      toast.error('Failed to create purchase order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-[#1A1A1A]">New Purchase Order</h2>
            <p className="text-xs text-gray-400 mt-0.5">Step {step === 'details' ? '1' : '2'} of 2</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === 'details' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Supplier *</label>
                <select className="field-input" value={supplierId} onChange={e => setSupplierId(e.target.value)}>
                  <option value="">Select supplier…</option>
                  {suppliers.filter(s => s.isActive).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Expected Delivery Date</label>
                <input type="date" className="field-input" value={expectedDate} onChange={e => setExpectedDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Notes</label>
                <textarea className="field-input resize-none" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Internal notes for this order…" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Product search */}
              <div className="relative">
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Add Products</label>
                <input
                  className="field-input"
                  placeholder="Search by name or SKU…"
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                />
                {productSearch && filteredProducts.length > 0 && (
                  <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {filteredProducts.map(p => (
                      <button
                        key={p.id}
                        onClick={() => addProduct(p)}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="font-medium truncate">{p.name}</span>
                        <span className="text-gray-400 text-xs shrink-0">{p.sku}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Line items */}
              {lines.length > 0 ? (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-24">Qty</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-32">Unit Cost (₹)</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-28">Total</th>
                        <th className="w-8" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {lines.map((l, i) => (
                        <tr key={l.productId}>
                          <td className="px-4 py-3">
                            <p className="font-medium text-[#1A1A1A] truncate max-w-[180px]">{l.productName}</p>
                            <p className="text-xs text-gray-400">{l.sku}</p>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number" min={1}
                              className="field-input text-right py-1.5 w-20 ml-auto"
                              value={l.orderedQty}
                              onChange={e => updateLine(i, 'orderedQty', Math.max(1, parseInt(e.target.value) || 1))}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number" min={1}
                              className="field-input text-right py-1.5 w-28 ml-auto"
                              value={l.unitCost / 100}
                              onChange={e => updateLine(i, 'unitCost', Math.round((parseFloat(e.target.value) || 0) * 100))}
                            />
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            {formatPrice(l.unitCost * l.orderedQty)}
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => removeLine(i)} className="p-1 text-gray-300 hover:text-red-500 transition">
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="bg-gray-50 px-4 py-3 flex justify-end gap-6 text-sm border-t border-gray-200">
                    <span className="text-gray-500">Subtotal: <span className="font-semibold text-[#1A1A1A]">{formatPrice(subtotal)}</span></span>
                    <span className="text-gray-500">GST: <span className="font-semibold text-[#1A1A1A]">{formatPrice(totalGst)}</span></span>
                    <span className="text-gray-500">Total: <span className="font-bold text-[#1A1A1A]">{formatPrice(total)}</span></span>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400 text-sm">
                  Search and add products above
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 flex-shrink-0">
          {step === 'items' ? (
            <button onClick={() => setStep('details')} className="text-sm font-medium text-gray-500 hover:text-[#1A1A1A] transition">
              ← Back
            </button>
          ) : <span />}
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition">
              Cancel
            </button>
            {step === 'details' ? (
              <button
                onClick={() => { if (!supplierId) return toast.error('Select a supplier'); setStep('items') }}
                className="px-5 py-2 bg-[#1A1A1A] text-white text-sm font-semibold rounded-lg hover:bg-[#2A2A2A] transition"
              >
                Next: Add Items →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading || lines.length === 0}
                className="px-5 py-2 bg-[#1A1A1A] text-white text-sm font-semibold rounded-lg hover:bg-[#2A2A2A] disabled:opacity-50 transition"
              >
                {loading ? 'Creating…' : 'Create PO'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
