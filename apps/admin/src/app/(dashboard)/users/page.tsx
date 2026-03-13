'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { api } from '@/lib/api'
import { formatDate } from '@owntown/utils'

interface AdminUser {
  id: string
  name: string | null
  phone: string
  email: string | null
  isActive: boolean
  createdAt: string
}

export default function UsersPage() {
  const [search, setSearch] = useState('')

  const { data: users = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/admin/users?limit=500').then(r => r.data),
  })

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    return (
      u.phone.includes(q) ||
      (u.name ?? '').toLowerCase().includes(q) ||
      (u.email ?? '').toLowerCase().includes(q)
    )
  })

  const initials = (u: AdminUser) => {
    const name = u.name ?? u.phone
    return name.slice(0, 2).toUpperCase()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">{users.length} total</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, phone or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="field-input pl-9"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-gray-400">Loading users...</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-[#1A1A1A]">{initials(user)}</span>
                      </div>
                      <span className="font-semibold text-[#1A1A1A]">
                        {user.name ?? <span className="text-gray-400 font-normal italic">No name</span>}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-700 font-mono text-xs">{user.phone}</td>
                  <td className="px-5 py-4 text-gray-500">
                    {user.email ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-4 text-gray-500">{formatDate(user.createdAt)}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      user.isActive
                        ? 'bg-[#E6F9ED] text-[#00843C]'
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-gray-400">
                    {search ? 'No users match your search' : 'No users yet'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
