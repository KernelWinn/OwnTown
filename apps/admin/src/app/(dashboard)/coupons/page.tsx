'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { formatPrice } from '@owntown/utils'

interface Coupon {
  id: string
  code: string
  description: string | null
  discountType: 'percentage' | 'flat'
  discountValue: number
  minOrderAmount: number
  maxDiscount: number | null
  usageLimit: number | null
  usedCount: number
  isActive: boolean
  expiresAt: string | null
}

const EMPTY: Partial<Coupon> & { id?: string } = {
  code: '', description: '', discountType: 'percentage', discountValue: 10,
  minOrderAmount: 0, maxDiscount: undefined, usageLimit: undefined, expiresAt: '',
}

function CouponFormModal({
  initial,
  onClose,
  onSave,
  saving,
}: {
  initial: typeof EMPTY
  onClose: () => void
  onSave: (data: typeof EMPTY) => void
  saving: boolean
}) {
  const [form, setForm] = useState(initial)
  const set = (k: keyof typeof EMPTY, v: any) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-900">{initial.id ? 'Edit Coupon' : 'New Coupon'}</h2>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Code *</label>
            <input
              value={form.code ?? ''}
              onChange={e => set('code', e.target.value.toUpperCase())}
              placeholder="SAVE20"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <input
              value={form.description ?? ''}
              onChange={e => set('description', e.target.value)}
              placeholder="Get 20% off on your order"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Discount Type</label>
              <select
                value={form.discountType ?? 'percentage'}
                onChange={e => set('discountType', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Value {form.discountType === 'percentage' ? '(%)' : '(₹)'}
              </label>
              <input
                type="number"
                min={1}
                value={form.discountValue ?? ''}
                onChange={e => set('discountValue', Number(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Min Order (₹)</label>
              <input
                type="number"
                min={0}
                value={(form.minOrderAmount ?? 0) / 100}
                onChange={e => set('minOrderAmount', Number(e.target.value) * 100)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Max Discount (₹)</label>
              <input
                type="number"
                min={0}
                placeholder="No cap"
                value={form.maxDiscount != null ? form.maxDiscount / 100 : ''}
                onChange={e => set('maxDiscount', e.target.value ? Number(e.target.value) * 100 : null)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Usage Limit</label>
              <input
                type="number"
                min={1}
                placeholder="Unlimited"
                value={form.usageLimit ?? ''}
                onChange={e => set('usageLimit', e.target.value ? Number(e.target.value) : null)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Expires At</label>
              <input
                type="date"
                value={form.expiresAt ?? ''}
                onChange={e => set('expiresAt', e.target.value || null)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50 transition">Cancel</button>
          <button
            onClick={() => onSave(form)}
            disabled={saving || !form.code || !form.discountValue}
            className="flex-1 bg-violet-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-violet-700 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CouponsPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<typeof EMPTY | null>(null)

  const { data: coupons = [], isLoading } = useQuery<Coupon[]>({
    queryKey: ['admin-coupons'],
    queryFn: () => api.get('/admin/coupons').then(r => r.data),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-coupons'] })

  const createMutation = useMutation({
    mutationFn: (data: typeof EMPTY) => api.post('/admin/coupons', data).then(r => r.data),
    onSuccess: () => { invalidate(); setModal(null); toast.success('Coupon created') },
    onError: () => toast.error('Failed to create coupon'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: typeof EMPTY & { id: string }) =>
      api.patch(`/admin/coupons/${id}`, data).then(r => r.data),
    onSuccess: () => { invalidate(); setModal(null); toast.success('Coupon updated') },
    onError: () => toast.error('Failed to update coupon'),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/admin/coupons/${id}`, { isActive }).then(r => r.data),
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/coupons/${id}`).then(r => r.data),
    onSuccess: () => { invalidate(); toast.success('Coupon deleted') },
  })

  const handleSave = (data: typeof EMPTY) => {
    if (modal?.id) updateMutation.mutate({ ...data, id: modal.id })
    else createMutation.mutate(data)
  }

  const saving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
          <p className="text-sm text-gray-400 mt-0.5">{coupons.length} total</p>
        </div>
        <button
          onClick={() => setModal({ ...EMPTY })}
          className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-violet-700 transition"
        >
          <Plus size={16} />
          New Coupon
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-gray-400">Loading...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Code</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Discount</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Min Order</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Usage</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Expires</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Status</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {coupons.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-lg text-xs">{c.code}</span>
                      <button
                        onClick={() => { navigator.clipboard.writeText(c.code); toast.success('Copied!') }}
                        className="text-gray-300 hover:text-gray-500"
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                    {c.description && <p className="text-xs text-gray-400 mt-0.5">{c.description}</p>}
                  </td>
                  <td className="px-5 py-4 font-medium text-gray-900">
                    {c.discountType === 'percentage'
                      ? `${c.discountValue}%${c.maxDiscount ? ` (max ${formatPrice(c.maxDiscount)})` : ''}`
                      : formatPrice(c.discountValue)}
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {c.minOrderAmount > 0 ? formatPrice(c.minOrderAmount) : '—'}
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {c.usedCount}{c.usageLimit ? `/${c.usageLimit}` : ''}
                  </td>
                  <td className="px-5 py-4 text-gray-500 text-xs">
                    {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={() => toggleMutation.mutate({ id: c.id, isActive: !c.isActive })} className="flex items-center gap-1.5 text-xs font-medium">
                      {c.isActive
                        ? <><ToggleRight size={18} className="text-green-500" /><span className="text-green-600">Active</span></>
                        : <><ToggleLeft size={18} className="text-gray-400" /><span className="text-gray-400">Inactive</span></>}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => setModal({ id: c.id, code: c.code, description: c.description ?? '', discountType: c.discountType, discountValue: c.discountValue, minOrderAmount: c.minOrderAmount, maxDiscount: c.maxDiscount, usageLimit: c.usageLimit, expiresAt: c.expiresAt ? c.expiresAt.split('T')[0] : '' })}
                        className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => { if (confirm('Delete this coupon?')) deleteMutation.mutate(c.id) }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && (
                <tr><td colSpan={7} className="text-center py-16 text-gray-400">No coupons yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <CouponFormModal initial={modal} onClose={() => setModal(null)} onSave={handleSave} saving={saving} />
      )}
    </div>
  )
}
