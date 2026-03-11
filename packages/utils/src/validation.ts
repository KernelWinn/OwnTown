/** Indian mobile number validation (10 digits, starts with 6-9) */
export function isValidIndianPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone.replace(/\D/g, ''))
}

/** Indian pincode validation (6 digits) */
export function isValidPincode(pincode: string): boolean {
  return /^\d{6}$/.test(pincode)
}

/** Normalize phone — strip country code, keep 10 digits */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('91') && digits.length === 12) {
    return digits.slice(2)
  }
  return digits
}
