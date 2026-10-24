// app/dashboard/etudiant/conventions/page.tsx
// Conventions de stage — vue Étudiant (inspiré maquette IPD)

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

type StatutConvention = 'EN_ATTENTE' | 'SIGNEE' | 'VALIDEE' | 'REJETEE'

interface Convention {
  id: number
  statut: StatutConvention
  dateSignature: string | null
  fichier: string | null
  createdAt: string
  stage: {
    id: number
    dateDebut: string
    dateFin: string
    statut: string
    candidature: {
      offre: {
        titre: string
        domaine: string
        entreprise: { nom: string; prenom: string; secteur: string | null } | null
      }
    }
  }
  encadreur: { id: number; nom: string; prenom: string; email: string } | null
}

/* ───────── Mise à l'échelle ───────── */

const LARGEUR_MAQUETTE = 1672
const abonnerRedimension = (cb: () => void) => {
  window.addEventListener('resize', cb)
  return () => window.removeEventListener('resize', cb)
}
const lireLargeur = () => window.innerWidth
const largeurServeur = () => LARGEUR_MAQUETTE

/* ───────── Icônes ───────── */

const ICONS: Record<string, ReactNode> = {
  convention: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="13" y2="17" />
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
  briefcase: (
    <>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </>
  ),
  user: (
    <>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
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
  arrow: (<polyline points="9 18 15 12 9 6" />),
  check: (<polyline points="20 6 9 17 4 12" />),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 15" />
    </>
  ),
  candidatures: (
    <>
      <path d="M9 12h6M9 16h4M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
      <path d="M9 8h6" />
    </>
  ),
}

function Icon({ id, size = 20, color = 'currentColor', style }: {
  id: string; size?: number; color?: string; style?: CSSProperties
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={style}>
      {ICONS[id]}
    </svg>
  )
}

/* ───────── Constantes ───────── */

const NAVY  = '#0b2f7a'
const BLUE  = '#1d6fe8'
const MUTED = '#6b7a99'

const CARTE: CSSProperties = {
  background: '#fff',
  borderRadius: 14,
  border: '1px solid #eef2fa',
  boxShadow: '0 2px 10px rgba(30,70,150,0.06)',
}

const STATUTS: Record<StatutConvention, { label: string; bg: string; color: string }> = {
  EN_ATTENTE: { label: 'En attente', bg: '#fff8e1', color: '#f59e0b' },
  SIGNEE:     { label: 'Signée',     bg: '#e8f0fe', color: '#1d6fe8' },
  VALIDEE:    { label: 'Validée',    bg: '#e8f5e9', color: '#22c55e' },
  REJETEE:    { label: 'Rejetée',    bg: '#fce8e8', color: '#ef4444' },
}

/* ───────── Helpers ───────── */

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function initiales(nom: string, prenom: string) {
  return `${(prenom[0] ?? '').toUpperCase()}${(nom[0] ?? '').toUpperCase()}`
}

/* ═══════════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════════════════ */

