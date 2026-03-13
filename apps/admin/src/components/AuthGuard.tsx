'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      router.replace('/login')
    }
  }, [router])

  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null
  if (!token) return null

  return <>{children}</>
}
