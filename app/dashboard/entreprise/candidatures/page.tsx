'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

/* ─── Types ─── */
interface Candidature {
  id: number
  statut: 'EN_ATTENTE' | 'ACCEPTEE' | 'REFUSEE'
  createdAt: string
  cvUrl: string
  lettreUrl: string | null
  etudiant: { id: number; nom: string; prenom: string; email: string }
  offre: { id: number; titre: string; domaine: string; duree: string }
}

interface Encadreur {
  id: number
  nom: string
  prenom: string
  email: string
}

const NAV = [
  { label: 'Tableau de bord', href: '/dashboard/entreprise' },
  { label: 'Mes offres de stage', href: '/dashboard/entreprise/offres' },
  { label: 'Mes candidatures', href: '/dashboard/entreprise/candidatures', actif: true },
  { label: 'Conventions', href: '/dashboard/entreprise/conventions' },
  { label: 'Messages', href: '/dashboard/entreprise/messages' },
  { label: 'Paramètres', href: '/dashboard/entreprise/parametres' },
]

const STATUT_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  EN_ATTENTE: { label: 'En attente', color: '#d97706', bg: '#fef3c7' },
  ACCEPTEE:   { label: 'Acceptée',   color: '#15803d', bg: '#dcfce7' },
  REFUSEE:    { label: 'Refusée',    color: '#dc2626', bg: '#fee2e2' },
}

