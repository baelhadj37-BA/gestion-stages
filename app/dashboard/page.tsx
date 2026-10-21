'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardRedirect() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')

    if (!token || !userStr) {
      router.push('/login')
      return
    }

    try {
      const user = JSON.parse(userStr)
      switch (user.role) {
        case 'ADMIN':
          router.push('/dashboard/admin')
          break
        case 'ETUDIANT':
          router.push('/dashboard/etudiant')
          break
        case 'ENTREPRISE':
          router.push('/dashboard/entreprise')
          break
        case 'ENCADREUR':
          router.push('/dashboard/encadreur')
          break
        default:
          router.push('/login')
      }
    } catch {
      router.push('/login')
    }
  }, [router])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f4f7fc',
        color: '#0b2f7a',
        fontSize: 16,
        fontWeight: 600,
      }}
    >
      Redirection vers votre espace...
    </div>
  )
}
