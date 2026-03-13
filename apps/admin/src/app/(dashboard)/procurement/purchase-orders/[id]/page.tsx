'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ClipboardCheck } from 'lucide-react'
import { toast } from 'sonner'
import { procurementApi } from '@/lib/api-helpers'
import { formatPrice, formatDate } from '@owntown/utils'
import PoStatusBadge from '@/components/procurement/PoStatusBadge'
import GrnFormModal from '@/components/procurement/GrnFormModal'
import type { PurchaseOrder, GoodsReceivedNote, PoStatus } from '@owntown/types'

const STATUS_FLOW: Partial<Record<PoStatus, { next: PoStatus; label: string }>> = {
  draft: { next: 'sent', label: 'Mark Sent' },
  sent: { next: 'confirmed', label: 'Mark Confirmed' },
}

export default function PoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const [showGrn, setShowGrn] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)

  const { data: po, isLoading } = useQuery<PurchaseOrder>({
    queryKey: ['purchase-order', id],
    queryFn: () => procurementApi.getPo(id),
  })

  const { data: grns = [] } = useQuery<GoodsReceivedNote[]>({
    queryKey: ['grns', id],
    queryFn: () => procurementApi.listGrns(id),
    enabled: !!id,
  })

  async function advanceStatus() {
    if (!po) return
    const flow = STATUS_FLOW[po.status]
    if (!flow) return
    setStatusLoading(true)
    try {
      await procurementApi.updatePoStatus(po.id, flow.next)
      qc.invalidateQueries({ queryKey: ['purchase-order', id] })
      qc.invalidateQueries({ queryKey: ['purchase-orders'] })
      toast.success(`PO marked as ${flow.next}`)
    } catch {
      toast.error('Failed to update status')
    } finally {
      setStatusLoading(false)
    }
  }

  if (isLoading) {
    return <div className="text-center py-20 text-gray-400">Loading…</div>
  }

  if (!po) {
    return <div className="text-center py-20 text-gray-400">Purchase order not found</div>
  }

  const canReceive = po.status === 'confirmed' || po.status === 'partial'
  const flow = STATUS_FLOW[po.status]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/procurement/purchase-orders')}
            className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-500"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#1A1A1A]">{po.poNumber}</h1>
              <PoStatusBadge status={po.status} />
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {po.supplier?.name} · Created {formatDate(po.createdAt)}
              {po.expectedDate && ` · Expected ${formatDate(po.expectedDate)}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {flow && (
            <button
              onClick={advanceStatus}
              disabled={statusLoading}
              className="px-4 py-2 text-sm font-semibold border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
            >
              {flow.label}
            </button>
          )}
          {canReceive && (
            <button
              onClick={() => setShowGrn(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#00B43C] text-white text-sm font-semibold rounded-lg hover:bg-[#009932] transition"
            >
              <ClipboardCheck size={16} />
              Record Receipt (GRN)
            </button>
          )}
        </div>
      </div>

      {/* PO details card */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Subtotal</p>
          <p className="text-xl font-bold text-[#1A1A1A]">{formatPrice(po.subtotal)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">GST</p>
          <p className="text-xl font-bold text-[#1A1A1A]">{formatPrice(po.totalGst)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Total</p>
          <p className="text-xl font-bold text-[#1A1A1A]">{formatPrice(po.total)}</p>
        </div>
      </div>

      {/* Line items */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-[#1A1A1A]">Line Items</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ordered</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Received</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pending</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Unit Cost</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">GST %</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(po.items ?? []).map(item => {
              const pending = item.orderedQty - item.receivedQty
              return (
                <tr key={item.id}>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-[#1A1A1A]">{item.productName}</p>
                    <p className="text-xs text-gray-400">{item.sku}</p>
                  </td>
                  <td className="px-5 py-3.5 text-right text-gray-600">{item.orderedQty}</td>
                  <td className="px-5 py-3.5 text-right text-[#00843C] font-medium">{item.receivedQty}</td>
                  <td className="px-5 py-3.5 text-right">
                    <span className={pending > 0 ? 'text-amber-600 font-medium' : 'text-gray-400'}>
                      {pending}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right text-gray-600">{formatPrice(item.unitCost)}</td>
                  <td className="px-5 py-3.5 text-right text-gray-500">{item.gstRate}%</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-[#1A1A1A]">{formatPrice(item.totalCost)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* GRNs */}
      {grns.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-[#1A1A1A]">Goods Received Notes</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">GRN #</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Invoice</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {grns.map(grn => (
                <tr key={grn.id}>
                  <td className="px-5 py-3.5 font-mono text-xs font-semibold text-[#1A1A1A]">{grn.grnNumber}</td>
                  <td className="px-5 py-3.5 text-gray-500">{formatDate(grn.createdAt)}</td>
                  <td className="px-5 py-3.5 text-gray-600">{grn.invoiceNumber ?? '—'}</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-[#1A1A1A]">{formatPrice(grn.totalReceived)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {po.notes && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1.5">Notes</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{po.notes}</p>
        </div>
      )}

      {showGrn && (
        <GrnFormModal
          po={po}
          onClose={() => setShowGrn(false)}
          onSuccess={() => {
            setShowGrn(false)
            qc.invalidateQueries({ queryKey: ['purchase-order', id] })
            qc.invalidateQueries({ queryKey: ['grns', id] })
            qc.invalidateQueries({ queryKey: ['purchase-orders'] })
          }}
        />
      )}
    </div>
  )
}
