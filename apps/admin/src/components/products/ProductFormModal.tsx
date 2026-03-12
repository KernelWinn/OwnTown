'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { X, Upload, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { productsApi, categoriesApi, uploadImageToS3 } from '@/lib/api-helpers'
import { formatPrice } from '@owntown/utils'
import type { Product } from '@owntown/types'

const schema = z.object({
  name: z.string().min(1, 'Required'),
  description: z.string().optional(),
  categoryId: z.string().uuid('Select a category'),
  price: z.coerce.number().int().positive('Must be > 0'),
  mrp: z.coerce.number().int().positive('Must be > 0'),
  unit: z.string().min(1, 'Required'),
  stockQuantity: z.coerce.number().int().min(0),
  lowStockThreshold: z.coerce.number().int().min(0).default(10),
  sku: z.string().min(1, 'Required'),
  barcode: z.string().optional(),
  gstCategory: z.enum(['exempt', 'five', 'twelve', 'eighteen']),
  isFeatured: z.boolean().default(false),
})

type FormValues = z.infer<typeof schema>

interface Props {
  product: Product | null
  onClose: () => void
  onSuccess: () => void
}

export function ProductFormModal({ product, onClose, onSuccess }: Props) {
  const isEdit = !!product
  const fileRef = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState<string[]>(product?.images ?? [])
  const [uploading, setUploading] = useState(false)

  const { data: categories = [] } = useQuery({
    queryKey: ['categories-all'],
    queryFn: () => categoriesApi.list(),
  })

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: product
      ? {
          name: product.name,
          description: product.description ?? '',
          categoryId: product.categoryId,
          price: product.price,
          mrp: product.mrp,
          unit: product.unit,
          stockQuantity: product.stockQuantity,
          lowStockThreshold: product.lowStockThreshold,
          sku: product.sku,
          barcode: product.barcode ?? '',
          gstCategory: product.gstCategory as any,
          isFeatured: product.isFeatured,
        }
      : { gstCategory: 'exempt', isFeatured: false, stockQuantity: 0, lowStockThreshold: 10 },
  })

  const price = watch('price')
  const mrp = watch('mrp')

  const mutation = useMutation({
    mutationFn: (data: FormValues) => {
      const payload = { ...data, images }
      return isEdit
        ? productsApi.update(product!.id, payload)
        : productsApi.create(payload)
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Product updated' : 'Product created')
      onSuccess()
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Something went wrong')
    },
  })

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    try {
      const keys = await Promise.all(files.map(f => uploadImageToS3(f, 'products')))
      // If editing an existing product, attach images immediately
      if (isEdit && product) {
        const updated = await productsApi.addImages(product.id, keys)
        setImages(updated.images)
      } else {
        // For new product, collect keys — images will be set on create
        setImages(prev => [...prev, ...keys.map(k => `/uploads/${k}`)])
      }
      toast.success(`${files.length} image${files.length > 1 ? 's' : ''} uploaded`)
    } catch {
      toast.error('Image upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleRemoveImage(url: string) {
    if (isEdit && product) {
      await productsApi.removeImage(product.id, url)
    }
    setImages(prev => prev.filter(i => i !== url))
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-gray-900">
            {isEdit ? 'Edit Product' : 'New Product'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="p-6 space-y-5">
          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>
            <div className="flex gap-2 flex-wrap">
              {images.map(url => (
                <div key={url} className="relative group w-20 h-20">
                  <img src={url} alt="" className="w-20 h-20 rounded-xl object-cover bg-gray-100" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(url)}
                    className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition"
                  >
                    <Trash2 size={16} className="text-white" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 hover:border-violet-400 transition text-gray-400 hover:text-violet-500"
              >
                {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                <span className="text-xs">{uploading ? 'Uploading' : 'Upload'}</span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
          </div>

          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="field-label">Product Name *</label>
              <input {...register('name')} className="field-input" placeholder="e.g. Aashirvaad Atta 5kg" />
              {errors.name && <p className="field-error">{errors.name.message}</p>}
            </div>

            <div className="col-span-2">
              <label className="field-label">Description</label>
              <textarea {...register('description')} rows={2} className="field-input resize-none" />
            </div>

            {/* Category */}
            <div>
              <label className="field-label">Category *</label>
              <select {...register('categoryId')} className="field-input">
                <option value="">Select category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.categoryId && <p className="field-error">{errors.categoryId.message}</p>}
            </div>

            {/* Unit */}
            <div>
              <label className="field-label">Unit *</label>
              <input {...register('unit')} className="field-input" placeholder="500g / 1L / 1 piece" />
              {errors.unit && <p className="field-error">{errors.unit.message}</p>}
            </div>

            {/* Price */}
            <div>
              <label className="field-label">Selling Price (₹) *</label>
              <input {...register('price')} type="number" className="field-input" placeholder="e.g. 299 (in rupees)" />
              {price > 0 && <p className="text-xs text-gray-400 mt-1">{formatPrice(price)}</p>}
              {errors.price && <p className="field-error">{errors.price.message}</p>}
            </div>

            {/* MRP */}
            <div>
              <label className="field-label">MRP (₹) *</label>
              <input {...register('mrp')} type="number" className="field-input" placeholder="e.g. 350" />
              {mrp > 0 && price > 0 && mrp > price && (
                <p className="text-xs text-green-600 mt-1">
                  {Math.round(((mrp - price) / mrp) * 100)}% off
                </p>
              )}
              {errors.mrp && <p className="field-error">{errors.mrp.message}</p>}
            </div>

            {/* Stock */}
            <div>
              <label className="field-label">Stock Quantity *</label>
              <input {...register('stockQuantity')} type="number" min={0} className="field-input" />
              {errors.stockQuantity && <p className="field-error">{errors.stockQuantity.message}</p>}
            </div>

            {/* Low stock threshold */}
            <div>
              <label className="field-label">Low Stock Alert At</label>
              <input {...register('lowStockThreshold')} type="number" min={0} className="field-input" />
            </div>

            {/* SKU */}
            <div>
              <label className="field-label">SKU *</label>
              <input {...register('sku')} className="field-input" placeholder="e.g. ATTA-5KG-001" />
              {errors.sku && <p className="field-error">{errors.sku.message}</p>}
            </div>

            {/* Barcode */}
            <div>
              <label className="field-label">Barcode</label>
              <input {...register('barcode')} className="field-input" placeholder="Optional" />
            </div>

            {/* GST */}
            <div>
              <label className="field-label">GST Category *</label>
              <select {...register('gstCategory')} className="field-input">
                <option value="exempt">0% — Exempt (fresh produce, milk)</option>
                <option value="five">5% — Packaged food, tea, coffee</option>
                <option value="twelve">12% — Ghee, butter, cheese</option>
                <option value="eighteen">18% — Beverages, cosmetics</option>
              </select>
            </div>

            {/* Featured */}
            <div className="flex items-center gap-3 pt-6">
              <input
                {...register('isFeatured')}
                type="checkbox"
                id="isFeatured"
                className="w-4 h-4 text-violet-600 rounded"
              />
              <label htmlFor="isFeatured" className="text-sm font-medium text-gray-700">
                Feature on home screen
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || mutation.isPending}
              className="flex-1 bg-violet-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-700 disabled:opacity-60 transition"
            >
              {mutation.isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