function initiales(prenom: string, nom: string) {
  return `${(prenom[0] ?? '').toUpperCase()}${(nom[0] ?? '').toUpperCase()}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

/* ─── Modal Accepter ─── */
function ModalAccepter({
  candidature,
  encadreurs,
  onClose,
  onConfirm,
  loading,
}: {
  candidature: Candidature
  encadreurs: Encadreur[]
  onClose: () => void
  onConfirm: (data: { dateDebut: string; dateFin: string; encadreurId: number }) => void
  loading: boolean
}) {
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [encadreurId, setEncadreurId] = useState<number | ''>('')
  const [erreur, setErreur] = useState('')

  const soumettre = () => {
    if (!dateDebut || !dateFin) { setErreur('Les dates sont obligatoires'); return }
    if (!encadreurId) { setErreur('Choisissez un encadreur'); return }
    if (new Date(dateFin) <= new Date(dateDebut)) { setErreur('La date de fin doit être après la date de début'); return }
    onConfirm({ dateDebut, dateFin, encadreurId: Number(encadreurId) })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ background: 'white', borderRadius: 16, padding: 32, width: 480, maxWidth: '90vw' }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
          Accepter la candidature
        </h2>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: '#64748b' }}>
          {candidature.etudiant.prenom} {candidature.etudiant.nom} — {candidature.offre.titre}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
              Date de début *
            </label>
            <input
              type="date"
              value={dateDebut}
              onChange={e => setDateDebut(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
              Date de fin *
            </label>
            <input
              type="date"
              value={dateFin}
              onChange={e => setDateFin(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
              Encadreur *
            </label>
            <select
              value={encadreurId}
              onChange={e => setEncadreurId(Number(e.target.value))}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', background: 'white' }}
            >
              <option value="">— Choisir un encadreur —</option>
              {encadreurs.map(enc => (
                <option key={enc.id} value={enc.id}>
                  {enc.prenom} {enc.nom} ({enc.email})
                </option>
              ))}
            </select>
            {encadreurs.length === 0 && (
              <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>
                Aucun encadreur disponible. Créez d&apos;abord un compte ENCADREUR.
              </p>
            )}
          </div>

          {erreur && (
            <div style={{ padding: '10px 14px', background: '#fee2e2', borderRadius: 8, fontSize: 13, color: '#dc2626' }}>
              {erreur}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid #d1d5db', background: 'white', fontSize: 14, cursor: 'pointer', color: '#374151' }}
          >
            Annuler
          </button>
          <button
            onClick={soumettre}
            disabled={loading}
            style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#16a34a', color: 'white', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Traitement…' : "Confirmer l'acceptation"}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Page principale ─── */
export default function EntrepriseCandidatures() {
  const router = useRouter()
  const [candidatures, setCandidatures] = useState<Candidature[]>([])
  const [encadreurs, setEncadreurs] = useState<Encadreur[]>([])
  const [filtre, setFiltre] = useState<'TOUS' | 'EN_ATTENTE' | 'ACCEPTEE' | 'REFUSEE'>('TOUS')
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [modalCandidature, setModalCandidature] = useState<Candidature | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  /* Chargement des données */
  useEffect(() => {
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('role')
    if (!token || role !== 'ENTREPRISE') { router.push('/login'); return }

    const headers = { authorization: `Bearer ${token}` }

    // Charger candidatures + encadreurs en parallèle
    Promise.all([
      fetch('/api/candidatures', { headers }).then(r => r.json()),
      fetch('/api/admin/users?role=ENCADREUR', { headers }).then(r => r.json()).catch(() => ({ users: [] })),
    ]).then(([candJson, encJson]) => {
      if (candJson.candidatures) setCandidatures(candJson.candidatures)
      else setErreur(candJson.message ?? 'Erreur chargement candidatures')

      if (encJson.users) setEncadreurs(encJson.users)
    }).catch(() => setErreur('Erreur réseau'))
    .finally(() => setChargement(false))
  }, [router])

  /* Accepter une candidature */
  const accepter = async (data: { dateDebut: string; dateFin: string; encadreurId: number }) => {
    if (!modalCandidature) return
    const token = localStorage.getItem('token') ?? ''
    setActionLoading(true)
    try {
      const res = await fetch(`/api/candidatures/${modalCandidature.id}`, {
        method: 'PATCH',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'ACCEPTER', ...data }),
      })
      const json = await res.json()
      if (!res.ok) { alert(json.message ?? 'Erreur'); return }

      setCandidatures(prev => prev.map(c =>
        c.id === modalCandidature.id ? { ...c, statut: 'ACCEPTEE' } : c
      ))
      setModalCandidature(null)
    } catch { alert('Erreur réseau') }
    finally { setActionLoading(false) }
  }

  /* Refuser une candidature */
  const refuser = async (candidature: Candidature) => {
    if (!confirm(`Refuser la candidature de ${candidature.etudiant.prenom} ${candidature.etudiant.nom} ?`)) return
    const token = localStorage.getItem('token') ?? ''
    try {
      const res = await fetch(`/api/candidatures/${candidature.id}`, {
        method: 'PATCH',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'REFUSER' }),
      })
      if (!res.ok) { const j = await res.json(); alert(j.message ?? 'Erreur'); return }
      setCandidatures(prev => prev.map(c => c.id === candidature.id ? { ...c, statut: 'REFUSEE' } : c))
    } catch { alert('Erreur réseau') }
  }

  const filtrees = candidatures.filter(c => filtre === 'TOUS' || c.statut === filtre)

  if (chargement) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f0f4f8' }}>
      <div style={{ fontSize: 16, color: '#0d1b3e', fontWeight: 600 }}>Chargement…</div>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif", background: '#f0f4f8' }}>

      {/* Sidebar */}
      <aside style={{ width: 235, minWidth: 235, background: '#0d1b3e', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100 }}>
        <div style={{ padding: '18px 20px 16px' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'white' }}>IPD Stages</div>
          <div style={{ fontSize: 11, color: '#93c5fd', marginTop: 2 }}>Espace Entreprise</div>
        </div>
        <nav style={{ flex: 1, padding: '8px' }}>
          {NAV.map(item => (
            <button key={item.href} onClick={() => router.push(item.href)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', marginBottom: 2, background: item.actif ? '#2563eb' : 'transparent', color: item.actif ? 'white' : 'rgba(255,255,255,0.65)', fontWeight: item.actif ? 600 : 400, fontSize: 13.5, textAlign: 'left' }}>
              {item.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: '0 20px 24px' }}>
          <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('role'); router.push('/login') }} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.65)', fontSize: 13, cursor: 'pointer', textAlign: 'left' }}>
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Contenu */}
      <main style={{ marginLeft: 235, flex: 1, padding: '32px 32px' }}>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a' }}>Mes candidatures</h1>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: '#64748b' }}>Gérez les candidatures reçues pour vos offres de stage</p>
        </div>

        {erreur && (
          <div style={{ padding: '12px 16px', background: '#fee2e2', borderRadius: 10, color: '#dc2626', marginBottom: 20 }}>
            {erreur}
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Toutes',     val: candidatures.length,                                           color: '#2563eb', bg: '#dbeafe' },
            { label: 'En attente', val: candidatures.filter(c => c.statut === 'EN_ATTENTE').length,    color: '#d97706', bg: '#fef3c7' },
            { label: 'Acceptées',  val: candidatures.filter(c => c.statut === 'ACCEPTEE').length,     color: '#16a34a', bg: '#dcfce7' },
            { label: 'Refusées',   val: candidatures.filter(c => c.statut === 'REFUSEE').length,      color: '#dc2626', bg: '#fee2e2' },
          ].map(s => (
            <div key={s.label} style={{ background: 'white', borderRadius: 12, padding: '18px 20px', border: '1px solid #e8edf2' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, display: 'inline-block', padding: '2px 10px', background: s.bg, borderRadius: 20 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {([['TOUS', 'Toutes'], ['EN_ATTENTE', 'En attente'], ['ACCEPTEE', 'Acceptées'], ['REFUSEE', 'Refusées']] as const).map(([val, label]) => (
            <button key={val} onClick={() => setFiltre(val)} style={{ padding: '7px 16px', borderRadius: 20, border: '1.5px solid', fontSize: 13, fontWeight: 500, cursor: 'pointer', borderColor: filtre === val ? '#2563eb' : '#e2e8f0', background: filtre === val ? '#2563eb' : 'white', color: filtre === val ? 'white' : '#64748b' }}>
              {label} ({val === 'TOUS' ? candidatures.length : candidatures.filter(c => c.statut === val).length})
            </button>
          ))}
        </div>

        {/* Liste */}
        {filtrees.length === 0 ? (
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e8edf2', padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: 15 }}>
            Aucune candidature dans cette catégorie
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtrees.map(cand => {
              const st = STATUT_STYLE[cand.statut]
              return (
                <div key={cand.id} style={{ background: 'white', borderRadius: 12, border: '1px solid #e8edf2', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  {/* Avatar */}
                  <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: '#4f46e5', flexShrink: 0 }}>
                    {initiales(cand.etudiant.prenom, cand.etudiant.nom)}
                  </div>

                  {/* Infos */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                      {cand.etudiant.prenom} {cand.etudiant.nom}
                    </div>
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                      {cand.etudiant.email} · {cand.offre.titre} · {cand.offre.duree}
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                      Candidaté le {formatDate(cand.createdAt)}
                    </div>
                  </div>

                  {/* Documents */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <a href={cand.cvUrl} target="_blank" rel="noopener noreferrer" style={{ padding: '5px 12px', borderRadius: 6, background: '#f1f5f9', color: '#2563eb', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                      CV
                    </a>
                    {cand.lettreUrl && (
                      <a href={cand.lettreUrl} target="_blank" rel="noopener noreferrer" style={{ padding: '5px 12px', borderRadius: 6, background: '#f1f5f9', color: '#2563eb', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                        Lettre
                      </a>
                    )}
                  </div>

                  {/* Statut */}
                  <span style={{ fontSize: 12, fontWeight: 600, color: st.color, background: st.bg, borderRadius: 20, padding: '4px 12px', whiteSpace: 'nowrap' }}>
                    {st.label}
                  </span>

                  {/* Actions */}
                  {cand.statut === 'EN_ATTENTE' && (
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button
                        onClick={() => setModalCandidature(cand)}
                        style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#dcfce7', color: '#15803d', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                      >
                        Accepter
                      </button>
                      <button
                        onClick={() => refuser(cand)}
                        style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#fee2e2', color: '#dc2626', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                      >
                        Refuser
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Modal acceptation */}
      {modalCandidature && (
        <ModalAccepter
          candidature={modalCandidature}
          encadreurs={encadreurs}
          onClose={() => setModalCandidature(null)}
          onConfirm={accepter}
          loading={actionLoading}
        />
      )}
    </div>
  )
}
