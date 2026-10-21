// app/dashboard/admin/conventions/page.tsx
// Validation officielle des conventions — Administration (URL dédiée)

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ConventionAValider {
  id: number
  statut?: string
  stage: {
    etudiant: { nom: string; prenom: string; matricule?: string; classe?: string }
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
  const [succes, setSucces] = useState('')

  const chargerListe = async (token: string) => {
    const res = await fetch('/api/convention/en-attente-admin', {
      headers: { authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      setConventions(await res.json())
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
      if (userData.role !== 'ADMIN') {
        router.push('/login')
        return
      }
    } catch {
      router.push('/login')
      return
    }

    chargerListe(token).finally(() => setChargement(false))
  }, [router])

  const validerConvention = async (id: number, action: 'VALIDER' | 'REJETER') => {
    setErreur('')
    setSucces('')
    setEnCours(id)
    const token = localStorage.getItem('token')!
    try {
      const res = await fetch(`/api/convention/${id}/admin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, motifRejet: motifsRejet[id] ?? '' }),
      })
      if (!res.ok) {
        const data = await res.json()
        setErreur(data.error ?? 'Action impossible.')
        return
      }
      setSucces(action === 'VALIDER' ? 'Convention certifiée avec QR Code et PDF généré !' : 'Convention rejetée.')
      await chargerListe(token)
    } catch {
      setErreur('Erreur de communication avec le serveur.')
    } finally {
      setEnCours(null)
    }
  }

  if (chargement) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #0b3590 0%, #1565e8 100%)' }}
      >
        <div className="text-white text-xl">Chargement des conventions...</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7fc', padding: '32px 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#0b2f7a' }}>
              Conventions à valider ({conventions.length})
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#5f6d8a' }}>
              Apposition du sceau officiel et du QR Code anti-falsification (Validation par l'administrateur)
            </p>
          </div>
          <Link
            href="/dashboard/admin"
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
            ← Retour au tableau de bord
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

        {conventions.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #eef2fa', padding: 48, textAlign: 'center', color: '#6b7a99' }}>
            <p style={{ fontSize: 44, margin: '0 0 10px' }}>✅</p>
            <h3 style={{ margin: 0, fontSize: 18, color: '#0b2f7a', fontWeight: 700 }}>
              Toutes les conventions ont été traitées
            </h3>
            <p style={{ margin: '6px 0 0', fontSize: 14 }}>
              Aucun dossier en attente de visa de l'administrateur.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {conventions.map((c) => (
              <div
                key={c.id}
                style={{
                  background: '#fff',
                  borderRadius: 14,
                  border: '1px solid #eef2fa',
                  borderLeft: '5px solid #0b2f7a',
                  padding: 24,
                  boxShadow: '0 2px 10px rgba(30,70,150,0.06)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#1d6fe8' }}>CONVENTION #{c.id}</span>
                    <h3 style={{ margin: '4px 0 2px', fontSize: 18, fontWeight: 700, color: '#0b2f7a' }}>
                      {c.stage.etudiant.prenom} {c.stage.etudiant.nom}
                    </h3>
                    <p style={{ margin: 0, fontSize: 13.5, color: '#5f6d8a' }}>
                      Entreprise d’accueil : <strong>{c.stage.candidature.offre.entreprise.nom}</strong>
                      {(c.stage.etudiant.classe || c.stage.etudiant.matricule) && (
                        <span> · Classe : {c.stage.etudiant.classe || 'N/A'} · Matricule : {c.stage.etudiant.matricule || 'N/A'}</span>
                      )}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: 999,
                      background: c.statut === 'ETAPE_ENTREPRISE' ? '#d9f5e3' : '#dbe8fd',
                      color: c.statut === 'ETAPE_ENTREPRISE' ? '#15803d' : '#1d56c9',
                    }}
                  >
                    {c.statut === 'ETAPE_ENTREPRISE' ? 'Accord Entreprise Donné ✓' : 'Initié par l’étudiant (En attente)'}
                  </span>
                </div>

                <input
                  placeholder="Motif de rejet (obligatoire en cas de rejet)..."
                  value={motifsRejet[c.id] ?? ''}
                  onChange={(e) => setMotifsRejet({ ...motifsRejet, [c.id]: e.target.value })}
                  style={{
                    width: '100%',
                    height: 42,
                    boxSizing: 'border-box',
                    padding: '0 12px',
                    borderRadius: 8,
                    border: '1px solid #dde4f1',
                    fontSize: 14,
                    outline: 'none',
                    marginBottom: 14,
                  }}
                />

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => validerConvention(c.id, 'REJETER')}
                    disabled={enCours === c.id}
                    style={{
                      padding: '10px 18px',
                      borderRadius: 8,
                      border: '1px solid #fecaca',
                      background: '#fff',
                      color: '#dc2626',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Rejeter
                  </button>
                  <button
                    onClick={() => validerConvention(c.id, 'VALIDER')}
                    disabled={enCours === c.id}
                    style={{
                      padding: '10px 22px',
                      borderRadius: 8,
                      border: 'none',
                      background: '#16a34a',
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {enCours === c.id ? 'Génération en cours...' : 'Valider (génère PDF + QR Code)'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
