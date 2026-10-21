// app/dashboard/etudiant/journal/page.tsx
// Journal de bord étudiant — URL autonome /dashboard/etudiant/journal

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface JournalEntree {
  id: number
  semaine: number
  activites: string
  heures: number
  date: string
  statut: string
  commentaire?: string | null
}

export default function JournalEtudiantPage() {
  const router = useRouter()
  const [journaux, setJournaux] = useState<JournalEntree[]>([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState('')

  // Formulaire d'ajout
  const [semaine, setSemaine] = useState<number>(1)
  const [heures, setHeures] = useState<number>(35)
  const [activites, setActivites] = useState('')
  const [soumission, setSoumission] = useState(false)

  const chargerJournaux = async (token: string) => {
    const res = await fetch('/api/journal/crud', {
      headers: { authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const data = await res.json()
      setJournaux(Array.isArray(data) ? data : [])
      if (Array.isArray(data) && data.length > 0) {
        setSemaine(Math.max(...data.map((j) => j.semaine || 1)) + 1)
      }
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')

    if (!token || !user) {
      router.push('/login')
      return
    }

    try {
      const userData = JSON.parse(user)
      if (userData.role !== 'ETUDIANT') {
        router.push('/login')
        return
      }
    } catch {
      router.push('/login')
      return
    }

    chargerJournaux(token).finally(() => setChargement(false))
  }, [router])

  const soumettreRapport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activites.trim()) {
      setErreur('Veuillez décrire vos activités de la semaine.')
      return
    }

    const token = localStorage.getItem('token')!
    setSoumission(true)
    setErreur('')
    setSucces('')

    try {
      const res = await fetch('/api/journal/crud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({
          semaine,
          heures,
          activites: activites.trim(),
          date: new Date().toISOString().split('T')[0],
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setErreur(data.error || 'Erreur lors de la soumission.')
        return
      }

      setSucces(`Rapport de la semaine ${semaine} enregistré avec succès !`)
      setActivites('')
      await chargerJournaux(token)
    } catch {
      setErreur('Erreur de connexion au serveur.')
    } finally {
      setSoumission(false)
    }
  }

  if (chargement) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #0b3590 0%, #1565e8 100%)' }}
      >
        <div className="text-white text-xl">Chargement de votre journal de bord...</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7fc', padding: '32px 24px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#0b2f7a' }}>
              Journal de bord hebdomadaire
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#5f6d8a' }}>
              Suivi et compte-rendu hebdomadaire des activités de stage
            </p>
          </div>
          <Link
            href="/dashboard/etudiant"
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#1d6fe8',
              textDecoration: 'none',
              padding: '8px 16px',
              borderRadius: 8,
              background: '#fff',
              border: '1px solid #dde4f1',
            }}
          >
            ← Retour à mon espace
          </Link>
        </div>

        {erreur && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '12px 16px', borderRadius: 10, marginBottom: 16, fontSize: 14 }}>
            ⚠️ {erreur}
          </div>
        )}

        {succes && (
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '12px 16px', borderRadius: 10, marginBottom: 16, fontSize: 14 }}>
            ✓ {succes}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 400px) 1fr', gap: 24 }}>
          {/* Formulaire de dépôt */}
          <section
            style={{
              background: '#fff',
              borderRadius: 14,
              border: '1px solid #eef2fa',
              padding: 24,
              boxShadow: '0 2px 10px rgba(30,70,150,0.06)',
              height: 'fit-content',
            }}
          >
            <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: '#0b2f7a' }}>
              Nouveau compte-rendu
            </h2>
            <form onSubmit={soumettreRapport} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0b2f7a', marginBottom: 4 }}>
                  Numéro de semaine
                </label>
                <input
                  type="number"
                  min={1}
                  value={semaine}
                  onChange={(e) => setSemaine(Number(e.target.value))}
                  style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 8, border: '1px solid #dde4f1', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0b2f7a', marginBottom: 4 }}>
                  Nombre d’heures effectuées
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={heures}
                  onChange={(e) => setHeures(Number(e.target.value))}
                  style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 8, border: '1px solid #dde4f1', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0b2f7a', marginBottom: 4 }}>
                  Activités et apprentissages réalisés
                </label>
                <textarea
                  rows={6}
                  value={activites}
                  onChange={(e) => setActivites(e.target.value)}
                  placeholder="Décrivez vos missions concrètes, vos réussites et les difficultés rencontrées..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #dde4f1', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                disabled={soumission}
                style={{
                  height: 44,
                  borderRadius: 8,
                  border: 'none',
                  background: '#1d6fe8',
                  color: '#fff',
                  fontSize: 14.5,
                  fontWeight: 600,
                  cursor: soumission ? 'not-allowed' : 'pointer',
                }}
              >
                {soumission ? 'Envoi en cours...' : 'Déposer ce rapport'}
              </button>
            </form>
          </section>

          {/* Liste des rapports déjà soumis */}
          <section
            style={{
              background: '#fff',
              borderRadius: 14,
              border: '1px solid #eef2fa',
              padding: 24,
              boxShadow: '0 2px 10px rgba(30,70,150,0.06)',
            }}
          >
            <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: '#0b2f7a' }}>
              Historique des rapports ({journaux.length})
            </h2>

            {journaux.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7a99' }}>
                <p style={{ fontSize: 36, margin: 0 }}>📝</p>
                <p style={{ margin: '8px 0 0', fontWeight: 600 }}>Aucun rapport soumis pour l’instant.</p>
                <p style={{ fontSize: 13, margin: '4px 0 0' }}>Remplissez le formulaire ci-contre pour débuter.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {journaux.map((j) => (
                  <div
                    key={j.id}
                    style={{
                      padding: 16,
                      borderRadius: 10,
                      border: '1px solid #eef2fa',
                      background: '#fafcff',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#0b2f7a' }}>
                        Semaine #{j.semaine}
                      </span>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 700,
                          background: j.statut === 'VALIDE' ? '#d9f5e3' : j.statut === 'REJETE' ? '#fde2e2' : '#dbe8fd',
                          color: j.statut === 'VALIDE' ? '#15803d' : j.statut === 'REJETE' ? '#b91c1c' : '#1d56c9',
                        }}
                      >
                        {j.statut}
                      </span>
                    </div>

                    <p style={{ margin: '6px 0', fontSize: 13.5, color: '#2d3b5a', whiteSpace: 'pre-wrap', lineHeight: '20px' }}>
                      {j.activites}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7a99', marginTop: 10, paddingTop: 8, borderTop: '1px solid #edf2f7' }}>
                      <span>Déposé le {new Date(j.date).toLocaleDateString('fr-FR')} · {j.heures}h</span>
                      {j.commentaire && (
                        <span style={{ color: '#b91c1c', fontWeight: 600 }}>
                          Remarque tuteur : {j.commentaire}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
