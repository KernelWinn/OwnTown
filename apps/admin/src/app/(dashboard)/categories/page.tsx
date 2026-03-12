'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Tag } from 'lucide-react'
import { toast } from 'sonner'
import { categoriesApi } from '@/lib/api-helpers'
import { CategoryFormModal } from '@/components/categories/CategoryFormModal'
import type { Category } from '@owntown/types'

export default function CategoriesPage() {
  const qc = useQueryClient()
  const [editCategory, setEditCategory] = useState<Category | null>(null)
  const [showForm, setShowForm] = useState(false)

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories-all'],
    queryFn: () => categoriesApi.list(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories-all'] })
      toast.success('Category deleted')
    },
    onError: () => toast.error('Failed to delete category'),
  })

  // Separate top-level and subcategories
  const topLevel = categories.filter(c => !c.parentId)
  const subMap = categories.reduce<Record<string, Category[]>>((acc, c) => {
    if (c.parentId) {
      acc[c.parentId] = [...(acc[c.parentId] ?? []), c]
    }
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <button
          onClick={() => { setEditCategory(null); setShowForm(true) }}
          className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-700 transition"
        >
          <Plus size={16} />
          Add Category
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-gray-400">Loading...</div>
      ) : (
        <div className="space-y-3">
          {topLevel.map(cat => (
            <div key={cat.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {/* Parent category row */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  {cat.imageUrl ? (
                    <img src={cat.imageUrl} alt={cat.name} className="w-9 h-9 rounded-lg object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
                      <Tag size={15} className="text-violet-500" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{cat.name}</p>
                    <p className="text-xs text-gray-400">/{cat.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    cat.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {cat.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {subMap[cat.id]?.length ?? 0} subcategories
                  </span>
                  <button
                    onClick={() => { setEditCategory(cat); setShowForm(true) }}
                    className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${cat.name}"?`)) deleteMutation.mutate(cat.id)
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Subcategories */}
              {(subMap[cat.id] ?? []).map(sub => (
                <div key={sub.id} className="flex items-center justify-between px-5 py-3 pl-14 border-b border-gray-50 last:border-0 bg-gray-50/30">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-gray-300" />
                    <p className="text-sm text-gray-700">{sub.name}</p>
                    <p className="text-xs text-gray-400">/{sub.slug}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setEditCategory(sub); setShowForm(true) }}
                      className="p-1.5 text-gray-400 hover:text-violet-600 rounded-lg transition"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${sub.name}"?`)) deleteMutation.mutate(sub.id)
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {topLevel.length === 0 && (
            <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
              No categories yet. Add your first category.
            </div>
          )}
        </div>
      )}

      {showForm && (
        <CategoryFormModal
          category={editCategory}
          categories={topLevel}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false)
            qc.invalidateQueries({ queryKey: ['categories-all'] })
          }}
        />
      )}
    </div>
  )
}
