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

const schema = z.object({
  name: z.string().min(1, 'Required'),
  description: z.string().optional(),
  parentId: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
})

type FormValues = z.infer<typeof schema>

interface Props {
  category: Category | null
  categories: Category[]       // top-level only (for parent selector)
  onClose: () => void
  onSuccess: () => void
}

export function CategoryFormModal({ category, categories, onClose, onSuccess }: Props) {
  const isEdit = !!category
  const fileRef = useRef<HTMLInputElement>(null)
  const [imageUrl, setImageUrl] = useState<string>(category?.imageUrl ?? '')
  const [uploading, setUploading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: category
      ? { name: category.name, description: category.description ?? '', parentId: category.parentId ?? '', sortOrder: category.sortOrder }
      : { sortOrder: 0 },
  })

  const mutation = useMutation({
    mutationFn: (data: FormValues) => {
      const payload = { ...data, imageUrl: imageUrl || undefined, parentId: data.parentId || undefined }
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
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {isEdit ? 'Edit Category' : 'New Category'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="p-6 space-y-4">
          {/* Image */}
          <div>
            <label className="field-label">Category Image</label>
            <div className="flex items-center gap-3">
              {imageUrl ? (
                <img src={imageUrl} alt="" className="w-16 h-16 rounded-xl object-cover bg-gray-100" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                  No image
                </div>
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 border border-gray-200 px-3 py-2 rounded-xl text-sm hover:bg-gray-50 transition"
              >
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="field-label">Name *</label>
            <input {...register('name')} className="field-input" placeholder="e.g. Fruits & Vegetables" />
            {errors.name && <p className="field-error">{errors.name.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="field-label">Description</label>
            <textarea {...register('description')} rows={2} className="field-input resize-none" />
          </div>

          {/* Parent category */}
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

          {/* Sort order */}
          <div>
            <label className="field-label">Sort Order</label>
            <input {...register('sortOrder')} type="number" min={0} className="field-input" />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 bg-violet-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-700 disabled:opacity-60 transition"
            >
              {mutation.isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
