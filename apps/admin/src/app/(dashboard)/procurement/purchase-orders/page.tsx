'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Eye, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { procurementApi } from '@/lib/api-helpers'
import { formatPrice, formatDate } from '@owntown/utils'
import PoStatusBadge from '@/components/procurement/PoStatusBadge'
import CreatePoModal from '@/components/procurement/CreatePoModal'
import type { PurchaseOrder } from '@owntown/types'

export default function PurchaseOrdersPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)

  const { data: pos = [], isLoading } = useQuery<PurchaseOrder[]>({
    queryKey: ['purchase-orders'],
    queryFn: procurementApi.listPos,
  })

  async function deletePo(po: PurchaseOrder) {
    if (po.status !== 'draft') {
      return toast.error('Only draft POs can be deleted')
    }
    if (!confirm(`Delete PO ${po.poNumber}?`)) return
    try {
      await procurementApi.deletePo(po.id)
      qc.invalidateQueries({ queryKey: ['purchase-orders'] })
      toast.success('PO deleted')
    } catch {
      toast.error('Failed to delete PO')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Purchase Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">Create and track supplier purchase orders</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] text-white text-sm font-semibold rounded-lg hover:bg-[#2A2A2A] transition"
        >
          <Plus size={16} />
          New PO
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-gray-400">Loading…</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">PO Number</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Supplier</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Expected</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pos.map(po => (
                <tr key={po.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-4 font-semibold text-[#1A1A1A] font-mono text-xs">{po.poNumber}</td>
                  <td className="px-5 py-4 text-gray-700">{po.supplier?.name ?? '—'}</td>
                  <td className="px-5 py-4 text-gray-500">{formatDate(po.createdAt)}</td>
                  <td className="px-5 py-4 text-gray-500">{po.expectedDate ? formatDate(po.expectedDate) : '—'}</td>
                  <td className="px-5 py-4"><PoStatusBadge status={po.status} /></td>
                  <td className="px-5 py-4 text-right font-semibold text-[#1A1A1A]">{formatPrice(po.total)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => router.push(`/procurement/purchase-orders/${po.id}`)}
                        className="p-1.5 text-gray-400 hover:text-[#1A1A1A] hover:bg-gray-100 rounded-lg transition"
                        title="View details"
                      >
                        <Eye size={15} />
                      </button>
                      {po.status === 'draft' && (
                        <button
                          onClick={() => deletePo(po)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {pos.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-400">No purchase orders yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <CreatePoModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false)
            qc.invalidateQueries({ queryKey: ['purchase-orders'] })
          }}
        />
      )}
    </div>
  )
}
