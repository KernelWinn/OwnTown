import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'
import { api } from '@/lib/api'
import type { User } from '@owntown/types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  initialize: () => Promise<void>
  sendOtp: (phone: string) => Promise<boolean>
  verifyOtp: (phone: string, otp: string) => Promise<{ success: boolean; isNewUser: boolean }>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  initialize: async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken')
      if (!token) return
      const { data } = await api.get('/auth/me')
      set({ user: data, isAuthenticated: true })
    } catch {
      await SecureStore.deleteItemAsync('accessToken')
      await SecureStore.deleteItemAsync('refreshToken')
    }
  },

  sendOtp: async (phone) => {
    set({ isLoading: true })
    try {
      await api.post('/auth/otp/send', { phone })
      return true
    } catch {
      return false
    } finally {
      set({ isLoading: false })
    }
  },

  verifyOtp: async (phone, otp) => {
    set({ isLoading: true })
    try {
      const { data } = await api.post('/auth/otp/verify', { phone, otp })
      await SecureStore.setItemAsync('accessToken', data.tokens.accessToken)
      await SecureStore.setItemAsync('refreshToken', data.tokens.refreshToken)
      set({ user: data.user, isAuthenticated: true })
      return { success: true, isNewUser: data.isNewUser }
    } catch {
      return { success: false, isNewUser: false }
    } finally {
      set({ isLoading: false })
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('accessToken')
    await SecureStore.deleteItemAsync('refreshToken')
    set({ user: null, isAuthenticated: false })
  },
}))
