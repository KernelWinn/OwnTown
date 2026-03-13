'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { procurementApi } from '@/lib/api-helpers'
import type { Supplier } from '@owntown/types'

interface Props {
  supplier?: Supplier | null
  onClose: () => void
  onSuccess: () => void
}

export default function SupplierFormModal({ supplier, onClose, onSuccess }: Props) {
  const isEdit = !!supplier
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name:         supplier?.name ?? '',
    contactName:  supplier?.contactName ?? '',
    phone:        supplier?.phone ?? '',
    email:        supplier?.email ?? '',
    address:      supplier?.address ?? '',
    gstNumber:    supplier?.gstNumber ?? '',
    paymentTerms: supplier?.paymentTerms ?? '',
    notes:        supplier?.notes ?? '',
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Supplier name is required')
    setLoading(true)
    try {
      const payload = Object.fromEntries(
        Object.entries(form).filter(([, v]) => v !== ''),
      )
      if (isEdit) {
        await procurementApi.updateSupplier(supplier!.id, payload)
        toast.success('Supplier updated')
      } else {
        await procurementApi.createSupplier(payload)
        toast.success('Supplier created')
      }
      onSuccess()
    } catch {
      toast.error('Failed to save supplier')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-[#1A1A1A]">
            {isEdit ? 'Edit Supplier' : 'New Supplier'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Supplier Name *</label>
              <input className="field-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Agro Fresh Pvt Ltd" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Contact Person</label>
              <input className="field-input" value={form.contactName} onChange={e => set('contactName', e.target.value)} placeholder="Name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Phone</label>
              <input className="field-input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="9876543210" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Email</label>
              <input className="field-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="supplier@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Payment Terms</label>
              <input className="field-input" value={form.paymentTerms} onChange={e => set('paymentTerms', e.target.value)} placeholder="e.g. Net 30, Advance, COD" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">GST Number</label>
              <input className="field-input" value={form.gstNumber} onChange={e => set('gstNumber', e.target.value)} placeholder="27AAPFU0939F1ZV" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Address</label>
              <input className="field-input" value={form.address} onChange={e => set('address', e.target.value)} placeholder="City, State" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Notes</label>
              <textarea className="field-input resize-none" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Internal notes..." />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-5 py-2 bg-[#1A1A1A] text-white text-sm font-semibold rounded-lg hover:bg-[#2A2A2A] disabled:opacity-50 transition">
              {loading ? 'Saving…' : isEdit ? 'Update' : 'Create Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
