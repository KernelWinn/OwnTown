/** Generate human-readable order number: OT-20240312-0001 */
export function generateOrderNumber(date: Date, sequence: number): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const seq = String(sequence).padStart(4, '0')
  return `OT-${y}${m}${d}-${seq}`
}

/** Map Shiprocket status string to our ShipmentStatus */
export function mapShiprocketStatus(status: string): string {
  const map: Record<string, string> = {
    'Pickup Scheduled': 'pickup_scheduled',
    'Picked Up': 'picked_up',
    'In Transit': 'in_transit',
    'Out For Delivery': 'out_for_delivery',
    Delivered: 'delivered',
    'Delivery Failed': 'delivery_failed',
    'RTO Initiated': 'rto_initiated',
    'RTO Delivered': 'rto_delivered',
  }
  return map[status] ?? 'in_transit'
}
