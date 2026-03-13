'use client'

import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { X, Upload, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { categoriesApi, uploadImageToS3 } from '@/lib/api-helpers'
import type { Category } from '@owntown/types'

const EMOJI_PRESETS = [
  '🥦','🥕','🍅','🥒','🧅','🌽','🥬','🥑','🍋','🍎',
  '🍇','🍓','🫐','🍌','🍉','🥭','🍑','🍒','🥝','🍐',
  '🥚','🧀','🥛','🧈','🥩','🍗','🐟','🦐','🌾','🫘',
  '🥜','🌰','🫒','🧄','🌶️','🫚','🫙','🍯','🧂','🍵',
  '☕','🧃','🥤','🧋','🍫','🍬','🧁','🍞','🥐','🥫',
  '🏠','🌿','🌱','✨','⭐','🛒','🎁','💊','🧼','🪥',
]

const schema = z.object({
  name: z.string().min(1, 'Required'),
  description: z.string().optional(),
  parentId: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
})

type FormValues = z.infer<typeof schema>

interface Props {
  category: Category | null
  categories: Category[]
  onClose: () => void
  onSuccess: () => void
}

export function CategoryFormModal({ category, categories, onClose, onSuccess }: Props) {
  const isEdit = !!category
  const fileRef = useRef<HTMLInputElement>(null)
  const [imageUrl, setImageUrl] = useState<string>(category?.imageUrl ?? '')
  const [icon, setIcon] = useState<string>(category?.icon ?? '')
  const [uploading, setUploading] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: category
      ? { name: category.name, description: category.description ?? '', parentId: category.parentId ?? '', sortOrder: category.sortOrder }
      : { sortOrder: 0 },
  })

  const mutation = useMutation({
    mutationFn: (data: FormValues) => {
      const payload = {
        ...data,
        imageUrl: imageUrl || undefined,
        icon: icon || undefined,
        parentId: data.parentId || undefined,
      }
      return isEdit
        ? categoriesApi.update(category!.id, payload)
        : categoriesApi.create(payload)
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Category updated' : 'Category created')
      onSuccess()
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  })

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const key = await uploadImageToS3(file, 'categories')
      setImageUrl(key)
      toast.success('Image uploaded')
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-bold text-[#1A1A1A]">
            {isEdit ? 'Edit Category' : 'New Category'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-md transition">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="p-6 space-y-4">
          {/* Emoji icon picker */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
              Category Icon (emoji)
            </label>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl border-2 border-gray-200 flex items-center justify-center text-3xl bg-gray-50 select-none">
                {icon || <span className="text-xs text-gray-300">none</span>}
              </div>
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(p => !p)}
                  className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition"
                >
                  {showEmojiPicker ? 'Close picker' : 'Pick emoji'}
                </button>
                {icon && (
                  <button
                    type="button"
                    onClick={() => setIcon('')}
                    className="text-xs px-3 py-1.5 text-red-500 hover:bg-red-50 rounded-lg font-medium transition"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            {showEmojiPicker && (
              <div className="mt-2 p-3 border border-gray-200 rounded-xl bg-white shadow-sm">
                <div className="grid grid-cols-10 gap-1 mb-2">
                  {EMOJI_PRESETS.map(e => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => { setIcon(e); setShowEmojiPicker(false) }}
                      className={`text-xl p-1 rounded-lg hover:bg-gray-100 transition ${icon === e ? 'bg-[#E6F9ED] ring-1 ring-[#00B43C]' : ''}`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 border-t border-gray-100 pt-2">
                  <span className="text-xs text-gray-400">Or type one:</span>
                  <input
                    type="text"
                    value={icon}
                    onChange={e => setIcon(e.target.value)}
                    className="field-input py-1 text-lg w-20 text-center"
                    placeholder="🥦"
                    maxLength={4}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Category Image</label>
            <div className="flex items-center gap-3">
              {imageUrl ? (
                <img src={imageUrl} alt="" className="w-14 h-14 rounded-lg object-cover bg-gray-100" />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                  No img
                </div>
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 border border-gray-300 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition text-gray-700"
              >
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {uploading ? 'Uploading…' : 'Upload'}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </div>
          </div>

          <div>
            <label className="field-label">Name *</label>
            <input {...register('name')} className="field-input" placeholder="e.g. Fruits & Vegetables" />
            {errors.name && <p className="field-error">{errors.name.message}</p>}
          </div>

          <div>
            <label className="field-label">Description</label>
            <textarea {...register('description')} rows={2} className="field-input resize-none" />
          </div>

          <div>
            <label className="field-label">Parent Category (optional)</label>
            <select {...register('parentId')} className="field-input">
              <option value="">— Top level —</option>
              {categories
                .filter(c => c.id !== category?.id)
                .map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>
          </div>

          <div>
            <label className="field-label">Sort Order</label>
            <input {...register('sortOrder')} type="number" min={0} className="field-input" />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 bg-[#1A1A1A] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[#2A2A2A] disabled:opacity-50 transition"
            >
              {mutation.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
