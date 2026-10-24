'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Lire le rôle depuis localStorage et rediriger
    const role = localStorage.getItem('role')
    if (role === 'entreprise') {
      router.replace('/dashboard/entreprise')
    } else if (role === 'admin') {
      router.replace('/dashboard/admin')
    } else {
      // Par défaut : étudiant (ou non connecté → login)
      router.replace('/dashboard/etudiant')
    }
  }, [router])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f0f4f8',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48, height: 48, border: '4px solid #e2e8f0',
          borderTopColor: '#2563eb', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 16px',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <p style={{ color: '#64748b', fontSize: 14 }}>Redirection en cours…</p>
      </div>
    </div>
  )
}