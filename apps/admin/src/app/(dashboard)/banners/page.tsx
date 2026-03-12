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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">{initial.id ? 'Edit Banner' : 'New Banner'}</h2>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Fresh Deals This Week" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Subtitle</label>
            <input value={form.subtitle ?? ''} onChange={e => set('subtitle', e.target.value)} placeholder="Up to 30% off on vegetables" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Image URL *</label>
            <input value={form.imageUrl} onChange={e => set('imageUrl', e.target.value)} placeholder="https://..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400" />
          </div>
          {form.imageUrl && (
            <img src={form.imageUrl} alt="preview" className="w-full h-28 object-cover rounded-xl border border-gray-100" onError={e => (e.currentTarget.style.display = 'none')} />
          )}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Deep Link</label>
            <input value={form.deepLink ?? ''} onChange={e => set('deepLink', e.target.value)} placeholder="categories/vegetables or product/abc-id" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400" />
            <p className="text-xs text-gray-400 mt-1">Leave blank for no action on tap</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Sort Order</label>
            <input type="number" min={0} value={form.sortOrder} onChange={e => set('sortOrder', Number(e.target.value))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400" />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50 transition">Cancel</button>
          <button
            onClick={() => onSave(form)}
            disabled={saving || !form.title || !form.imageUrl}
            className="flex-1 bg-violet-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-violet-700 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
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
          <h1 className="text-2xl font-bold text-gray-900">Banners</h1>
          <p className="text-sm text-gray-400 mt-0.5">{banners.length} total</p>
        </div>
        <button
          onClick={() => setModal({ ...EMPTY })}
          className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-violet-700 transition"
        >
          <Plus size={16} />
          New Banner
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-gray-400">Loading...</div>
      ) : (
        <div className="grid gap-4">
          {banners.map(b => (
            <div key={b.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
              <GripVertical size={16} className="text-gray-300 shrink-0" />
              <img
                src={b.imageUrl}
                alt={b.title}
                className="w-32 h-16 object-cover rounded-xl border border-gray-100 shrink-0"
                onError={e => { e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>'; }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{b.title}</p>
                {b.subtitle && <p className="text-sm text-gray-500 truncate">{b.subtitle}</p>}
                {b.deepLink && <p className="text-xs text-violet-500 mt-0.5 truncate">→ {b.deepLink}</p>}
              </div>
              <span className="text-xs text-gray-400 shrink-0">#{b.sortOrder}</span>
              <button
                onClick={() => toggleMutation.mutate({ id: b.id, isActive: !b.isActive })}
                className="flex items-center gap-1.5 text-xs font-medium shrink-0"
              >
                {b.isActive
                  ? <><ToggleRight size={20} className="text-green-500" /><span className="text-green-600">Active</span></>
                  : <><ToggleLeft size={20} className="text-gray-400" /><span className="text-gray-400">Inactive</span></>}
              </button>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setModal({ id: b.id, title: b.title, subtitle: b.subtitle ?? '', imageUrl: b.imageUrl, deepLink: b.deepLink ?? '', sortOrder: b.sortOrder })}
                  className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => { if (confirm('Delete this banner?')) deleteMutation.mutate(b.id) }}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
          {banners.length === 0 && (
            <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">No banners yet</div>
          )}
        </div>
      )}

      {modal && (
        <BannerFormModal initial={modal} onClose={() => setModal(null)} onSave={handleSave} saving={saving} />
      )}
    </div>
  )
}
