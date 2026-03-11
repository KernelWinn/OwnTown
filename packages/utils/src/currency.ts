/** Convert paise to rupees string: 4999 → "₹49.99" */
export function formatPrice(paise: number): string {
  return `₹${(paise / 100).toFixed(2)}`
}

/** Convert rupees to paise: 49.99 → 4999 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100)
}

/** Calculate discount percentage */
export function discountPercent(price: number, mrp: number): number {
  if (mrp <= 0) return 0
  return Math.round(((mrp - price) / mrp) * 100)
}

/** Calculate GST amount from inclusive price */
export function gstFromInclusive(totalPaise: number, gstRate: number): number {
  if (gstRate === 0) return 0
  return Math.round(totalPaise - totalPaise / (1 + gstRate / 100))
}
