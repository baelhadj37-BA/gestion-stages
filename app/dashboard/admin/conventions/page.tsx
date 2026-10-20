// app/dashboard/admin/conventions/page.tsx
// Validation des conventions — Espace admin (section Lamine)

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface ConventionAValider {
  id: number
  stage: {
    etudiant: { nom: string; prenom: string }
    candidature: { offre: { entreprise: { nom: string } } }
  }
}

export default function ConventionsAdminPage() {
  const router = useRouter()
  const [conventions, setConventions] = useState<ConventionAValider[]>([])
  const [chargement, setChargement] = useState(true)
  const [motifsRejet, setMotifsRejet] = useState<Record<number, string>>({})
  const [enCours, setEnCours] = useState<number | null>(null)
  const [erreur, setErreur] = useState('')

  const chargerListe = async (token: string) => {
    const res = await fetch('/api/convention/en-attente-admin', {
      headers: { authorization: `Bearer ${token}` },
    })
    if (res.ok) setConventions(await res.json())
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')

    if (!token || !user) {
      router.push('/login')
      return
    }

    const userData = JSON.parse(user)
    if (userData.role !== 'ADMIN') {
      router.push('/login')
      return
    }

    chargerListe(token).finally(() => setChargement(false))
  }, [router])

  const validerConvention = async (id: number, action: 'VALIDER' | 'REJETER') => {
    setErreur('')
    setEnCours(id)
    const token = localStorage.getItem('token')!
    const res = await fetch(`/api/convention/${id}/admin`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ action, motifRejet: motifsRejet[id] ?? '' }),
    })
    setEnCours(null)
    if (!res.ok) {
      const data = await res.json()
      setErreur(data.error ?? 'Action impossible.')
      return
    }
    await chargerListe(token)
  }

  if (chargement) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #1a237e 0%, #1565c0 100%)' }}>
        <div className="text-white text-xl">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-blue-900">
            Conventions à valider ({conventions.length})
          </h1>
          <a href="/dashboard/admin" className="text-blue-700 hover:underline text-sm font-medium">
            ← Retour au tableau de bord
          </a>
        </div>

        {erreur && (
          <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            ⚠️ {erreur}
          </div>
        )}

        {conventions.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-400">
            <p className="text-4xl mb-2">✅</p>
            <p>Aucune convention en attente de validation finale.</p>
          </div>
        )}

        <div className="space-y-4">
          {conventions.map((c) => (
            <div key={c.id} className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-blue-900">
              <h3 className="font-medium text-gray-800 mb-1">
                {c.stage.etudiant.prenom} {c.stage.etudiant.nom}
              </h3>
              <p className="text-sm text-gray-500 mb-3">
                Entreprise : {c.stage.candidature.offre.entreprise.nom}
              </p>
              <input
                placeholder="Motif de rejet (si rejet)"
                value={motifsRejet[c.id] ?? ''}
                onChange={(e) => setMotifsRejet({ ...motifsRejet, [c.id]: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-900 mb-3"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => validerConvention(c.id, 'REJETER')}
                  disabled={enCours === c.id}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                >
                  Rejeter
                </button>
                <button
                  onClick={() => validerConvention(c.id, 'VALIDER')}
                  disabled={enCours === c.id}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                  style={{ backgroundColor: '#1a237e' }}
                >
                  {enCours === c.id ? 'Envoi...' : 'Valider (génère le PDF + QR Code)'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}