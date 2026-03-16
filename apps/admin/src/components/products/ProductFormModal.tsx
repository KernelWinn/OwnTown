'use client'

import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X, Upload, Trash2, Loader2, Plus, Pencil, Check } from 'lucide-react'
import { toast } from 'sonner'
import { productsApi, categoriesApi, uploadImageToS3 } from '@/lib/api-helpers'
import { formatPrice } from '@owntown/utils'
import type { Product, ProductVariant } from '@owntown/types'

const schema = z.object({
  name: z.string().min(1, 'Required'),
  description: z.string().optional(),
  categoryId: z.string().uuid('Select a category'),
  price: z.coerce.number().positive('Must be > 0').multipleOf(0.01, 'Max 2 decimal places'),
  mrp: z.coerce.number().positive('Must be > 0').multipleOf(0.01, 'Max 2 decimal places'),
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

// ─── Variant row (inline edit) ───────────────────────────────────────────────

function VariantRow({
  variant,
  optionNames,
  productId,
  onDeleted,
}: {
  variant: ProductVariant
  optionNames: string[]
  productId: string
  onDeleted: () => void
}) {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    price: variant.price / 100,
    mrp: variant.mrp / 100,
    sku: variant.sku,
    stockQuantity: variant.stockQuantity,
  })

  const updateMutation = useMutation({
    mutationFn: () => productsApi.updateVariant(productId, variant.id, {
      ...form,
      price: Math.round(form.price * 100),
      mrp: Math.round(form.mrp * 100),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['variants', productId] })
      setEditing(false)
      toast.success('Variant updated')
    },
    onError: () => toast.error('Failed to update variant'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => productsApi.deleteVariant(productId, variant.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['variants', productId] })
      onDeleted()
      toast.success('Variant deleted')
    },
    onError: () => toast.error('Failed to delete variant'),
  })

  return (
    <div className="grid grid-cols-[1fr_auto] gap-3 py-3 border-b border-gray-100 last:border-0">
      {/* Option tags */}
      <div className="flex flex-wrap gap-1.5 items-center mb-1">
        {optionNames.map(n => (
          <span key={n} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-medium">
            {n}: {variant.options[n] ?? '—'}
          </span>
        ))}
      </div>

      {editing ? (
        <div className="grid grid-cols-4 gap-2 col-span-2">
          {['price', 'mrp', 'sku', 'stockQuantity'].map(k => (
            <div key={k}>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                {k === 'stockQuantity' ? 'Stock' : k === 'price' ? 'Price (₹)' : k === 'mrp' ? 'MRP (₹)' : 'SKU'}
              </label>
              <input
                type={k === 'sku' ? 'text' : 'number'}
                step={k === 'price' || k === 'mrp' ? '0.01' : undefined}
                min={k === 'price' || k === 'mrp' ? '0.01' : k === 'stockQuantity' ? '0' : undefined}
                value={(form as any)[k]}
                onChange={e => setForm(f => ({ ...f, [k]: k === 'sku' ? e.target.value : Number(e.target.value) }))}
                className="field-input py-1.5 text-xs"
              />
            </div>
          ))}
          <div className="col-span-4 flex gap-2 mt-1">
            <button
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#1A1A1A] text-white rounded-lg font-medium hover:bg-[#2A2A2A] transition disabled:opacity-50"
            >
              <Check size={12} />
              {updateMutation.isPending ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => setEditing(false)} className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="col-span-2 flex items-center gap-4">
          <div className="flex gap-4 text-xs text-gray-600 flex-1">
            <span className="font-semibold text-[#1A1A1A]">{formatPrice(variant.price)}</span>
            {variant.mrp > variant.price && (
              <span className="line-through text-gray-400">{formatPrice(variant.mrp)}</span>
            )}
            <span className="font-mono text-gray-500">{variant.sku}</span>
            <span className={variant.stockQuantity <= variant.lowStockThreshold ? 'text-amber-600 font-medium' : ''}>
              {variant.stockQuantity} in stock
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => setEditing(true)} className="sq-icon-btn"><Pencil size={13} /></button>
            <button
              onClick={() => { if (confirm('Delete this variant?')) deleteMutation.mutate() }}
              className="sq-icon-btn-danger"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Add variant form ─────────────────────────────────────────────────────────

function AddVariantForm({
  productId,
  optionNames,
  onAdded,
  onCancel,
}: {
  productId: string
  optionNames: string[]
  onAdded: () => void
  onCancel: () => void
}) {
  const qc = useQueryClient()
  const [options, setOptions] = useState<Record<string, string>>(
    Object.fromEntries(optionNames.map(n => [n, '']))
  )
  const [form, setForm] = useState({ price: '', mrp: '', sku: '', stockQuantity: '0' })

  const autoTitle = optionNames.map(n => options[n]).filter(Boolean).join(' / ')

  const mutation = useMutation({
    mutationFn: () => productsApi.createVariant(productId, {
      title: autoTitle || 'Variant',
      options,
      price: Math.round(Number(form.price) * 100),
      mrp: Math.round(Number(form.mrp) * 100),
      sku: form.sku,
      stockQuantity: Number(form.stockQuantity),
      isActive: true,
      lowStockThreshold: 10,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['variants', productId] })
      onAdded()
      toast.success('Variant added')
    },
    onError: () => toast.error('Failed to add variant'),
  })

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200">
      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">New Variant</p>

      {/* Option values */}
      <div className="grid grid-cols-2 gap-2">
        {optionNames.map(name => (
          <div key={name}>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">{name}</label>
            <input
              placeholder={`e.g. ${name === 'Size' ? '500g' : name === 'Color' ? 'Red' : 'Value'}`}
              value={options[name] ?? ''}
              onChange={e => setOptions(o => ({ ...o, [name]: e.target.value }))}
              className="field-input py-1.5 text-xs"
            />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          { key: 'price', label: 'Price (₹)' },
          { key: 'mrp', label: 'MRP (₹)' },
          { key: 'sku', label: 'SKU', type: 'text' },
          { key: 'stockQuantity', label: 'Stock' },
        ].map(({ key, label, type }) => (
          <div key={key}>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">{label}</label>
            <input
              type={type ?? 'number'}
              value={(form as any)[key]}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              className="field-input py-1.5 text-xs"
            />
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !form.sku || !form.price}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#1A1A1A] text-white rounded-lg font-medium hover:bg-[#2A2A2A] transition disabled:opacity-50"
        >
          <Plus size={12} />
          {mutation.isPending ? 'Adding…' : 'Add Variant'}
        </button>
        <button onClick={onCancel} className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition">
          Cancel
        </button>
      </div>
    </div>
  )
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export function ProductFormModal({ product, onClose, onSuccess }: Props) {
  const isEdit = !!product
  const fileRef = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState<string[]>(product?.images ?? [])
  const [uploading, setUploading] = useState(false)
  const [tab, setTab] = useState<'details' | 'variants'>('details')
  const [optionNames, setOptionNames] = useState<string[]>(product?.optionNames ?? [])
  const [newOption, setNewOption] = useState('')
  const [showAddVariant, setShowAddVariant] = useState(false)

  const { data: categories = [] } = useQuery({
    queryKey: ['categories-all'],
    queryFn: () => categoriesApi.list(),
  })

  const { data: variants = [] } = useQuery({
    queryKey: ['variants', product?.id],
    queryFn: () => productsApi.listVariants(product!.id),
    enabled: isEdit && tab === 'variants',
  })

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: product
      ? {
          name: product.name, description: product.description ?? '',
          categoryId: product.categoryId, price: product.price / 100, mrp: product.mrp / 100,
          unit: product.unit, stockQuantity: product.stockQuantity,
          lowStockThreshold: product.lowStockThreshold, sku: product.sku,
          barcode: product.barcode ?? '', gstCategory: product.gstCategory as any,
          isFeatured: product.isFeatured,
        }
      : { gstCategory: 'exempt', isFeatured: false, stockQuantity: 0, lowStockThreshold: 10 },
  })

  const price = watch('price')
  const mrp = watch('mrp')

  const mutation = useMutation({
    mutationFn: (data: FormValues) => {
      const payload = {
        ...data,
        price: Math.round(data.price * 100),
        mrp: Math.round(data.mrp * 100),
        images,
        optionNames,
      }
      return isEdit ? productsApi.update(product!.id, payload) : productsApi.create(payload)
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Product updated' : 'Product created')
      onSuccess()
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  })

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    try {
      const keys = await Promise.all(files.map(f => uploadImageToS3(f, 'products')))
      if (isEdit && product) {
        const updated = await productsApi.addImages(product.id, keys)
        setImages(updated.images)
      } else {
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
    if (isEdit && product) await productsApi.removeImage(product.id, url)
    setImages(prev => prev.filter(i => i !== url))
  }

  function addOptionName() {
    const name = newOption.trim()
    if (!name || optionNames.includes(name)) return
    setOptionNames(prev => [...prev, name])
    setNewOption('')
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h2 className="text-base font-bold text-[#1A1A1A]">
            {isEdit ? 'Edit Product' : 'New Product'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-md transition">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Tabs — only show when editing */}
        {isEdit && (
          <div className="flex border-b border-gray-200 shrink-0">
            {(['details', 'variants'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-2.5 text-sm font-medium capitalize transition ${
                  tab === t
                    ? 'border-b-2 border-[#1A1A1A] text-[#1A1A1A] -mb-px'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t}
                {t === 'variants' && variants.length > 0 && (
                  <span className="ml-1.5 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                    {variants.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="overflow-y-auto flex-1">
          {/* ── Details tab ── */}
          {tab === 'details' && (
            <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="p-6 space-y-5">
              {/* Images */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Images</label>
                <div className="flex gap-2 flex-wrap">
                  {images.map(url => (
                    <div key={url} className="relative group w-20 h-20">
                      <img src={url} alt="" className="w-20 h-20 rounded-lg object-cover bg-gray-100" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(url)}
                        className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition"
                      >
                        <Trash2 size={16} className="text-white" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 hover:border-[#1A1A1A] transition text-gray-400 hover:text-[#1A1A1A]"
                  >
                    {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                    <span className="text-xs">{uploading ? 'Uploading' : 'Upload'}</span>
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="field-label">Product Name *</label>
                  <input {...register('name')} className="field-input" placeholder="e.g. Aashirvaad Atta" />
                  {errors.name && <p className="field-error">{errors.name.message}</p>}
                </div>

                <div className="col-span-2">
                  <label className="field-label">Description</label>
                  <textarea {...register('description')} rows={2} className="field-input resize-none" />
                </div>

                <div>
                  <label className="field-label">Category *</label>
                  <select {...register('categoryId')} className="field-input">
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {errors.categoryId && <p className="field-error">{errors.categoryId.message}</p>}
                </div>

                <div>
                  <label className="field-label">Unit *</label>
                  <input {...register('unit')} className="field-input" placeholder="500g / 1L / 1 piece" />
                  {errors.unit && <p className="field-error">{errors.unit.message}</p>}
                </div>

                <div>
                  <label className="field-label">Selling Price (₹) *</label>
                  <input {...register('price')} type="number" step="0.01" min="0.01" className="field-input" placeholder="0.00" />
                  {errors.price && <p className="field-error">{errors.price.message}</p>}
                </div>

                <div>
                  <label className="field-label">MRP (₹) *</label>
                  <input {...register('mrp')} type="number" step="0.01" min="0.01" className="field-input" placeholder="0.00" />
                  {mrp > 0 && price > 0 && mrp > price && (
                    <p className="text-xs text-[#00843C] mt-1">{Math.round(((mrp - price) / mrp) * 100)}% off</p>
                  )}
                  {errors.mrp && <p className="field-error">{errors.mrp.message}</p>}
                </div>

                <div>
                  <label className="field-label">Stock Quantity *</label>
                  <input {...register('stockQuantity')} type="number" min={0} className="field-input" />
                </div>

                <div>
                  <label className="field-label">Low Stock Alert At</label>
                  <input {...register('lowStockThreshold')} type="number" min={0} className="field-input" />
                </div>

                <div>
                  <label className="field-label">SKU *</label>
                  <input {...register('sku')} className="field-input" placeholder="ATTA-5KG-001" />
                  {errors.sku && <p className="field-error">{errors.sku.message}</p>}
                </div>

                <div>
                  <label className="field-label">Barcode</label>
                  <input {...register('barcode')} className="field-input" placeholder="Optional" />
                </div>

                <div>
                  <label className="field-label">GST Category *</label>
                  <select {...register('gstCategory')} className="field-input">
                    <option value="exempt">0% — Exempt</option>
                    <option value="five">5% — Packaged food</option>
                    <option value="twelve">12% — Ghee, butter</option>
                    <option value="eighteen">18% — Beverages</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <input {...register('isFeatured')} type="checkbox" id="isFeatured" className="w-4 h-4 rounded accent-[#1A1A1A]" />
                  <label htmlFor="isFeatured" className="text-sm font-medium text-gray-700">Feature on home screen</label>
                </div>
              </div>

              {/* Variant option names */}
              <div className="border-t border-gray-100 pt-4">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  Product Options
                  <span className="ml-1.5 text-gray-400 font-normal normal-case">e.g. Size, Flavor, Color</span>
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {optionNames.map(n => (
                    <span key={n} className="flex items-center gap-1 text-xs bg-[#1A1A1A] text-white px-2.5 py-1 rounded-full font-medium">
                      {n}
                      <button type="button" onClick={() => setOptionNames(o => o.filter(x => x !== n))} className="hover:opacity-70">
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add option name..."
                    value={newOption}
                    onChange={e => setNewOption(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOptionName() } }}
                    className="field-input max-w-xs py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={addOptionName}
                    disabled={!newOption.trim()}
                    className="flex items-center gap-1 text-sm px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-40 text-gray-700"
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>
                {optionNames.length > 0 && !isEdit && (
                  <p className="text-xs text-gray-400 mt-1.5">Save the product first, then add variants from the Variants tab.</p>
                )}
              </div>

              <div className="flex gap-3 pt-2 border-t border-gray-200">
                <button type="button" onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || mutation.isPending}
                  className="flex-1 bg-[#1A1A1A] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[#2A2A2A] disabled:opacity-50 transition"
                >
                  {mutation.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          )}

          {/* ── Variants tab ── */}
          {tab === 'variants' && isEdit && (
            <div className="p-6 space-y-4">
              {optionNames.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-sm">No options defined.</p>
                  <p className="text-xs mt-1">Go to the Details tab and add option names (e.g. Size, Flavor) first.</p>
                </div>
              ) : (
                <>
                  {/* Options summary */}
                  <div className="flex flex-wrap gap-1.5">
                    {optionNames.map(n => (
                      <span key={n} className="text-xs bg-[#1A1A1A] text-white px-2.5 py-1 rounded-full font-medium">{n}</span>
                    ))}
                  </div>

                  {/* Variants list */}
                  {variants.length > 0 ? (
                    <div className="bg-white border border-gray-200 rounded-lg px-4 divide-y divide-gray-100">
                      {variants.map(v => (
                        <VariantRow
                          key={v.id}
                          variant={v}
                          optionNames={optionNames}
                          productId={product!.id}
                          onDeleted={() => {}}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-6">No variants yet. Add your first variant below.</p>
                  )}

                  {/* Add variant */}
                  {showAddVariant ? (
                    <AddVariantForm
                      productId={product!.id}
                      optionNames={optionNames}
                      onAdded={() => setShowAddVariant(false)}
                      onCancel={() => setShowAddVariant(false)}
                    />
                  ) : (
                    <button
                      onClick={() => setShowAddVariant(true)}
                      className="flex items-center gap-2 text-sm font-medium text-[#1A1A1A] border border-dashed border-gray-300 rounded-lg px-4 py-2.5 hover:border-[#1A1A1A] hover:bg-gray-50 transition w-full justify-center"
                    >
                      <Plus size={15} />
                      Add Variant
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
