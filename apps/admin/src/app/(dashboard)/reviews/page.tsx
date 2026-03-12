'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, Trash2, Star } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { formatDate } from '@owntown/utils'

interface Review {
  id: string
  userId: string
  orderId: string
  productId: string
  rating: number
  comment: string | null
  isApproved: boolean
  createdAt: string
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={13}
          className={i <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}
        />
      ))}
    </div>
  )
}

export default function ReviewsPage() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending')

  const approvedParam = filter === 'approved' ? 'true' : filter === 'pending' ? 'false' : undefined

  const { data: reviews = [], isLoading } = useQuery<Review[]>({
    queryKey: ['admin-reviews', filter],
    queryFn: () =>
      api.get(`/admin/reviews${approvedParam !== undefined ? `?approved=${approvedParam}` : ''}`).then(r => r.data),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-reviews'] })

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/reviews/${id}/approve`).then(r => r.data),
    onSuccess: () => { invalidate(); toast.success('Review approved') },
    onError: () => toast.error('Failed to approve'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/reviews/${id}`).then(r => r.data),
    onSuccess: () => { invalidate(); toast.success('Review deleted') },
    onError: () => toast.error('Failed to delete'),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
          <p className="text-sm text-gray-400 mt-0.5">{reviews.length} {filter === 'all' ? 'total' : filter}</p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {(['pending', 'approved', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition capitalize ${
                filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-gray-400">Loading...</div>
      ) : (
        <div className="space-y-3">
          {reviews.map(r => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <Stars rating={r.rating} />
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      r.isApproved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {r.isApproved ? 'Approved' : 'Pending'}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(r.createdAt)}</span>
                  </div>
                  {r.comment && (
                    <p className="text-sm text-gray-700">{r.comment}</p>
                  )}
                  <div className="flex gap-4 text-xs text-gray-400 font-mono">
                    <span>Product: {r.productId.slice(0, 8)}…</span>
                    <span>Order: {r.orderId.slice(0, 8)}…</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!r.isApproved && (
                    <button
                      onClick={() => approveMutation.mutate(r.id)}
                      disabled={approveMutation.isPending}
                      className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                      title="Approve"
                    >
                      <CheckCircle size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => { if (confirm('Delete this review?')) deleteMutation.mutate(r.id) }}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {reviews.length === 0 && (
            <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
              No {filter === 'all' ? '' : filter} reviews
            </div>
          )}
        </div>
      )}
    </div>
  )
}
