'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'

interface DeliverySlot {
  id: string
  date: string
  startTime: string
  endTime: string
  label: string
  maxOrders: number
  currentOrders: number
  isActive: boolean
}

const EMPTY_FORM = { date: '', startTime: '', endTime: '', label: '', maxOrders: 50 }

function SlotFormModal({
  initial,
  onClose,
  onSave,
  saving,
}: {
  initial: typeof EMPTY_FORM & { id?: string }
  onClose: () => void
  onSave: (data: typeof EMPTY_FORM) => void
  saving: boolean
}) {
  const [form, setForm] = useState(initial)
  const set = (k: keyof typeof EMPTY_FORM, v: string | number) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-bold text-[#1A1A1A]">{initial.id ? 'Edit Slot' : 'New Delivery Slot'}</h2>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={e => set('date', e.target.value)}
              className="field-input"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start Time</label>
              <input
                type="time"
                value={form.startTime}
                onChange={e => set('startTime', e.target.value)}
                className="field-input"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End Time</label>
              <input
                type="time"
                value={form.endTime}
                onChange={e => set('endTime', e.target.value)}
                className="field-input"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Label</label>
            <input
              type="text"
              placeholder="e.g. Morning (9AM–12PM)"
              value={form.label}
              onChange={e => set('label', e.target.value)}
              className="field-input"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Max Orders</label>
            <input
              type="number"
              min={1}
              value={form.maxOrders}
              onChange={e => set('maxOrders', Number(e.target.value))}
              className="field-input"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={saving || !form.date || !form.startTime || !form.endTime || !form.label}
            className="flex-1 bg-[#1A1A1A] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#2A2A2A] transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SlotsPage() {
  const qc = useQueryClient()
  const [filterDate, setFilterDate] = useState('')
  const [modalSlot, setModalSlot] = useState<(typeof EMPTY_FORM & { id?: string }) | null>(null)

  const { data: slots = [], isLoading } = useQuery<DeliverySlot[]>({
    queryKey: ['admin-slots', filterDate],
    queryFn: () => api.get(`/admin/slots${filterDate ? `?date=${filterDate}` : ''}`).then(r => r.data),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-slots'] })

  const createMutation = useMutation({
    mutationFn: (data: typeof EMPTY_FORM) => api.post('/admin/slots', data).then(r => r.data),
    onSuccess: () => { invalidate(); setModalSlot(null); toast.success('Slot created') },
    onError: () => toast.error('Failed to create slot'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: typeof EMPTY_FORM & { id: string }) =>
      api.patch(`/admin/slots/${id}`, data).then(r => r.data),
    onSuccess: () => { invalidate(); setModalSlot(null); toast.success('Slot updated') },
    onError: () => toast.error('Failed to update slot'),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/admin/slots/${id}`, { isActive }).then(r => r.data),
    onSuccess: invalidate,
    onError: () => toast.error('Failed to toggle slot'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/slots/${id}`).then(r => r.data),
    onSuccess: () => { invalidate(); toast.success('Slot deleted') },
    onError: () => toast.error('Failed to delete slot'),
  })

  const handleSave = (data: typeof EMPTY_FORM) => {
    if (modalSlot?.id) {
      updateMutation.mutate({ ...data, id: modalSlot.id })
    } else {
      createMutation.mutate(data)
    }
  }

  const saving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Delivery Slots</h1>
          <p className="text-sm text-gray-500 mt-0.5">{slots.length} slots</p>
        </div>
        <button
          onClick={() => setModalSlot(EMPTY_FORM)}
          className="flex items-center gap-2 bg-[#1A1A1A] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#2A2A2A] transition"
        >
          <Plus size={16} />
          New Slot
        </button>
      </div>

      {/* Date filter */}
      <div className="flex items-center gap-3">
        <input
          type="date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          className="field-input w-auto"
        />
        {filterDate && (
          <button
            onClick={() => setFilterDate('')}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            Clear
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-gray-400">Loading slots...</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Time</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Label</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Capacity</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {slots.map(slot => (
                <tr key={slot.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-4 font-medium text-[#1A1A1A]">{slot.date}</td>
                  <td className="px-5 py-4 text-gray-600 font-mono text-xs">
                    {slot.startTime} – {slot.endTime}
                  </td>
                  <td className="px-5 py-4 text-gray-700">{slot.label}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#00B43C] rounded-full"
                          style={{ width: `${Math.min(100, (slot.currentOrders / slot.maxOrders) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {slot.currentOrders}/{slot.maxOrders}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => toggleMutation.mutate({ id: slot.id, isActive: !slot.isActive })}
                      className="flex items-center gap-1.5 text-xs font-medium"
                    >
                      {slot.isActive ? (
                        <>
                          <ToggleRight size={18} className="text-[#00B43C]" />
                          <span className="text-[#00B43C]">Active</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft size={18} className="text-gray-400" />
                          <span className="text-gray-400">Inactive</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => setModalSlot({
                          id: slot.id,
                          date: slot.date,
                          startTime: slot.startTime,
                          endTime: slot.endTime,
                          label: slot.label,
                          maxOrders: slot.maxOrders,
                        })}
                        className="p-1.5 text-gray-400 hover:text-[#1A1A1A] hover:bg-gray-100 rounded-lg transition"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Delete this slot?')) deleteMutation.mutate(slot.id)
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {slots.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-gray-400">
                    {filterDate ? 'No slots for this date' : 'No delivery slots yet'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalSlot && (
        <SlotFormModal
          initial={modalSlot}
          onClose={() => setModalSlot(null)}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </div>
  )
}
