// app/dashboard/admin/conventions/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Convention {
  id: number
  statut: string
  createdAt: string
  stage: {
    etudiant: { nom: string; prenom: string; email: string }
    candidature: { offre: { titre: string; entreprise: { nom: string; prenom: string } } }
  }
}

const STATUTS: Record<string, { label: string; color: string; bg: string }> = {
  ETAPE_ETUDIANT:   { label: 'En attente étudiant',   color: '#f59e0b', bg: '#fff8e1' },
  ETAPE_ENTREPRISE: { label: 'En attente entreprise',  color: '#1d6fe8', bg: '#e8f0fe' },
  ETAPE_ADMIN:      { label: 'À valider',              color: '#7c3aed', bg: '#ede9fe' },
  VALIDEE:          { label: 'Validée',                color: '#22c55e', bg: '#e8f5e9' },
  REJETEE:          { label: 'Rejetée',                color: '#ef4444', bg: '#fce8e8' },
}

const FILTRES = ['Toutes', 'À valider', 'Étape étudiant', 'Étape entreprise', 'Validées', 'Rejetées']
const STATUT_FILTRE: Record<string, string | null> = {
  'Toutes': null,
  'À valider': 'ETAPE_ADMIN',
  'Étape étudiant': 'ETAPE_ETUDIANT',
  'Étape entreprise': 'ETAPE_ENTREPRISE',
  'Validées': 'VALIDEE',
  'Rejetées': 'REJETEE',
}

export default function ConventionsAdminPage() {
  const router = useRouter()
  const [conventions, setConventions] = useState<Convention[]>([])
  const [filtre, setFiltre] = useState('Toutes')
  const [chargement, setChargement] = useState(true)
  const [motifsRejet, setMotifsRejet] = useState<Record<number, string>>({})
  const [enCours, setEnCours] = useState<number | null>(null)
  const [erreur, setErreur] = useState('')

  const chargerListe = async (token: string) => {
    const res = await fetch('/api/conventions', {
      headers: { authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const data = await res.json()
      setConventions(data.conventions ?? [])
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('role')
    if (!token || role !== 'ADMIN') { router.push('/login'); return }
    void (async () => { await chargerListe(token); setChargement(false) })()
  }, [router])

  const actionConvention = async (id: number, action: 'VALIDER' | 'REJETER') => {
    setErreur('')
    setEnCours(id)
    const token = localStorage.getItem('token')!
    const res = await fetch(`/api/conventions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ action, motifRejet: motifsRejet[id] ?? '' }),
    })
    setEnCours(null)
    if (!res.ok) {
      const data = await res.json()
      setErreur(data.message ?? 'Action impossible.')
      return
    }
    await chargerListe(localStorage.getItem('token')!)
  }

  const conventionsFiltrees = conventions.filter(c => {
    const s = STATUT_FILTRE[filtre]
    return s === null || c.statut === s
  })

  if (chargement) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div>Chargement…</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fc', padding: '32px 40px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0b2f7a', margin: 0 }}>
            Conventions de stage
          </h1>
          <a href="/dashboard/admin" style={{ color: '#1d6fe8', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            ← Retour
          </a>
        </div>

        {/* Filtres */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
          {FILTRES.map(f => (
            <button key={f} onClick={() => setFiltre(f)} style={{
              padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              border: filtre === f ? '2px solid #1d6fe8' : '2px solid #dde3f0',
              background: filtre === f ? '#1d6fe8' : '#fff',
              color: filtre === f ? '#fff' : '#6b7a99',
            }}>
              {f} {f === 'Toutes' ? `(${conventions.length})` : f === 'À valider' ? `(${conventions.filter(c => c.statut === 'ETAPE_ADMIN').length})` : ''}
            </button>
          ))}
        </div>

        {erreur && (
          <div style={{ background: '#fce8e8', border: '1px solid #f87171', color: '#ef4444', padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
            {erreur}
          </div>
        )}

        {conventionsFiltrees.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 14, padding: 60, textAlign: 'center', color: '#6b7a99' }}>
            Aucune convention trouvée
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {conventionsFiltrees.map(c => {
              const statut = STATUTS[c.statut] ?? { label: c.statut, color: '#666', bg: '#eee' }
              const offre = c.stage.candidature.offre
              return (
                <div key={c.id} style={{
                  background: '#fff', borderRadius: 14, padding: '20px 24px',
                  border: '1px solid #eef2fa', boxShadow: '0 2px 8px rgba(30,70,150,0.05)',
                  borderLeft: `4px solid ${statut.color}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#0b2f7a' }}>
                        {c.stage.etudiant.prenom} {c.stage.etudiant.nom}
                      </div>
                      <div style={{ fontSize: 13, color: '#1d6fe8', fontWeight: 600, marginTop: 2 }}>
                        {offre.titre}
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7a99', marginTop: 2 }}>
                        Entreprise : {offre.entreprise.prenom} {offre.entreprise.nom}
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7a99' }}>
                        Créée le {new Date(c.createdAt).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <span style={{
                      padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                      background: statut.bg, color: statut.color,
                    }}>
                      {statut.label}
                    </span>
                  </div>

                  {c.statut === 'ETAPE_ADMIN' && (
                    <div style={{ marginTop: 16, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        placeholder="Motif de rejet (si rejet)"
                        value={motifsRejet[c.id] ?? ''}
                        onChange={e => setMotifsRejet({ ...motifsRejet, [c.id]: e.target.value })}
                        style={{
                          flex: 1, minWidth: 200, padding: '8px 12px',
                          border: '1px solid #dde3f0', borderRadius: 8, fontSize: 13, outline: 'none',
                        }}
                      />
                      <button
                        onClick={() => actionConvention(c.id, 'REJETER')}
                        disabled={enCours === c.id}
                        style={{
                          padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                          background: '#fce8e8', color: '#ef4444', border: 'none', cursor: 'pointer',
                        }}
                      >
                        Rejeter
                      </button>
                      <button
                        onClick={() => actionConvention(c.id, 'VALIDER')}
                        disabled={enCours === c.id}
                        style={{
                          padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                          background: '#0b2f7a', color: '#fff', border: 'none', cursor: 'pointer',
                        }}
                      >
                        {enCours === c.id ? 'En cours…' : 'Valider'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}