export interface User {
  id: string
  phone: string
  email?: string
  name?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface UserProfile extends User {
  addresses: Address[]
}

export interface OtpRequest {
  phone: string
}

export interface OtpVerify {
  phone: string
  otp: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthResponse {
  user: User
  tokens: AuthTokens
  isNewUser: boolean
}

// imported below — forward declare to avoid circular
import type { Address } from './address'
