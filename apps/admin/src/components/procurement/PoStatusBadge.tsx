import type { PoStatus } from '@owntown/types'

const STYLE: Record<PoStatus, string> = {
  draft:     'bg-gray-100 text-gray-600',
  sent:      'bg-blue-50 text-blue-700',
  confirmed: 'bg-purple-50 text-purple-700',
  partial:   'bg-amber-50 text-amber-700',
  received:  'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-500',
}

export default function PoStatusBadge({ status }: { status: PoStatus }) {
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STYLE[status]}`}>
      {status}
    </span>
  )
}
