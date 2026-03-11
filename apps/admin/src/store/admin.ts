import { create } from 'zustand'

interface AdminUser {
  id: string
  email: string
  name: string
}

interface AdminState {
  admin: AdminUser | null
  isAuthenticated: boolean
  setAdmin: (admin: AdminUser, token: string) => void
  logout: () => void
}

export const useAdminStore = create<AdminState>(set => ({
  admin: null,
  isAuthenticated: typeof window !== 'undefined' && !!localStorage.getItem('adminToken'),

  setAdmin: (admin, token) => {
    localStorage.setItem('adminToken', token)
    set({ admin, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('adminToken')
    set({ admin: null, isAuthenticated: false })
    window.location.href = '/login'
  },
}))
