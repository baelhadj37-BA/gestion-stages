// app/dashboard/entreprise/candidatures/page.tsx
// Candidatures reçues — vue Entreprise

'use client'

import {
  useState,
  useEffect,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'

/* ───────── Types ───────── */

type StatutCandidature = 'EN_ATTENTE' | 'ACCEPTEE' | 'REFUSEE'

interface Candidature {
  id: number
  statut: StatutCandidature
  createdAt: string
  lettreMotivation: string | null
  offre: {
    id: number
    titre: string
    domaine: string
    duree: string
  }
  etudiant: {
    id: number
    nom: string
    prenom: string
    email: string
    filiere: string | null
    classe: string | null
  } | null
}

/* ───────── Mise à l'échelle ───────── */

const LARGEUR_MAQUETTE = 1672

const abonnerRedimension = (rappel: () => void) => {
  window.addEventListener('resize', rappel)
  return () => window.removeEventListener('resize', rappel)
}
const lireLargeur = () => window.innerWidth
const largeurServeur = () => LARGEUR_MAQUETTE

/* ───────── Icônes ───────── */

const ICONS: Record<string, ReactNode> = {
  candidatures: (
    <>
      <path d="M9 12h6M9 16h4M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
      <path d="M9 8h6" />
    </>
  ),
  check: (<polyline points="20 6 9 17 4 12" />),
  x: (
    <>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </>
  ),
  briefcase: (
    <>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </>
  ),
  user: (
    <>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
  filter: (
    <>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </>
  ),
  plus: (
    <>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </>
  ),
  eye: (
    <>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
}

function Icon({
  id,
  size = 20,
  color = 'currentColor',
  style,
}: {
  id: string
  size?: number
  color?: string
  style?: CSSProperties
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {ICONS[id]}
    </svg>
  )
}

/* ───────── Constantes visuelles ───────── */

const NAVY = '#0b2f7a'
const BLUE = '#1d6fe8'
const MUTED = '#6b7a99'

const CARTE: CSSProperties = {
  background: '#fff',
  borderRadius: 14,
  border: '1px solid #eef2fa',
  boxShadow: '0 2px 10px rgba(30,70,150,0.06)',
}

/* ───────── Helpers ───────── */

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function initiales(nom: string, prenom: string) {
  return `${(prenom[0] ?? '').toUpperCase()}${(nom[0] ?? '').toUpperCase()}`
}

const STATUTS: Record<StatutCandidature, { label: string; bg: string; color: string }> = {
  EN_ATTENTE: { label: 'En attente', bg: '#fff8e1', color: '#f59e0b' },
  ACCEPTEE:   { label: 'Acceptée',   bg: '#e8f5e9', color: '#22c55e' },
  REFUSEE:    { label: 'Refusée',    bg: '#fce8e8', color: '#ef4444' },
}

/* ───────── Modal de décision ───────── */

interface ModalDecisionProps {
  candidature: Candidature
  onFermer: () => void
  onTraitee: (id: number, newStatut: StatutCandidature) => void
}

function ModalDecision({ candidature, onFermer, onTraitee }: ModalDecisionProps) {
  const [action, setAction] = useState<'ACCEPTER' | 'REFUSER' | null>(null)
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState('')

  const valider = async () => {
    if (!action) return
    if (action === 'ACCEPTER' && (!dateDebut || !dateFin)) {
      setErreur('Veuillez indiquer les dates de début et de fin du stage.')
      return
    }
    setErreur('')
    setChargement(true)

    const token = localStorage.getItem('token')
    const body: Record<string, string> = { action }
    if (action === 'ACCEPTER') {
      body.dateDebut = dateDebut
      body.dateFin = dateFin
    }

    try {
      const res = await fetch(`/api/candidatures/${candidature.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) {
        setErreur(json.message ?? 'Une erreur est survenue')
        return
      }
      onTraitee(candidature.id, action === 'ACCEPTER' ? 'ACCEPTEE' : 'REFUSEE')
      onFermer()
    } catch {
      setErreur('Erreur réseau. Veuillez réessayer.')
    } finally {
      setChargement(false)
    }
  }

  const etu = candidature.etudiant

  return (
    <div
      onClick={onFermer}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          ...CARTE,
          width: 520, padding: '36px 40px',
          display: 'flex', flexDirection: 'column', gap: 20,
        }}
      >
        {/* En-tête */}
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: NAVY }}>
            Traiter la candidature
          </h2>
          <p style={{ margin: '6px 0 0', color: MUTED, fontSize: 13 }}>
            Offre : <strong>{candidature.offre.titre}</strong>
          </p>
        </div>

        {/* Profil étudiant */}
        {etu && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 16px', background: '#f5f7fc', borderRadius: 10,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: BLUE, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 700,
            }}>
              {initiales(etu.nom, etu.prenom)}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: NAVY }}>
                {etu.prenom} {etu.nom}
              </div>
              <div style={{ fontSize: 12, color: MUTED }}>
                {etu.email}
                {etu.filiere && ` · ${etu.filiere}`}
                {etu.classe && ` – ${etu.classe}`}
              </div>
            </div>
          </div>
        )}

        {/* Lettre de motivation */}
        {candidature.lettreMotivation && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Lettre de motivation
            </div>
            <p style={{
              margin: 0, padding: '12px 16px',
              background: '#f5f7fc', borderRadius: 10,
              fontSize: 13, color: NAVY, lineHeight: 1.7,
              maxHeight: 120, overflowY: 'auto',
            }}>
              {candidature.lettreMotivation}
            </p>
          </div>
        )}

        {/* Choix action */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Décision
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => setAction('ACCEPTER')}
              style={{
                flex: 1, padding: '12px',
                border: `2px solid ${action === 'ACCEPTER' ? '#22c55e' : '#dde3f0'}`,
                borderRadius: 10, cursor: 'pointer',
                background: action === 'ACCEPTER' ? '#e8f5e9' : '#fff',
                color: action === 'ACCEPTER' ? '#22c55e' : MUTED,
                fontSize: 14, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <Icon id="check" size={16} color={action === 'ACCEPTER' ? '#22c55e' : MUTED} />
              Accepter
            </button>
            <button
              onClick={() => setAction('REFUSER')}
              style={{
                flex: 1, padding: '12px',
                border: `2px solid ${action === 'REFUSER' ? '#ef4444' : '#dde3f0'}`,
                borderRadius: 10, cursor: 'pointer',
                background: action === 'REFUSER' ? '#fce8e8' : '#fff',
                color: action === 'REFUSER' ? '#ef4444' : MUTED,
                fontSize: 14, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <Icon id="x" size={16} color={action === 'REFUSER' ? '#ef4444' : MUTED} />
              Refuser
            </button>
          </div>
        </div>

        {/* Dates si ACCEPTER */}
        {action === 'ACCEPTER' && (
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: MUTED, display: 'block', marginBottom: 6 }}>
                Date de début *
              </label>
              <input
                type="date"
                value={dateDebut}
                onChange={e => setDateDebut(e.target.value)}
                style={{
                  width: '100%', padding: '9px 12px',
                  border: '1px solid #dde3f0', borderRadius: 8,
                  fontSize: 13, color: NAVY, outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: MUTED, display: 'block', marginBottom: 6 }}>
                Date de fin *
              </label>
              <input
                type="date"
                value={dateFin}
                onChange={e => setDateFin(e.target.value)}
                min={dateDebut}
                style={{
                  width: '100%', padding: '9px 12px',
                  border: '1px solid #dde3f0', borderRadius: 8,
                  fontSize: 13, color: NAVY, outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        )}

        {/* Erreur */}
        {erreur && (
          <div style={{ padding: '10px 14px', background: '#fce8e8', borderRadius: 8, fontSize: 13, color: '#ef4444' }}>
            {erreur}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            onClick={onFermer}
            style={{
              padding: '10px 24px', borderRadius: 8,
              border: '1px solid #dde3f0', background: '#fff',
              cursor: 'pointer', fontSize: 14, color: MUTED, fontWeight: 600,
            }}
          >
            Annuler
          </button>
          <button
            onClick={valider}
            disabled={!action || chargement}
            style={{
              padding: '10px 24px', borderRadius: 8,
              background: !action || chargement ? '#dde3f0' : BLUE,
              color: '#fff', border: 'none',
              cursor: !action || chargement ? 'not-allowed' : 'pointer',
              fontSize: 14, fontWeight: 700,
            }}
          >
            {chargement ? 'Enregistrement…' : 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════════════════ */

export default function PageCandidaturesEntreprise() {
  const router = useRouter()

  const largeur = useSyncExternalStore(abonnerRedimension, lireLargeur, largeurServeur)
  const echelle = largeur / LARGEUR_MAQUETTE

  const [candidatures, setCandidatures] = useState<Candidature[]>([])
  const [filtreStatut, setFiltreStatut] = useState<StatutCandidature | 'TOUS'>('TOUS')
  const [filtreOffre, setFiltreOffre] = useState('')
  const [recherche, setRecherche] = useState('')
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [utilisateur, setUtilisateur] = useState<{ nom: string; prenom: string } | null>(null)
  const [modalCand, setModalCand] = useState<Candidature | null>(null)

  /* ── Auth guard + chargement ── */
  useEffect(() => {
    const token = localStorage.getItem('token')
    const roleStocke = localStorage.getItem('role')
    if (!token || roleStocke !== 'ENTREPRISE') {
      router.push('/login')
      return
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      setUtilisateur({ nom: payload.nom ?? '', prenom: payload.prenom ?? '' })
    } catch { /* ignore */ }

    fetch('/api/candidatures', {
      headers: { authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(json => {
        if (json.data) setCandidatures(json.data)
        else setErreur(json.message ?? 'Erreur')
      })
      .catch(() => setErreur('Impossible de charger les candidatures'))
      .finally(() => setChargement(false))
  }, [router])

  /* ── Callback après traitement ── */
  const apresTraitement = (id: number, newStatut: StatutCandidature) => {
    setCandidatures(prev =>
      prev.map(c => c.id === id ? { ...c, statut: newStatut } : c)
    )
  }

  /* ── Listes filtrées ── */
  const titresOffres = [...new Set(candidatures.map(c => c.offre.titre))]

  const candidaturesFiltrees = candidatures.filter(c => {
    const matchStatut = filtreStatut === 'TOUS' || c.statut === filtreStatut
    const matchOffre = filtreOffre === '' || c.offre.titre === filtreOffre
    const matchRecherche =
      recherche === '' ||
      `${c.etudiant?.prenom ?? ''} ${c.etudiant?.nom ?? ''}`.toLowerCase().includes(recherche.toLowerCase()) ||
      (c.etudiant?.email ?? '').toLowerCase().includes(recherche.toLowerCase())
    return matchStatut && matchOffre && matchRecherche
  })

  /* ── Compteurs ── */
  const compteurs = {
    total:     candidatures.length,
    enAttente: candidatures.filter(c => c.statut === 'EN_ATTENTE').length,
    acceptees: candidatures.filter(c => c.statut === 'ACCEPTEE').length,
    refusees:  candidatures.filter(c => c.statut === 'REFUSEE').length,
  }

  const deconnexion = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    router.push('/login')
  }

  if (chargement) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f5f7fc' }}>
        <div style={{ color: NAVY, fontSize: 18, fontWeight: 600 }}>Chargement…</div>
      </div>
    )
  }

  if (erreur) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f5f7fc' }}>
        <div style={{ color: '#ef4444', fontSize: 16 }}>{erreur}</div>
      </div>
    )
  }

  return (
    <>
      {/* Modal */}
      {modalCand && (
        <ModalDecision
          candidature={modalCand}
          onFermer={() => setModalCand(null)}
          onTraitee={apresTraitement}
        />
      )}

      <div
        style={{
          width: LARGEUR_MAQUETTE,
          minHeight: '100vh',
          transformOrigin: 'top left',
          zoom: echelle,
          background: '#f5f7fc',
          fontFamily: "'Inter', sans-serif",
          display: 'flex',
        }}
      >
        {/* ── BARRE LATÉRALE ── */}
        <aside
          style={{
            width: 240,
            background: NAVY,
            display: 'flex',
            flexDirection: 'column',
            padding: '32px 0',
            flexShrink: 0,
            minHeight: '100vh',
          }}
        >
          {/* Logo */}
          <div style={{ padding: '0 24px 32px' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
              IPD Stages
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
              Espace Entreprise
            </div>
          </div>

          {/* Profil mini */}
          {utilisateur && (
            <div style={{ padding: '0 24px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: BLUE, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700,
                }}>
                  {initiales(utilisateur.nom, utilisateur.prenom)}
                </div>
                <div>
                  <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>
                    {utilisateur.prenom} {utilisateur.nom}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Entreprise</div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav style={{ flex: 1, padding: '16px 0' }}>
            {[
              { label: 'Tableau de bord', href: '/dashboard/entreprise', icon: 'briefcase' },
              { label: 'Mes offres',       href: '/dashboard/entreprise/offres', icon: 'briefcase' },
              { label: 'Nouvelle offre',   href: '/dashboard/entreprise/offres/nouvelle', icon: 'plus' },
              { label: 'Candidatures',     href: '/dashboard/entreprise/candidatures', icon: 'candidatures', actif: true },
            ].map(item => (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  width: '100%', padding: '11px 24px',
                  background: (item as { actif?: boolean }).actif ? 'rgba(255,255,255,0.12)' : 'transparent',
                  border: 'none', cursor: 'pointer', color: '#fff', fontSize: 14,
                  borderLeft: (item as { actif?: boolean }).actif ? `3px solid ${BLUE}` : '3px solid transparent',
                  textAlign: 'left',
                }}
              >
                <Icon id={item.icon} size={18} color="rgba(255,255,255,0.8)" />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Déconnexion */}
          <div style={{ padding: '0 16px' }}>
            <button
              onClick={deconnexion}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '10px 16px',
                background: 'rgba(255,255,255,0.07)', border: 'none',
                borderRadius: 10, cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: 13,
              }}
            >
              <Icon id="logout" size={16} color="rgba(255,255,255,0.7)" />
              Déconnexion
            </button>
          </div>
        </aside>

        {/* ── CONTENU PRINCIPAL ── */}
        <main style={{ flex: 1, padding: '40px 48px', overflowY: 'auto' }}>

          {/* En-tête */}
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: NAVY, margin: 0 }}>
              Candidatures reçues
            </h1>
            <p style={{ color: MUTED, fontSize: 14, marginTop: 6 }}>
              Acceptez ou refusez les candidatures sur vos offres de stage
            </p>
          </div>

          {/* Compteurs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
            {[
              { label: 'Total reçues',  value: compteurs.total,     color: NAVY,      bg: '#eef2fa' },
              { label: 'En attente',    value: compteurs.enAttente, color: '#f59e0b', bg: '#fff8e1' },
              { label: 'Acceptées',     value: compteurs.acceptees, color: '#22c55e', bg: '#e8f5e9' },
              { label: 'Refusées',      value: compteurs.refusees,  color: '#ef4444', bg: '#fce8e8' },
            ].map(c => (
              <div key={c.label} style={{ ...CARTE, padding: '20px 24px' }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: c.color }}>{c.value}</div>
                <div style={{
                  fontSize: 12, color: MUTED, marginTop: 4,
                  display: 'inline-block', padding: '2px 10px',
                  background: c.bg, borderRadius: 20,
                }}>
                  {c.label}
                </div>
              </div>
            ))}
          </div>

          {/* Filtres */}
          <div style={{ ...CARTE, padding: '20px 24px', marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Recherche */}
            <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
              <Icon id="search" size={16} color={MUTED} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Rechercher un étudiant…"
                value={recherche}
                onChange={e => setRecherche(e.target.value)}
                style={{
                  width: '100%', padding: '9px 12px 9px 36px',
                  border: '1px solid #dde3f0', borderRadius: 8,
                  fontSize: 13, color: NAVY, outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Filtre par offre */}
            {titresOffres.length > 1 && (
              <select
                value={filtreOffre}
                onChange={e => setFiltreOffre(e.target.value)}
                style={{
                  padding: '9px 12px', border: '1px solid #dde3f0',
                  borderRadius: 8, fontSize: 13, color: NAVY, outline: 'none',
                  background: '#fff', minWidth: 180,
                }}
              >
                <option value="">Toutes les offres</option>
                {titresOffres.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            )}

            {/* Filtre statut */}
            {(['TOUS', 'EN_ATTENTE', 'ACCEPTEE', 'REFUSEE'] as const).map(s => {
              const actif = filtreStatut === s
              const labels: Record<string, string> = {
                TOUS: 'Tous', EN_ATTENTE: 'En attente', ACCEPTEE: 'Acceptées', REFUSEE: 'Refusées',
              }
              return (
                <button
                  key={s}
                  onClick={() => setFiltreStatut(s)}
                  style={{
                    padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', border: actif ? `2px solid ${BLUE}` : '2px solid #dde3f0',
                    background: actif ? BLUE : '#fff', color: actif ? '#fff' : MUTED,
                  }}
                >
                  {labels[s]}
                </button>
              )
            })}
          </div>

          {/* Liste */}
          {candidaturesFiltrees.length === 0 ? (
            <div style={{ ...CARTE, padding: 60, textAlign: 'center' }}>
              <Icon id="candidatures" size={48} color="#dde3f0" style={{ marginBottom: 16 }} />
              <div style={{ color: MUTED, fontSize: 15 }}>
                {candidatures.length === 0
                  ? 'Aucune candidature reçue pour le moment.'
                  : 'Aucune candidature ne correspond aux filtres sélectionnés.'}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {candidaturesFiltrees.map(cand => {
                const statut = STATUTS[cand.statut]
                const etu = cand.etudiant
                const peutTraiter = cand.statut === 'EN_ATTENTE'

                return (
                  <div
                    key={cand.id}
                    style={{
                      ...CARTE,
                      padding: '22px 28px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 20,
                    }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%',
                      background: '#eef2fa', color: NAVY,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, fontWeight: 700, flexShrink: 0,
                    }}>
                      {etu ? initiales(etu.nom, etu.prenom) : '?'}
                    </div>

                    {/* Infos */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: NAVY }}>
                          {etu ? `${etu.prenom} ${etu.nom}` : 'Étudiant inconnu'}
                        </span>
                        <span style={{
                          padding: '3px 12px', borderRadius: 20,
                          fontSize: 12, fontWeight: 600,
                          background: statut.bg, color: statut.color,
                        }}>
                          {statut.label}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 16, marginTop: 4, flexWrap: 'wrap' }}>
                        {etu && (
                          <span style={{ fontSize: 12, color: MUTED }}>{etu.email}</span>
                        )}
                        {etu?.filiere && (
                          <span style={{ fontSize: 12, color: MUTED }}>{etu.filiere} {etu.classe && `– ${etu.classe}`}</span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: BLUE, marginTop: 4, fontWeight: 600 }}>
                        {cand.offre.titre} · {cand.offre.duree} · {cand.offre.domaine}
                      </div>
                    </div>

                    {/* Date */}
                    <div style={{ textAlign: 'right', flexShrink: 0, marginRight: 16 }}>
                      <div style={{ fontSize: 11, color: MUTED }}>Reçue le</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: NAVY, marginTop: 2 }}>
                        {formatDate(cand.createdAt)}
                      </div>
                    </div>

                    {/* Bouton traitement */}
                    <button
                      onClick={() => peutTraiter && setModalCand(cand)}
                      disabled={!peutTraiter}
                      style={{
                        padding: '10px 20px', borderRadius: 8,
                        background: peutTraiter ? BLUE : '#f0f2f8',
                        color: peutTraiter ? '#fff' : MUTED,
                        border: 'none',
                        cursor: peutTraiter ? 'pointer' : 'default',
                        fontSize: 13, fontWeight: 700, flexShrink: 0,
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}
                    >
                      {peutTraiter
                        ? <><Icon id="eye" size={14} color="#fff" /> Traiter</>
                        : statut.label
                      }
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </>
  )
}
