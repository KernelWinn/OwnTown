'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, ToggleLeft, ToggleRight } from 'lucide-react'
import { toast } from 'sonner'
import { procurementApi } from '@/lib/api-helpers'
import SupplierFormModal from '@/components/procurement/SupplierFormModal'
import type { Supplier } from '@owntown/types'

export default function SuppliersPage() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<Supplier | null | 'new'>(null)

  const { data: suppliers = [], isLoading } = useQuery<Supplier[]>({
    queryKey: ['suppliers'],
    queryFn: procurementApi.listSuppliers,
  })

  async function toggleActive(s: Supplier) {
    try {
      await procurementApi.updateSupplier(s.id, { isActive: !s.isActive })
      qc.invalidateQueries({ queryKey: ['suppliers'] })
    } catch {
      toast.error('Failed to update supplier')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Suppliers</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your procurement suppliers</p>
        </div>
        <button
          onClick={() => setEditing('new')}
          className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] text-white text-sm font-semibold rounded-lg hover:bg-[#2A2A2A] transition"
        >
          <Plus size={16} />
          Add Supplier
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-gray-400">Loading…</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Supplier</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">GST</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Payment Terms</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {suppliers.map(s => (
                <tr key={s.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-[#1A1A1A]">{s.name}</p>
                    {s.email && <p className="text-xs text-gray-400">{s.email}</p>}
                  </td>
                  <td className="px-5 py-4 text-gray-600">{s.contactName ?? '—'}</td>
                  <td className="px-5 py-4 font-mono text-xs text-gray-500">{s.gstNumber ?? '—'}</td>
                  <td className="px-5 py-4 text-gray-600">{s.paymentTerms ?? '—'}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.isActive ? 'bg-[#E6F9ED] text-[#00843C]' : 'bg-gray-100 text-gray-400'}`}>
                        {s.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => toggleActive(s)}
                        className="p-1.5 text-gray-400 hover:text-[#1A1A1A] hover:bg-gray-100 rounded-lg transition"
                        title={s.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {s.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      </button>
                      <button
                        onClick={() => setEditing(s)}
                        className="p-1.5 text-gray-400 hover:text-[#1A1A1A] hover:bg-gray-100 rounded-lg transition"
                      >
                        <Pencil size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {suppliers.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-gray-400">No suppliers yet. Add your first supplier.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <SupplierFormModal
          supplier={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
          onSuccess={() => {
            setEditing(null)
            qc.invalidateQueries({ queryKey: ['suppliers'] })
          }}
        />
      )}
    </div>
  )
}
