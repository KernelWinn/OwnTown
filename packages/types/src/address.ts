export interface Address {
  id: string
  userId: string
  label: string           // "Home", "Work", "Other"
  name: string            // Recipient name
  phone: string           // Recipient phone
  line1: string           // Flat/Building
  line2?: string          // Street/Area
  landmark?: string
  city: string
  state: string
  pincode: string
  isDefault: boolean
  latitude?: number
  longitude?: number
  createdAt: string
  updatedAt: string
}

export interface CreateAddressDto {
  label: string
  name: string
  phone: string
  line1: string
  line2?: string
  landmark?: string
  city: string
  state: string
  pincode: string
  isDefault?: boolean
  latitude?: number
  longitude?: number
}