export default function PageConventionsEtudiant() {
  const router = useRouter()

  const largeur = useSyncExternalStore(abonnerRedimension, lireLargeur, largeurServeur)
  const echelle  = largeur / LARGEUR_MAQUETTE

  const [conventions, setConventions]       = useState<Convention[]>([])
  const [filtreStatut, setFiltreStatut]     = useState<StatutConvention | 'TOUS'>('TOUS')
  const [recherche, setRecherche]           = useState('')
  const [chargement, setChargement]         = useState(true)
  const [erreur, setErreur]                 = useState('')
  const [utilisateur, setUtilisateur]       = useState<{ nom: string; prenom: string } | null>(null)

  useEffect(() => {
    const token      = localStorage.getItem('token')
    const roleStocke = localStorage.getItem('role')
    if (!token || roleStocke !== 'ETUDIANT') { router.push('/login'); return }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      setUtilisateur({ nom: payload.nom ?? '', prenom: payload.prenom ?? '' })
    } catch { /* ignore */ }

    fetch('/api/conventions', { headers: { authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(json => { if (json.data) setConventions(json.data); else setErreur(json.message ?? 'Erreur') })
      .catch(() => setErreur('Impossible de charger les conventions'))
      .finally(() => setChargement(false))
  }, [router])

  const conventionsFiltrees = conventions.filter(c => {
    const matchStatut   = filtreStatut === 'TOUS' || c.statut === filtreStatut
    const offre         = c.stage.candidature.offre
    const matchRecherche = recherche === '' ||
      offre.titre.toLowerCase().includes(recherche.toLowerCase()) ||
      (offre.entreprise?.nom ?? '').toLowerCase().includes(recherche.toLowerCase())
    return matchStatut && matchRecherche
  })

  const deconnexion = () => {
    localStorage.removeItem('token'); localStorage.removeItem('role'); router.push('/login')
  }

  if (chargement) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f5f7fc' }}>
      <div style={{ color: NAVY, fontSize: 18, fontWeight: 600 }}>Chargement…</div>
    </div>
  )

  if (erreur) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f5f7fc' }}>
      <div style={{ color: '#ef4444', fontSize: 16 }}>{erreur}</div>
    </div>
  )

  return (
    <div style={{
      width: LARGEUR_MAQUETTE, minHeight: '100vh',
      transformOrigin: 'top left', zoom: echelle,
      background: '#f5f7fc', fontFamily: "'Inter', sans-serif",
      display: 'flex',
    }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: 240, background: NAVY,
        display: 'flex', flexDirection: 'column',
        padding: '32px 0', flexShrink: 0, minHeight: '100vh',
      }}>
        <div style={{ padding: '0 24px 32px' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>IPD Stages</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Espace Étudiant</div>
        </div>

        {utilisateur && (
          <div style={{ padding: '0 24px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', background: BLUE, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700,
              }}>
                {initiales(utilisateur.nom, utilisateur.prenom)}
              </div>
              <div>
                <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{utilisateur.prenom} {utilisateur.nom}</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Étudiant</div>
              </div>
            </div>
          </div>
        )}

        <nav style={{ flex: 1, padding: '16px 0' }}>
          {[
            { label: 'Tableau de bord',    href: '/dashboard/etudiant',              icon: 'briefcase' },
            { label: 'Offres de stage',    href: '/dashboard/etudiant/offres',        icon: 'briefcase' },
            { label: 'Mes candidatures',   href: '/dashboard/etudiant/candidatures',  icon: 'candidatures' },
            { label: 'Conventions',        href: '/dashboard/etudiant/conventions',   icon: 'convention', actif: true },
          ].map(item => (
            <button key={item.href} onClick={() => router.push(item.href)} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              width: '100%', padding: '11px 24px',
              background: (item as { actif?: boolean }).actif ? 'rgba(255,255,255,0.12)' : 'transparent',
              border: 'none', cursor: 'pointer', color: '#fff', fontSize: 14,
              borderLeft: (item as { actif?: boolean }).actif ? `3px solid ${BLUE}` : '3px solid transparent',
              textAlign: 'left',
            }}>
              <Icon id={item.icon} size={18} color="rgba(255,255,255,0.8)" />
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '0 16px' }}>
          <button onClick={deconnexion} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            width: '100%', padding: '10px 16px',
            background: 'rgba(255,255,255,0.07)', border: 'none',
            borderRadius: 10, cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: 13,
          }}>
            <Icon id="logout" size={16} color="rgba(255,255,255,0.7)" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ── CONTENU ── */}
      <main style={{ flex: 1, padding: '0', overflowY: 'auto' }}>

        {/* Bannière */}
        <div style={{
          background: `linear-gradient(135deg, ${NAVY} 0%, #1a4a9e 60%, #2563c4 100%)`,
          padding: '40px 48px 36px',
          display: 'flex', alignItems: 'center', gap: 24,
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon id="convention" size={32} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, color: '#fff' }}>
              Conventions de stage
            </h1>
            <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
              Retrouvez ici toutes vos conventions de stage et suivez leur état d'avancement.
            </p>
          </div>
        </div>

        <div style={{ padding: '36px 48px' }}>

          {/* Filtres */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 28, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Filtre statut boutons */}
            {(['TOUS', 'EN_ATTENTE', 'SIGNEE', 'VALIDEE', 'REJETEE'] as const).map(s => {
              const actif = filtreStatut === s
              const labels: Record<string, string> = {
                TOUS: 'Toutes les conventions', EN_ATTENTE: 'En attente',
                SIGNEE: 'Signées', VALIDEE: 'Validées', REJETEE: 'Rejetées',
              }
              return (
                <button key={s} onClick={() => setFiltreStatut(s)} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 18px', borderRadius: 24, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer',
                  border: actif ? `2px solid ${BLUE}` : '2px solid #dde3f0',
                  background: actif ? BLUE : '#fff',
                  color: actif ? '#fff' : MUTED,
                }}>
                  {s === 'TOUS' && <Icon id="convention" size={14} color={actif ? '#fff' : MUTED} />}
                  {s === 'EN_ATTENTE' && <Icon id="clock" size={14} color={actif ? '#fff' : MUTED} />}
                  {(s === 'SIGNEE' || s === 'VALIDEE') && <Icon id="check" size={14} color={actif ? '#fff' : MUTED} />}
                  {labels[s]}
                </button>
              )
            })}

            {/* Recherche */}
            <div style={{ position: 'relative', marginLeft: 'auto', minWidth: 260 }}>
              <Icon id="search" size={16} color={MUTED} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Rechercher par entreprise, poste…"
                value={recherche}
                onChange={e => setRecherche(e.target.value)}
                style={{
                  width: '100%', padding: '9px 12px 9px 36px',
                  border: '1px solid #dde3f0', borderRadius: 24,
                  fontSize: 13, color: NAVY, outline: 'none', boxSizing: 'border-box',
                  background: '#fff',
                }}
              />
            </div>
          </div>

          {/* Liste */}
          {conventionsFiltrees.length === 0 ? (
            <div style={{ ...CARTE, padding: 60, textAlign: 'center' }}>
              <Icon id="convention" size={48} color="#dde3f0" style={{ marginBottom: 16 }} />
              <div style={{ color: MUTED, fontSize: 15 }}>
                {conventions.length === 0
                  ? 'Aucune convention de stage pour le moment.'
                  : 'Aucune convention ne correspond à votre recherche.'}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {conventionsFiltrees.map(conv => {
                const offre = conv.stage.candidature.offre
                const ent   = offre.entreprise
                const statut = STATUTS[conv.statut]

                return (
                  <div key={conv.id} style={{
                    ...CARTE, padding: '20px 28px',
                    display: 'flex', alignItems: 'center', gap: 20,
                  }}>
                    {/* Avatar entreprise */}
                    <div style={{
                      width: 52, height: 52, borderRadius: 12,
                      background: `hsl(${((ent?.nom.charCodeAt(0) ?? 65) * 7) % 360}, 65%, 88%)`,
                      color: `hsl(${((ent?.nom.charCodeAt(0) ?? 65) * 7) % 360}, 55%, 35%)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, fontWeight: 800, flexShrink: 0,
                    }}>
                      {ent ? (ent.nom[0] ?? '?').toUpperCase() : '?'}
                    </div>

                    {/* Infos */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: NAVY }}>
                          {ent ? `${ent.prenom} ${ent.nom}` : 'Entreprise inconnue'}
                        </span>
                        <span style={{
                          padding: '3px 12px', borderRadius: 20,
                          fontSize: 12, fontWeight: 600,
                          background: statut.bg, color: statut.color,
                        }}>
                          {statut.label}
                        </span>
                      </div>

                      <div style={{ fontSize: 13, color: BLUE, fontWeight: 600, marginTop: 2 }}>
                        {offre.titre}
                      </div>

                      <div style={{ display: 'flex', gap: 20, marginTop: 6, flexWrap: 'wrap' }}>
                        {ent?.secteur && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: MUTED }}>
                            <Icon id="briefcase" size={12} color={MUTED} />
                            {ent.secteur}
                          </span>
                        )}
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: MUTED }}>
                          <Icon id="calendar" size={12} color={MUTED} />
                          Du {formatDate(conv.stage.dateDebut)} au {formatDate(conv.stage.dateFin)}
                        </span>
                        {conv.encadreur && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: MUTED }}>
                            <Icon id="user" size={12} color={MUTED} />
                            Encadreur : {conv.encadreur.prenom} {conv.encadreur.nom}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bouton détail */}
                    <button
                      onClick={() => router.push(`/dashboard/etudiant/conventions/${conv.id}`)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '10px 20px', borderRadius: 8,
                        background: BLUE, color: '#fff', border: 'none',
                        cursor: 'pointer', fontSize: 13, fontWeight: 700, flexShrink: 0,
                      }}
                    >
                      Voir les détails
                      <Icon id="arrow" size={14} color="#fff" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}