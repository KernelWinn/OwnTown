'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, GripVertical } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'

interface Banner {
  id: string
  title: string
  subtitle: string | null
  imageUrl: string
  deepLink: string | null
  sortOrder: number
  isActive: boolean
}

const EMPTY = { title: '', subtitle: '', imageUrl: '', deepLink: '', sortOrder: 0 }

function BannerFormModal({
  initial,
  onClose,
  onSave,
  saving,
}: {
  initial: typeof EMPTY & { id?: string }
  onClose: () => void
  onSave: (data: typeof EMPTY) => void
  saving: boolean
}) {
  const [form, setForm] = useState(initial)
  const set = (k: keyof typeof EMPTY, v: any) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-base font-bold text-[#1A1A1A]">{initial.id ? 'Edit Banner' : 'New Banner'}</h2>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Fresh Deals This Week" className="field-input" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Subtitle</label>
            <input value={form.subtitle ?? ''} onChange={e => set('subtitle', e.target.value)} placeholder="Up to 30% off on vegetables" className="field-input" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Image URL *</label>
            <input value={form.imageUrl} onChange={e => set('imageUrl', e.target.value)} placeholder="https://..." className="field-input" />
          </div>
          {form.imageUrl && (
            <img src={form.imageUrl} alt="preview" className="w-full h-28 object-cover rounded-lg border border-gray-200" onError={e => (e.currentTarget.style.display = 'none')} />
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Deep Link</label>
            <input value={form.deepLink ?? ''} onChange={e => set('deepLink', e.target.value)} placeholder="categories/vegetables or product/abc-id" className="field-input" />
            <p className="text-xs text-gray-400 mt-1">Leave blank for no action on tap</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Sort Order</label>
            <input type="number" min={0} value={form.sortOrder} onChange={e => set('sortOrder', Number(e.target.value))} className="field-input" />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition">Cancel</button>
          <button
            onClick={() => onSave(form)}
            disabled={saving || !form.title || !form.imageUrl}
            className="flex-1 bg-[#1A1A1A] text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-[#2A2A2A] transition disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Banner'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BannersPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<(typeof EMPTY & { id?: string }) | null>(null)

  const { data: banners = [], isLoading } = useQuery<Banner[]>({
    queryKey: ['admin-banners'],
    queryFn: () => api.get('/admin/banners').then(r => r.data),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-banners'] })

  const createMutation = useMutation({
    mutationFn: (data: typeof EMPTY) => api.post('/admin/banners', data).then(r => r.data),
    onSuccess: () => { invalidate(); setModal(null); toast.success('Banner created') },
    onError: () => toast.error('Failed to create banner'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: typeof EMPTY & { id: string }) =>
      api.patch(`/admin/banners/${id}`, data).then(r => r.data),
    onSuccess: () => { invalidate(); setModal(null); toast.success('Banner updated') },
    onError: () => toast.error('Failed to update banner'),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/admin/banners/${id}`, { isActive }).then(r => r.data),
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/banners/${id}`).then(r => r.data),
    onSuccess: () => { invalidate(); toast.success('Banner deleted') },
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
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Banners</h1>
          <p className="text-sm text-gray-500 mt-0.5">{banners.length} banners</p>
        </div>
        <button
          onClick={() => setModal({ ...EMPTY })}
          className="flex items-center gap-2 bg-[#1A1A1A] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#2A2A2A] transition"
        >
          <Plus size={15} />
          New Banner
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white border border-gray-200 rounded-lg flex items-center justify-center py-20">
          <p className="text-sm text-gray-400">Loading…</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100">
          {banners.map(b => (
            <div key={b.id} className="flex items-center gap-4 px-4 py-3.5 hover:bg-gray-50 transition-colors">
              <GripVertical size={15} className="text-gray-300 shrink-0 cursor-grab" />
              <img
                src={b.imageUrl}
                alt={b.title}
                className="w-28 h-14 object-cover rounded-md border border-gray-200 shrink-0 bg-gray-100"
                onError={e => { e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>'; }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#1A1A1A] truncate text-sm">{b.title}</p>
                {b.subtitle && <p className="text-xs text-gray-500 truncate mt-0.5">{b.subtitle}</p>}
                {b.deepLink && <p className="text-xs text-gray-400 mt-0.5 truncate font-mono">→ {b.deepLink}</p>}
              </div>
              <span className="text-xs text-gray-400 shrink-0 font-mono">#{b.sortOrder}</span>
              <button
                onClick={() => toggleMutation.mutate({ id: b.id, isActive: !b.isActive })}
                className="flex items-center gap-1.5 text-xs font-medium shrink-0"
              >
                {b.isActive
                  ? <><ToggleRight size={20} className="text-[#00B43C]" /><span className="text-[#00B43C]">Active</span></>
                  : <><ToggleLeft size={20} className="text-gray-300" /><span className="text-gray-400">Inactive</span></>}
              </button>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setModal({ id: b.id, title: b.title, subtitle: b.subtitle ?? '', imageUrl: b.imageUrl, deepLink: b.deepLink ?? '', sortOrder: b.sortOrder })}
                  className="p-1.5 text-gray-400 hover:text-[#1A1A1A] hover:bg-gray-100 rounded-md transition"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => { if (confirm('Delete this banner?')) deleteMutation.mutate(b.id) }}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {banners.length === 0 && (
            <div className="text-center py-16 text-sm text-gray-400">No banners yet</div>
          )}
        </div>
      )}

      {modal && (
        <BannerFormModal initial={modal} onClose={() => setModal(null)} onSave={handleSave} saving={saving} />
      )}
    </div>
  )
}
