'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { procurementApi } from '@/lib/api-helpers'
import { formatPrice } from '@owntown/utils'
import type { PurchaseOrder } from '@owntown/types'

interface Props {
  po: PurchaseOrder
  onClose: () => void
  onSuccess: () => void
}

export default function GrnFormModal({ po, onClose, onSuccess }: Props) {
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [invoiceDate, setInvoiceDate] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  // receivedQty per item (keyed by purchaseOrderItemId)
  const [qtys, setQtys] = useState<Record<string, number>>(() =>
    Object.fromEntries((po.items ?? []).map(i => [i.id, i.orderedQty - i.receivedQty]))
  )

  const items = po.items ?? []
  const remaining = items.filter(i => i.orderedQty - i.receivedQty > 0)

  const totalReceived = remaining.reduce((s, i) => {
    const qty = qtys[i.id] ?? 0
    const lineTotal = i.unitCost * qty
    const gst = Math.round(lineTotal * i.gstRate / 100)
    return s + lineTotal + gst
  }, 0)

  async function handleSubmit() {
    const lines = remaining
      .map(i => ({ purchaseOrderItemId: i.id, receivedQty: qtys[i.id] ?? 0, unitCost: i.unitCost }))
      .filter(l => l.receivedQty > 0)

    if (lines.length === 0) return toast.error('Enter received quantities')

    setLoading(true)
    try {
      await procurementApi.createGrn({
        purchaseOrderId: po.id,
        invoiceNumber: invoiceNumber || undefined,
        invoiceDate: invoiceDate || undefined,
        notes: notes || undefined,
        lines,
      })
      toast.success('GRN created — stock updated')
      onSuccess()
    } catch {
      toast.error('Failed to create GRN')
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
            <h2 className="text-lg font-bold text-[#1A1A1A]">Goods Received Note</h2>
            <p className="text-xs text-gray-400 mt-0.5">PO {po.poNumber} · {po.supplier?.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Invoice details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Invoice Number</label>
              <input
                className="field-input"
                placeholder="e.g. INV-2024-001"
                value={invoiceNumber}
                onChange={e => setInvoiceNumber(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Invoice Date</label>
              <input
                type="date"
                className="field-input"
                value={invoiceDate}
                onChange={e => setInvoiceDate(e.target.value)}
              />
            </div>
          </div>

          {/* Line items */}
          {remaining.length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400 text-sm">
              All items already fully received
            </div>
          ) : (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-24">Ordered</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-24">Previously Recd</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-28">Receiving Now</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {remaining.map(item => {
                    const pending = item.orderedQty - item.receivedQty
                    return (
                      <tr key={item.id}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-[#1A1A1A] truncate max-w-[200px]">{item.productName}</p>
                          <p className="text-xs text-gray-400">{item.sku}</p>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-500">{item.orderedQty}</td>
                        <td className="px-4 py-3 text-right text-gray-500">{item.receivedQty}</td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min={0}
                            max={pending}
                            className="field-input text-right py-1.5 w-24 ml-auto"
                            value={qtys[item.id] ?? 0}
                            onChange={e => setQtys(prev => ({
                              ...prev,
                              [item.id]: Math.min(pending, Math.max(0, parseInt(e.target.value) || 0)),
                            }))}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <div className="bg-gray-50 px-4 py-3 flex justify-end text-sm border-t border-gray-200">
                <span className="text-gray-500">Total received value: <span className="font-bold text-[#1A1A1A]">{formatPrice(totalReceived)}</span></span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Notes</label>
            <textarea
              className="field-input resize-none"
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any remarks for this receipt…"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || remaining.length === 0}
            className="px-5 py-2 bg-[#1A1A1A] text-white text-sm font-semibold rounded-lg hover:bg-[#2A2A2A] disabled:opacity-50 transition"
          >
            {loading ? 'Saving…' : 'Record Receipt'}
          </button>
        </div>
      </div>
    </div>
  )
}
