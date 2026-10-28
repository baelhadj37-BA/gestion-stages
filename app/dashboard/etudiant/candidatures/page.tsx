// app/dashboard/etudiant/candidatures/page.tsx
// Mes candidatures — vue Étudiant

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
  offre: {
    id: number
    titre: string
    domaine: string
    duree: string
    entreprise: { nom: string; prenom: string; secteur: string | null } | null
  }
  stage: {
    id: number
    dateDebut: string
    dateFin: string
    statut: string
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
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 15" />
    </>
  ),
  check: (
    <>
      <polyline points="20 6 9 17 4 12" />
    </>
  ),
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
  chevronLeft: (
    <polyline points="15 18 9 12 15 6" />
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

const STATUTS: Record<
  StatutCandidature,
  { label: string; bg: string; color: string }
> = {
  EN_ATTENTE: { label: 'En attente', bg: '#fff8e1', color: '#f59e0b' },
  ACCEPTEE:   { label: 'Acceptée',   bg: '#e8f5e9', color: '#22c55e' },
  REFUSEE:    { label: 'Refusée',    bg: '#fce8e8', color: '#ef4444' },
}

/* ═══════════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════════════════ */

export default function PageCandidaturesEtudiant() {
  const router = useRouter()

  /* ── Mise à l'échelle ── */
  const largeur = useSyncExternalStore(
    abonnerRedimension,
    lireLargeur,
    largeurServeur,
  )
  const echelle = largeur / LARGEUR_MAQUETTE

  /* ── État ── */
  const [candidatures, setCandidatures] = useState<Candidature[]>([])
  const [filtreStatut, setFiltreStatut] = useState<StatutCandidature | 'TOUS'>('TOUS')
  const [recherche, setRecherche] = useState('')
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [utilisateur, setUtilisateur] = useState<{ nom: string; prenom: string } | null>(null)

  /* ── Auth guard + chargement ── */
  useEffect(() => {
    const token = localStorage.getItem('token')
    const roleStocke = localStorage.getItem('role')
    if (!token || roleStocke !== 'ETUDIANT') {
      router.push('/login')
      return
    }

    // Récupérer infos utilisateur
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      setUtilisateur({ nom: payload.nom ?? '', prenom: payload.prenom ?? '' })
    } catch {
      // ignore
    }

    fetch('/api/candidatures', {
      headers: { authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(json => {
        if (json.candidatures) setCandidatures(json.candidatures)
        else setErreur(json.message ?? 'Erreur de chargement')
      })
      .catch(() => setErreur('Impossible de charger les candidatures'))
      .finally(() => setChargement(false))
  }, [router])

  /* ── Filtrage ── */
  const candidaturesFiltrees = candidatures.filter(c => {
    const matchStatut = filtreStatut === 'TOUS' || c.statut === filtreStatut
    const matchRecherche =
      recherche === '' ||
      c.offre.titre.toLowerCase().includes(recherche.toLowerCase()) ||
      (c.offre.entreprise?.nom ?? '').toLowerCase().includes(recherche.toLowerCase())
    return matchStatut && matchRecherche
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

  /* ── Rendu chargement / erreur ── */
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

  /* ══════════════════════════════════════
     RENDU PRINCIPAL (zoom scaling)
  ══════════════════════════════════════ */
  return (
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
            Espace Étudiant
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
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Étudiant</div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 0' }}>
          {[
            { label: 'Tableau de bord', href: '/dashboard/etudiant', icon: 'briefcase' },
            { label: 'Offres de stage', href: '/dashboard/etudiant/offres', icon: 'briefcase' },
            { label: 'Mes candidatures', href: '/dashboard/etudiant/candidatures', icon: 'candidatures', actif: true },
          ].map(item => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                width: '100%', padding: '11px 24px',
                background: item.actif ? 'rgba(255,255,255,0.12)' : 'transparent',
                border: 'none', cursor: 'pointer', color: '#fff', fontSize: 14,
                borderLeft: item.actif ? `3px solid ${BLUE}` : '3px solid transparent',
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
            Mes candidatures
          </h1>
          <p style={{ color: MUTED, fontSize: 14, marginTop: 6 }}>
            Suivez l'état de toutes vos candidatures aux offres de stage
          </p>
        </div>

        {/* Cartes compteurs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
          {[
            { label: 'Total',       value: compteurs.total,     color: NAVY,      bg: '#eef2fa' },
            { label: 'En attente',  value: compteurs.enAttente, color: '#f59e0b', bg: '#fff8e1' },
            { label: 'Acceptées',   value: compteurs.acceptees, color: '#22c55e', bg: '#e8f5e9' },
            { label: 'Refusées',    value: compteurs.refusees,  color: '#ef4444', bg: '#fce8e8' },
          ].map(carte => (
            <div key={carte.label} style={{ ...CARTE, padding: '20px 24px' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: carte.color }}>{carte.value}</div>
              <div style={{
                fontSize: 12, color: MUTED, marginTop: 4,
                display: 'inline-block', padding: '2px 10px',
                background: carte.bg, borderRadius: 20,
              }}>
                {carte.label}
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
              placeholder="Rechercher par titre ou entreprise…"
              value={recherche}
              onChange={e => setRecherche(e.target.value)}
              style={{
                width: '100%', padding: '9px 12px 9px 36px',
                border: '1px solid #dde3f0', borderRadius: 8,
                fontSize: 13, color: NAVY, outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Filtre statut */}
          {(['TOUS', 'EN_ATTENTE', 'ACCEPTEE', 'REFUSEE'] as const).map(s => {
            const actif = filtreStatut === s
            const labels: Record<string, string> = {
              TOUS: 'Tous', EN_ATTENTE: 'En attente', ACCEPTEE: 'Acceptées', REFUSEE: 'Refusées'
            }
            return (
              <button
                key={s}
                onClick={() => setFiltreStatut(s)}
                style={{
                  padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', border: actif ? `2px solid ${BLUE}` : '2px solid #dde3f0',
                  background: actif ? BLUE : '#fff', color: actif ? '#fff' : MUTED,
                  transition: 'all 0.15s',
                }}
              >
                {labels[s]}
              </button>
            )
          })}
        </div>

        {/* Liste des candidatures */}
        {candidaturesFiltrees.length === 0 ? (
          <div style={{ ...CARTE, padding: 60, textAlign: 'center' }}>
            <Icon id="candidatures" size={48} color="#dde3f0" style={{ marginBottom: 16 }} />
            <div style={{ color: MUTED, fontSize: 15 }}>
              {candidatures.length === 0
                ? 'Vous n\'avez encore posé aucune candidature.'
                : 'Aucune candidature ne correspond à votre recherche.'}
            </div>
            {candidatures.length === 0 && (
              <button
                onClick={() => router.push('/dashboard/etudiant/offres')}
                style={{
                  marginTop: 16, padding: '10px 24px', borderRadius: 8,
                  background: BLUE, color: '#fff', border: 'none',
                  cursor: 'pointer', fontSize: 14, fontWeight: 600,
                }}
              >
                Voir les offres de stage
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {candidaturesFiltrees.map(cand => {
              const statut = STATUTS[cand.statut]
              const ent = cand.offre.entreprise
              return (
                <div key={cand.id} style={{ ...CARTE, padding: '24px 28px', display: 'flex', alignItems: 'flex-start', gap: 20 }}>

                  {/* Avatar entreprise */}
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: '#eef2fa', color: NAVY,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 700, flexShrink: 0,
                  }}>
                    {ent ? initiales(ent.nom, ent.prenom) : '?'}
                  </div>

                  {/* Infos */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: NAVY }}>
                        {cand.offre.titre}
                      </span>
                      {/* Badge statut */}
                      <span style={{
                        padding: '3px 12px', borderRadius: 20,
                        fontSize: 12, fontWeight: 600,
                        background: statut.bg, color: statut.color,
                      }}>
                        {statut.label}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 20, marginTop: 6, flexWrap: 'wrap' }}>
                      {ent && (
                        <span style={{ fontSize: 13, color: MUTED }}>
                          {ent.prenom} {ent.nom}
                          {ent.secteur && ` · ${ent.secteur}`}
                        </span>
                      )}
                      <span style={{ fontSize: 13, color: MUTED }}>
                        Durée : {cand.offre.duree}
                      </span>
                      <span style={{ fontSize: 13, color: MUTED }}>
                        Domaine : {cand.offre.domaine}
                      </span>
                    </div>

                    {/* Stage associé */}
                    {cand.stage && (
                      <div style={{
                        marginTop: 10, padding: '10px 14px',
                        background: '#e8f5e9', borderRadius: 8,
                        display: 'flex', gap: 16, flexWrap: 'wrap',
                      }}>
                        <Icon id="calendar" size={14} color="#22c55e" />
                        <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>
                          Stage confirmé : du {formatDate(cand.stage.dateDebut)} au {formatDate(cand.stage.dateFin)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Date candidature */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 12, color: MUTED }}>Candidature déposée</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: NAVY, marginTop: 2 }}>
                      {formatDate(cand.createdAt)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

