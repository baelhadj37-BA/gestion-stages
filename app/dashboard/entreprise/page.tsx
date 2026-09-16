// app/dashboard/entreprise/page.tsx
// Tableau de bord entreprise — IPD Gestion des Stages

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface JournalAValider {
  id: number
  semaine: number
  contenu: string
  dateDepot: string
  stage: { etudiant: { nom: string; prenom: string } }
}

interface ConventionAValider {
  id: number
  stage: { etudiant: { nom: string; prenom: string } }
}

export default function EntrepriseDashboard() {
  const router = useRouter()
  const [entreprise, setEntreprise] = useState<{ nom: string; prenom: string } | null>(null)
  const [onglet, setOnglet] = useState('journaux')
  const [chargement, setChargement] = useState(true)

  const [journaux, setJournaux] = useState<JournalAValider[]>([])
  const [conventions, setConventions] = useState<ConventionAValider[]>([])
  const [commentaires, setCommentaires] = useState<Record<number, string>>({})
  const [motifsRejet, setMotifsRejet] = useState<Record<number, string>>({})
  const [enCours, setEnCours] = useState<number | null>(null)
  const [erreur, setErreur] = useState('')

  const chargerListes = async (token: string) => {
    const [jRes, cRes] = await Promise.all([
      fetch('/api/journal/en-attente', { headers: { authorization: `Bearer ${token}` } }),
      fetch('/api/convention/en-attente', { headers: { authorization: `Bearer ${token}` } }),
    ])
    if (jRes.ok) setJournaux(await jRes.json())
    if (cRes.ok) setConventions(await cRes.json())
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')

    if (!token || !user) {
      router.push('/login')
      return
    }

    const userData = JSON.parse(user)
    if (userData.role !== 'ENTREPRISE') {
      router.push('/login')
      return
    }

    const fetchData = async () => {
      setEntreprise(userData)
      await chargerListes(token)
      setChargement(false)
    }

    fetchData()
  }, [router])

  const seDeconnecter = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  const validerJournal = async (id: number, statut: 'VALIDE' | 'REJETE') => {
    setErreur('')
    setEnCours(id)
    const token = localStorage.getItem('token')!
    const res = await fetch(`/api/journal/${id}/validate`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ statut, commentaire: commentaires[id] ?? '' }),
    })
    setEnCours(null)
    if (!res.ok) {
      const data = await res.json()
      setErreur(data.error ?? 'Action impossible.')
      return
    }
    await chargerListes(token)
  }

  const validerConvention = async (id: number, action: 'VALIDER' | 'REJETER') => {
    setErreur('')
    setEnCours(id)
    const token = localStorage.getItem('token')!
    const res = await fetch(`/api/convention/${id}/entreprise`, {
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
    await chargerListes(token)
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
    <div className="min-h-screen bg-gray-100">

      <nav className="text-white shadow-lg px-6 py-4 flex items-center justify-between"
        style={{ backgroundColor: '#1a237e' }}>
        <div className="flex items-center gap-3">
          <Image src="/logo-ipd.png" alt="Logo IPD" width={40} height={40}
            className="object-contain" style={{ mixBlendMode: 'multiply', filter: 'brightness(0) invert(1)' }} />
          <div>
            <h1 className="font-bold text-lg">IPD Gestion des Stages</h1>
            <p className="text-blue-200 text-xs">Espace entreprise</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-blue-200 text-sm">
            Bonjour, {entreprise?.prenom} {entreprise?.nom}
          </span>
          <button onClick={seDeconnecter}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Déconnexion
          </button>
        </div>
      </nav>

      <div className="flex">

        <aside className="w-64 bg-white shadow-md min-h-screen p-4">
          <nav className="space-y-2">
            {[
              { id: 'journaux', label: `📓 Journaux à valider (${journaux.length})` },
              { id: 'conventions', label: `📄 Conventions à valider (${conventions.length})` },
            ].map((item) => (
              <button key={item.id} onClick={() => setOnglet(item.id)}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                  onglet === item.id ? 'text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
                style={onglet === item.id ? { backgroundColor: '#1a237e' } : {}}>
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-6">

          {erreur && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              ⚠️ {erreur}
            </div>
          )}

          {onglet === 'journaux' && (
            <div>
              <h2 className="text-2xl font-bold text-blue-900 mb-6">Journaux à valider</h2>

              {journaux.length === 0 && (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-400">
                  <p className="text-4xl mb-2">✅</p>
                  <p>Aucun journal en attente de validation.</p>
                </div>
              )}

              <div className="space-y-4">
                {journaux.map((j) => (
                  <div key={j.id} className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-blue-900">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-800">
                        {j.stage.etudiant.prenom} {j.stage.etudiant.nom} — Semaine {String(j.semaine).padStart(2, '0')}
                      </h3>
                      <span className="text-xs text-gray-400">
                        {new Date(j.dateDepot).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{j.contenu}</p>
                    <textarea
                      placeholder="Commentaire (optionnel)"
                      value={commentaires[j.id] ?? ''}
                      onChange={(e) => setCommentaires({ ...commentaires, [j.id]: e.target.value })}
                      rows={2}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-900 mb-3 resize-none"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => validerJournal(j.id, 'REJETE')}
                        disabled={enCours === j.id}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                      >
                        Rejeter
                      </button>
                      <button
                        onClick={() => validerJournal(j.id, 'VALIDE')}
                        disabled={enCours === j.id}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                        style={{ backgroundColor: '#1a237e' }}
                      >
                        {enCours === j.id ? 'Envoi...' : 'Valider'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {onglet === 'conventions' && (
            <div>
              <h2 className="text-2xl font-bold text-blue-900 mb-6">Conventions à valider</h2>

              {conventions.length === 0 && (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-400">
                  <p className="text-4xl mb-2">✅</p>
                  <p>Aucune convention en attente de validation.</p>
                </div>
              )}

              <div className="space-y-4">
                {conventions.map((c) => (
                  <div key={c.id} className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-blue-900">
                    <h3 className="font-medium text-gray-800 mb-3">
                      {c.stage.etudiant.prenom} {c.stage.etudiant.nom}
                    </h3>
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
                        {enCours === c.id ? 'Envoi...' : 'Valider'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}