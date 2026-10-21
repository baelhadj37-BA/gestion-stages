// app/dashboard/admin/page.tsx
// Tableau de bord administrateur — IPD Gestion des Stages

'use client'

import {
  useState,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
  type CSSProperties,
} from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

/* ───────── Types ───────── */

type Statut = 'EN_ATTENTE' | 'ACCEPTEE' | 'REFUSEE'

type Vue =
  | 'dashboard'
  | 'utilisateurs'
  | 'offres'
  | 'candidatures'
  | 'conventions'
  | 'rapports'
  | 'parametres'

interface Dashboard {
  dateServeur: string
  cartes: {
    etudiants: number
    etudiantsMois: number
    entreprises: number
    entreprisesMois: number
    offres: number
    offresSemaine: number
    candidaturesEnAttente: number
    candidaturesEnAttenteSemaine: number
  }
  alertes: { offresEnAttente: number }
  evolution: {
    jours: number
    total: number
    variation: number | null
    serie: { date: string; total: number }[]
  }
  dernieres: {
    id: number
    etudiant: string
    offre: string
    entreprise: string
    date: string
    statut: Statut
  }[]
}

interface User {
  id: number
  nom: string
  prenom: string
  email: string
  role: string
  createdAt: string
}

interface OffreAttente {
  id: number
  titre: string
  localisation: string
  duree: string
  createdAt: string
  entreprise: { nom: string; prenom: string; secteur: string | null } | null
}

/* ───────── Mise à l'échelle ─────────
   La page est dessinée pour une largeur de 1672 px (celle de la maquette),
   puis agrandie ou réduite pour remplir la fenêtre, comme une image. */

const LARGEUR_MAQUETTE = 1672

const abonnerRedimension = (rappel: () => void) => {
  window.addEventListener('resize', rappel)
  return () => window.removeEventListener('resize', rappel)
}
const lireLargeur = () => window.innerWidth
const largeurServeur = () => LARGEUR_MAQUETTE

/* ───────── Icônes ───────── */

const ICONS = {
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M17 14c2.8 0 4.5 2 4.5 5" />
    </>
  ),
  building: (
    <path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h2a2 2 0 0 1 2 2v10M2 21h20M8 7h4M8 11h4M8 15h4" />
  ),
  briefcase: (
    <>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M2 13h20" />
    </>
  ),
  doc: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h6" />
    </>
  ),
  docCheck: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 14l2 2 4-4" />
    </>
  ),
  chart: (
    <>
      <rect x="3" y="12" width="4" height="9" />
      <rect x="10" y="7" width="4" height="14" />
      <rect x="17" y="3" width="4" height="18" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </>
  ),
  bell: (
    <>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowUpRight: <path d="M7 17L17 7M8 7h9v9" />,
  trend: (
    <>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  chevronDown: <path d="M6 9l6 6 6-6" />,
  logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
} satisfies Record<string, ReactNode>

type IconName = keyof typeof ICONS

function Icon({ name, size = 22, sw = 1.8 }: { name: IconName; size?: number; sw?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      {ICONS[name]}
    </svg>
  )
}

/* ───────── Constantes de style ───────── */

const NAVY = '#0b2f7a'
const BLUE = '#1d6fe8'
const MUTED = '#6b7a99'

const CARTE: CSSProperties = {
  background: '#fff',
  borderRadius: 14,
  border: '1px solid #eef2fa',
  boxShadow: '0 2px 10px rgba(30, 70, 150, 0.06)',
}

const NAV: { id: Vue; label: string; icon: IconName }[] = [
  { id: 'dashboard', label: 'Tableau de bord', icon: 'grid' },
  { id: 'utilisateurs', label: 'Utilisateurs', icon: 'users' },
  { id: 'offres', label: 'Offres de stage', icon: 'briefcase' },
  { id: 'candidatures', label: 'Candidatures', icon: 'doc' },
  { id: 'conventions', label: 'Conventions', icon: 'docCheck' },
  { id: 'rapports', label: 'Rapports et évaluations', icon: 'chart' },
  { id: 'parametres', label: 'Paramètres', icon: 'gear' },
]

const STATUTS: Record<Statut, { label: string; fond: string; texte: string }> = {
  EN_ATTENTE: { label: 'En attente', fond: '#dbe8fd', texte: '#1d56c9' },
  ACCEPTEE: { label: 'Acceptée', fond: '#d9f5e3', texte: '#15803d' },
  REFUSEE: { label: 'Refusée', fond: '#fde2e2', texte: '#b91c1c' },
}

const COULEURS_AVATAR = ['#1d6fe8', '#7c3aed', '#14b8a6', '#ec4899', '#8b5cf6', '#2563eb']

const initiales = (texte: string) =>
  texte
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((m) => m[0])
    .join('')
    .toUpperCase()

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

const styleRole = (role: string) =>
  role === 'ADMIN'
    ? { fond: '#fde2e2', texte: '#b91c1c' }
    : role === 'ETUDIANT'
      ? { fond: '#dbe8fd', texte: '#1d56c9' }
      : role === 'ENTREPRISE'
        ? { fond: '#d9f5e3', texte: '#15803d' }
        : { fond: '#eadffc', texte: '#6d28d9' }

/* ───────── Courbe d'évolution (SVG, sans dépendance) ───────── */

function Courbe({ serie }: { serie: { date: string; total: number }[] }) {
  const W = 600
  const H = 340
  const L = 44
  const R = 16
  const T = 14
  const B = 34
  const pw = W - L - R
  const ph = H - T - B

  const max = Math.max(...serie.map((s) => s.total), 1)
  const pas = [1, 2, 5, 10, 20, 50, 100, 200, 500].find((p) => max / p <= 5) ?? 1000
  const haut = Math.ceil(max / pas) * pas
  const graduations = Array.from({ length: haut / pas + 1 }, (_, i) => i * pas)

  const n = serie.length
  const x = (i: number) => L + (n === 1 ? pw / 2 : (i * pw) / (n - 1))
  const y = (v: number) => T + ph - (v / haut) * ph

  const ligne = serie
    .map((s, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(s.total).toFixed(1)}`)
    .join(' ')
  const aire = `${ligne} L${x(n - 1).toFixed(1)} ${T + ph} L${x(0).toFixed(1)} ${T + ph} Z`

  const saut = n <= 7 ? 1 : n <= 14 ? 2 : 5
  const etiquette = (d: string) =>
    new Date(`${d}T00:00:00Z`).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    })

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      role="img"
      aria-label="Évolution des candidatures"
    >
      <defs>
        <linearGradient id="degradeEvolution" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={BLUE} stopOpacity="0.28" />
          <stop offset="100%" stopColor={BLUE} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {graduations.map((g) => (
        <g key={g}>
          <line x1={L} x2={W - R} y1={y(g)} y2={y(g)} stroke="#e8edf6" strokeWidth="1" />
          <text x={L - 10} y={y(g) + 4} textAnchor="end" fontSize="12" fill="#7b88a3">
            {g}
          </text>
        </g>
      ))}

      {serie.map((_, i) => (
        <line key={i} x1={x(i)} x2={x(i)} y1={T} y2={T + ph} stroke="#f0f3f9" strokeWidth="1" />
      ))}

      <path d={aire} fill="url(#degradeEvolution)" />
      <path d={ligne} fill="none" stroke={BLUE} strokeWidth="2.5" strokeLinejoin="round" />

      {serie.map((s, i) => (
        <circle key={s.date} cx={x(i)} cy={y(s.total)} r="3.8" fill={BLUE} />
      ))}

      {serie.map((s, i) =>
        (n - 1 - i) % saut === 0 ? (
          <text key={s.date} x={x(i)} y={H - 10} textAnchor="middle" fontSize="11.5" fill="#7b88a3">
            {etiquette(s.date)}
          </text>
        ) : null
      )}
    </svg>
  )
}

/* ───────── Page ───────── */

export default function AdminDashboard() {
  const router = useRouter()

  const [admin, setAdmin] = useState<{ nom: string; prenom: string } | null>(null)
  const [vue, setVue] = useState<Vue>('dashboard')
  const [jours, setJours] = useState(7)
  const [dash, setDash] = useState<Dashboard | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [offres, setOffres] = useState<OffreAttente[]>([])
  const [recherche, setRecherche] = useState('')
  const [menuOuvert, setMenuOuvert] = useState(false)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [recharge, setRecharge] = useState(0)

  const largeur = useSyncExternalStore(abonnerRedimension, lireLargeur, largeurServeur)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const brut = localStorage.getItem('user')

    if (!token || !brut) {
      router.push('/login')
      return
    }

    let utilisateur: { nom: string; prenom: string; role: string }
    try {
      utilisateur = JSON.parse(brut)
    } catch {
      router.push('/login')
      return
    }

    if (utilisateur.role !== 'ADMIN') {
      router.push('/login')
      return
    }

    // Token invalide, expiré ou rôle incorrect → retour à la connexion
    const sessionExpiree = () => {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/login')
    }

    const charger = async () => {
      setAdmin(utilisateur)
      try {
        const entetes = { authorization: `Bearer ${token}` }
        const [rd, ru, ro] = await Promise.all([
          fetch(`/api/admin/dashboard?jours=${jours}`, { headers: entetes }),
          fetch('/api/admin/users', { headers: entetes }),
          fetch('/api/admin/offres', { headers: entetes }),
        ])

        if ([rd, ru, ro].some((r) => r.status === 401 || r.status === 403)) {
          sessionExpiree()
          return
        }

        if (!rd.ok) {
          const corps = await rd.json().catch(() => null)
          setErreur(
            `Impossible de charger le tableau de bord (erreur ${rd.status})` +
              (corps?.detail ? ` : ${corps.detail}` : '')
          )
          return
        }

        setDash(await rd.json())
        if (ru.ok) setUsers((await ru.json()).users || [])
        if (ro.ok) setOffres((await ro.json()).offres || [])
        setErreur('')
      } catch {
        setErreur('Impossible de contacter le serveur.')
      } finally {
        setChargement(false)
      }
    }

    charger()
  }, [router, jours, recharge])

  const seDeconnecter = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  const traiterOffre = async (offreId: number, action: 'VALIDER' | 'REJETER') => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch('/api/admin/offres', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ offreId, action }),
      })
      if (res.status === 401 || res.status === 403) {
        seDeconnecter()
        return
      }
      if (!res.ok) {
        setErreur('Action impossible. Réessayez.')
        return
      }
      setRecharge((r) => r + 1)
    } catch {
      setErreur('Impossible de contacter le serveur.')
    }
  }

  if (chargement) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #1a237e 0%, #1565c0 100%)' }}
      >
        <div className="text-xl text-white">Chargement...</div>
      </div>
    )
  }

  /* Échelle : sur ordinateur, la page se redimensionne comme la maquette */
  const bureau = largeur >= 1024
  const echelle = bureau ? Math.min(Math.max(largeur / LARGEUR_MAQUETTE, 0.6), 1.5) : 1
  const hauteurPage = `${100 / echelle}vh`

  /* Données dérivées */
  const nomComplet = admin ? `${admin.prenom} ${admin.nom}`.trim() : ''
  const initialesAdmin = initiales(nomComplet) || 'AD'
  const alertes = dash?.alertes.offresEnAttente ?? 0

  const q = recherche.trim().toLowerCase()
  const usersFiltres = q
    ? users.filter((u) => `${u.nom} ${u.prenom} ${u.email} ${u.role}`.toLowerCase().includes(q))
    : users
  const offresFiltrees = q
    ? offres.filter((o) =>
        `${o.titre} ${o.localisation} ${o.entreprise?.nom ?? ''}`.toLowerCase().includes(q)
      )
    : offres

  const dateTexte = dash
    ? new Date(dash.dateServeur)
        .toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
        .replace(/^./, (c) => c.toUpperCase())
    : ''

  const cartes = dash
    ? [
        { label: 'Étudiants inscrits', valeur: dash.cartes.etudiants, delta: dash.cartes.etudiantsMois, periode: 'ce mois', icon: 'users' as IconName, fond: '#dbe8fd', couleur: '#1d6fe8', vers: 'utilisateurs' as Vue },
        { label: 'Entreprises partenaires', valeur: dash.cartes.entreprises, delta: dash.cartes.entreprisesMois, periode: 'ce mois', icon: 'building' as IconName, fond: '#d8f3e3', couleur: '#16a34a', vers: 'utilisateurs' as Vue },
        { label: 'Offres de stage', valeur: dash.cartes.offres, delta: dash.cartes.offresSemaine, periode: 'cette semaine', icon: 'briefcase' as IconName, fond: '#eadffc', couleur: '#7c3aed', vers: 'offres' as Vue },
        { label: 'Candidatures en attente', valeur: dash.cartes.candidaturesEnAttente, delta: dash.cartes.candidaturesEnAttenteSemaine, periode: 'cette semaine', icon: 'doc' as IconName, fond: '#fde9d0', couleur: '#f59e0b', vers: 'candidatures' as Vue },
      ]
    : []

  const variation = dash?.evolution.variation ?? null

  const th: CSSProperties = { padding: '13px 16px', fontWeight: 600, color: '#5f6d8a', fontSize: 12.5 }
  const titrePage: CSSProperties = { margin: 0, fontSize: 30, fontWeight: 800, color: NAVY, lineHeight: 1.2 }

  return (
    <div
      style={{
        display: 'flex',
        minHeight: hauteurPage,
        background: '#f4f7fc',
        zoom: echelle,
      }}
    >
      {/* ═══════════ SIDEBAR ═══════════ */}
      {bureau && (
        <aside
          style={{
            position: 'sticky',
            top: 0,
            alignSelf: 'flex-start',
            display: 'flex',
            flexDirection: 'column',
            width: 315,
            flexShrink: 0,
            height: hauteurPage,
            overflow: 'hidden',
            color: '#fff',
            background: 'linear-gradient(180deg, #0b3590 0%, #0a2c7e 60%, #0a3a9a 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '19px 22px 0' }}>
            <div
              style={{
                position: 'relative',
                width: 68,
                height: 68,
                flexShrink: 0,
                overflow: 'hidden',
                borderRadius: '50%',
                background: '#fff',
              }}
            >
              <Image src="/logo-ipd.png" alt="Logo IPD" fill sizes="68px" priority style={{ objectFit: 'contain' }} />
            </div>
            <div style={{ lineHeight: 1.3 }}>
              <p style={{ margin: 0, fontSize: 13.5, fontWeight: 800 }}>
                INSTITUT POLYTECHNIQUE
                <br />
                DE DAKAR
              </p>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: '#dbe7ff' }}>
                Plateforme de gestion des stages
              </p>
            </div>
          </div>

          <nav style={{ padding: '30px 14px 0' }}>
            {NAV.map((n) => {
              const actif = vue === n.id
              return (
                <button
                  key={n.id}
                  onClick={() => setVue(n.id)}
                  className={actif ? '' : 'hover:bg-white/10'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 24,
                    width: '100%',
                    height: 46,
                    padding: '0 17px',
                    marginBottom: 10,
                    borderRadius: 8,
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: '#fff',
                    fontSize: 15.5,
                    fontWeight: 500,
                    ...(actif
                      ? { background: '#1565e8', boxShadow: '0 6px 16px rgba(0,0,0,0.25)' }
                      : { background: 'transparent' }),
                  }}
                >
                  <Icon name={n.icon} size={26} />
                  {n.label}
                </button>
              )
            })}
          </nav>

          <div style={{ position: 'relative', marginTop: 'auto', height: 260, flexShrink: 0 }}>
            <svg
              viewBox="0 0 315 260"
              preserveAspectRatio="none"
              aria-hidden="true"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            >
              <path d="M0 120 C 90 100, 200 60, 315 0 L315 260 L0 260 Z" fill="rgba(21,101,232,0.38)" />
            </svg>
            <p
              style={{
                position: 'absolute',
                left: 60,
                top: 100,
                margin: 0,
                fontFamily: "'Segoe Script', 'Brush Script MT', cursive",
                fontSize: 20,
                lineHeight: '27px',
                transform: 'rotate(-12deg)',
                transformOrigin: 'left bottom',
              }}
            >
              Ensemble pour
              <br />
              l’avenir de nos étudiants
            </p>
            <svg
              viewBox="0 0 200 40"
              aria-hidden="true"
              style={{ position: 'absolute', left: 88, top: 182, width: 165 }}
            >
              <path d="M5 35 Q80 5 195 12" stroke="white" fill="none" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </aside>
      )}

      {/* ═══════════ COLONNE PRINCIPALE ═══════════ */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        {/* Barre du haut */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            height: 84,
            padding: '0 24px',
            background: '#fff',
            borderBottom: '1px solid #eef2fa',
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              flex: 1,
              maxWidth: 659,
              height: 44,
              padding: '0 18px',
              borderRadius: 10,
              background: '#f1f5fb',
              color: '#7b88a3',
            }}
          >
            <Icon name="search" size={21} />
            <input
              value={recherche}
              onChange={(e) => {
                setRecherche(e.target.value)
                if (e.target.value && vue === 'dashboard') setVue('utilisateurs')
              }}
              placeholder="Rechercher un utilisateur, une offre, une candidature..."
              className="w-full bg-transparent outline-none"
              style={{ fontSize: 15, color: '#2d3b5a' }}
            />
          </label>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 22 }}>
            <button
              onClick={() => setVue('offres')}
              aria-label="Notifications : offres à valider"
              style={{ position: 'relative', color: NAVY, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }}
            >
              <Icon name="bell" size={27} />
              {alertes > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -7,
                    minWidth: 18,
                    height: 18,
                    padding: '0 4px',
                    borderRadius: 9,
                    background: '#ef4444',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {alertes}
                </span>
              )}
            </button>

            <span style={{ width: 1, height: 48, background: '#e6ecf5' }} />

            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuOuvert((o) => !o)}
                style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: BLUE,
                    color: '#fff',
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  {initialesAdmin}
                </span>
                <span style={{ textAlign: 'left', lineHeight: 1.3 }}>
                  <span style={{ display: 'block', fontSize: 14.5, fontWeight: 700, color: NAVY }}>{nomComplet}</span>
                  <span style={{ display: 'block', fontSize: 13, color: MUTED }}>Administrateur</span>
                </span>
                <span style={{ color: MUTED, display: 'flex' }}>
                  <Icon name="chevronDown" size={18} />
                </span>
              </button>

              {menuOuvert && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 10px)',
                    width: 190,
                    padding: 8,
                    borderRadius: 12,
                    background: '#fff',
                    border: '1px solid #eef2fa',
                    boxShadow: '0 10px 30px rgba(30,70,150,0.15)',
                  }}
                >
                  <button
                    onClick={seDeconnecter}
                    className="hover:bg-red-50"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: 'none',
                      background: 'transparent',
                      color: '#dc2626',
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    <Icon name="logout" size={18} />
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Navigation mobile (la sidebar est masquée sur petit écran) */}
        {!bureau && (
          <nav className="flex gap-2 overflow-x-auto bg-white px-4 py-2">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => setVue(n.id)}
                className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium"
                style={vue === n.id ? { background: BLUE, color: '#fff' } : { color: NAVY, background: '#f1f5fb' }}
              >
                {n.label}
              </button>
            ))}
          </nav>
        )}

        <main style={{ flex: 1, padding: bureau ? '24px 24px 40px' : '20px 16px 32px' }}>
          {erreur && (
            <div
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                marginBottom: 20,
                padding: '12px 20px',
                borderRadius: 10,
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                fontSize: 14,
              }}
            >
              <span>{erreur}</span>
              <button
                onClick={() => setRecharge((r) => r + 1)}
                style={{ fontWeight: 600, textDecoration: 'underline', background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', flexShrink: 0 }}
              >
                Réessayer
              </button>
            </div>
          )}

          {/* ───────── TABLEAU DE BORD ───────── */}
          {vue === 'dashboard' && dash && (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '0 0 0 11px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <svg viewBox="0 0 24 24" width="38" height="38" aria-hidden="true">
                    <rect x="2" y="2" width="9.5" height="9.5" rx="2.5" fill={BLUE} />
                    <rect x="12.5" y="2" width="9.5" height="9.5" rx="2.5" fill={BLUE} />
                    <rect x="2" y="12.5" width="9.5" height="9.5" rx="2.5" fill={BLUE} />
                    <rect x="12.5" y="12.5" width="9.5" height="9.5" rx="2.5" fill={BLUE} />
                  </svg>
                  <div>
                    <h1 style={titrePage}>Tableau de bord</h1>
                    <p style={{ margin: '3px 0 0', fontSize: 16, color: '#2f55b0' }}>Vue d’ensemble de la plateforme</p>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    height: 42,
                    padding: '0 22px',
                    borderRadius: 10,
                    background: '#fff',
                    border: '1px solid #eef2fa',
                    color: NAVY,
                    fontSize: 14.5,
                    fontWeight: 600,
                  }}
                >
                  <Icon name="calendar" size={21} />
                  {dateTexte}
                </div>
              </div>

              {/* Cartes */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: bureau ? 'repeat(4, 1fr)' : 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: 19,
                  marginTop: 30,
                }}
              >
                {cartes.map((c) => (
                  <button
                    key={c.label}
                    onClick={() => setVue(c.vers)}
                    className="transition-shadow hover:shadow-md"
                    style={{
                      ...CARTE,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 20,
                      minHeight: 147,
                      padding: '0 22px 0 20px',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 64,
                        height: 64,
                        flexShrink: 0,
                        borderRadius: '50%',
                        background: c.fond,
                        color: c.couleur,
                      }}
                    >
                      <Icon name={c.icon} size={30} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 14.5, fontWeight: 500, color: '#2d3b5a' }}>{c.label}</span>
                      <span style={{ display: 'block', fontSize: 32, fontWeight: 800, lineHeight: 1.25, color: NAVY }}>{c.valeur}</span>
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          marginTop: 6,
                          fontSize: 13.5,
                          color: c.delta > 0 ? '#16a34a' : MUTED,
                        }}
                      >
                        {c.delta > 0 && <Icon name="arrowUpRight" size={17} sw={2.4} />}
                        {c.delta > 0 ? `+${c.delta}` : '0'} {c.periode}
                      </span>
                    </span>
                    <span style={{ color: BLUE, display: 'flex' }}>
                      <Icon name="arrowRight" size={17} />
                    </span>
                  </button>
                ))}
              </div>

              {/* Courbe + tableau */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: bureau ? '547fr 746fr' : '1fr',
                  gap: 19,
                  marginTop: 22,
                }}
              >
                {/* Évolution */}
                <section style={{ ...CARTE, padding: 20 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: 14, margin: 0, fontSize: 17, fontWeight: 700, color: NAVY }}>
                      <span style={{ color: BLUE, display: 'flex' }}><Icon name="trend" size={28} /></span>
                      Évolution des candidatures
                    </h2>
                    <select
                      value={jours}
                      onChange={(e) => setJours(Number(e.target.value))}
                      style={{
                        height: 37,
                        padding: '0 12px',
                        borderRadius: 8,
                        border: '1px solid #dfe6f3',
                        background: '#fff',
                        color: NAVY,
                        fontSize: 14,
                        fontWeight: 500,
                        outline: 'none',
                      }}
                    >
                      <option value={7}>7 derniers jours</option>
                      <option value={14}>14 derniers jours</option>
                      <option value={30}>30 derniers jours</option>
                    </select>
                  </div>

                  <div style={{ marginTop: 14 }}>
                    <Courbe serie={dash.evolution.serie} />
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 14,
                      marginTop: 18,
                      padding: '16px 22px',
                      borderRadius: 10,
                      background: '#eef4ff',
                      color: '#3b4a6b',
                      fontSize: 14,
                      lineHeight: '22px',
                    }}
                  >
                    <span style={{ color: BLUE, display: 'flex', marginTop: 1 }}><Icon name="info" size={20} /></span>
                    <p style={{ margin: 0 }}>
                      {variation === null ? (
                        <>Pas encore de période précédente pour comparer l’évolution des candidatures.</>
                      ) : variation > 0 ? (
                        <>La plateforme enregistre une hausse de <b style={{ color: BLUE }}>{variation}%</b> des candidatures au cours des {dash.evolution.jours} derniers jours.</>
                      ) : variation < 0 ? (
                        <>La plateforme enregistre une baisse de <b style={{ color: '#dc2626' }}>{Math.abs(variation)}%</b> des candidatures au cours des {dash.evolution.jours} derniers jours.</>
                      ) : (
                        <>Le nombre de candidatures est stable sur les {dash.evolution.jours} derniers jours.</>
                      )}
                    </p>
                  </div>
                </section>

                {/* Dernières candidatures */}
                <section style={{ ...CARTE, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 22px 16px' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: 14, margin: 0, fontSize: 17, fontWeight: 700, color: NAVY }}>
                      <span style={{ color: BLUE, display: 'flex' }}><Icon name="doc" size={28} /></span>
                      Dernières candidatures
                    </h2>
                    <button
                      onClick={() => setVue('candidatures')}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', color: BLUE, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Voir toutes <Icon name="arrowRight" size={16} />
                    </button>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', minWidth: 600, borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
                      <thead style={{ background: '#f4f7fc' }}>
                        <tr>
                          {['Étudiant', 'Offre de stage', 'Entreprise', 'Date', 'Statut'].map((h) => (
                            <th key={h} style={th}>{h}</th>
                          ))}
                          <th style={th} />
                        </tr>
                      </thead>
                      <tbody>
                        {dash.dernieres.length === 0 && (
                          <tr>
                            <td colSpan={6} style={{ padding: '40px 16px', textAlign: 'center', color: MUTED, fontSize: 14 }}>
                              Aucune candidature pour le moment
                            </td>
                          </tr>
                        )}
                        {dash.dernieres.map((c) => {
                          const s = STATUTS[c.statut]
                          return (
                            <tr key={c.id} style={{ borderTop: '1px solid #eef2fa' }}>
                              <td style={{ padding: '15px 16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                  <span
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      width: 33,
                                      height: 33,
                                      flexShrink: 0,
                                      borderRadius: '50%',
                                      background: COULEURS_AVATAR[c.id % COULEURS_AVATAR.length],
                                      color: '#fff',
                                      fontSize: 11.5,
                                      fontWeight: 700,
                                    }}
                                  >
                                    {initiales(c.etudiant)}
                                  </span>
                                  <span style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{c.etudiant}</span>
                                </div>
                              </td>
                              <td style={{ padding: '15px 16px', color: '#2d3b5a' }}>{c.offre}</td>
                              <td style={{ padding: '15px 16px', color: MUTED }}>{c.entreprise}</td>
                              <td style={{ padding: '15px 16px', color: MUTED, whiteSpace: 'nowrap' }}>{formatDate(c.date)}</td>
                              <td style={{ padding: '15px 16px' }}>
                                <span
                                  style={{
                                    display: 'inline-block',
                                    padding: '5px 14px',
                                    borderRadius: 999,
                                    background: s.fond,
                                    color: s.texte,
                                    fontSize: 12,
                                    fontWeight: 600,
                                  }}
                                >
                                  {s.label}
                                </span>
                              </td>
                              <td style={{ padding: '15px 16px', color: BLUE }}>
                                <Icon name="arrowRight" size={16} />
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            </>
          )}

          {/* ───────── UTILISATEURS ───────── */}
          {vue === 'utilisateurs' && (
            <>
              <h1 style={titrePage}>Gestion des utilisateurs</h1>
              <p style={{ margin: '4px 0 24px', fontSize: 16, color: '#2f55b0' }}>
                {usersFiltres.length} utilisateur(s)
              </p>
              <section style={{ ...CARTE, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', minWidth: 600, borderCollapse: 'collapse', textAlign: 'left', fontSize: 13.5 }}>
                    <thead style={{ background: '#f4f7fc' }}>
                      <tr>
                        {['ID', 'Nom', 'Prénom', 'Email', 'Rôle', 'Date'].map((h) => (
                          <th key={h} style={th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {usersFiltres.length === 0 && (
                        <tr>
                          <td colSpan={6} style={{ padding: '40px 16px', textAlign: 'center', color: MUTED }}>
                            Aucun utilisateur trouvé
                          </td>
                        </tr>
                      )}
                      {usersFiltres.map((u) => {
                        const r = styleRole(u.role)
                        return (
                          <tr key={u.id} style={{ borderTop: '1px solid #eef2fa' }}>
                            <td style={{ padding: '14px 16px', color: MUTED }}>{u.id}</td>
                            <td style={{ padding: '14px 16px', fontWeight: 600, color: NAVY }}>{u.nom}</td>
                            <td style={{ padding: '14px 16px', color: '#2d3b5a' }}>{u.prenom}</td>
                            <td style={{ padding: '14px 16px', color: MUTED }}>{u.email}</td>
                            <td style={{ padding: '14px 16px' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '5px 14px',
                                  borderRadius: 999,
                                  background: r.fond,
                                  color: r.texte,
                                  fontSize: 12,
                                  fontWeight: 600,
                                }}
                              >
                                {u.role}
                              </span>
                            </td>
                            <td style={{ padding: '14px 16px', color: MUTED, whiteSpace: 'nowrap' }}>{formatDate(u.createdAt)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {/* ───────── OFFRES EN ATTENTE ───────── */}
          {vue === 'offres' && (
            <>
              <h1 style={titrePage}>Offres en attente de validation</h1>
              <p style={{ margin: '4px 0 24px', fontSize: 16, color: '#2f55b0' }}>
                {offresFiltrees.length} offre(s) à traiter
              </p>

              {offresFiltrees.length === 0 ? (
                <section style={{ ...CARTE, padding: 40, textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 36 }}>💼</p>
                  <p style={{ margin: '8px 0 0', fontWeight: 600, color: NAVY }}>Aucune offre en attente pour le moment</p>
                  <p style={{ margin: '4px 0 0', fontSize: 14, color: MUTED }}>
                    Les offres publiées par les entreprises apparaîtront ici.
                  </p>
                </section>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {offresFiltrees.map((o) => (
                    <section
                      key={o.id}
                      style={{ ...CARTE, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: 24 }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: NAVY }}>{o.titre}</h2>
                        <p style={{ margin: '4px 0 0', fontSize: 14, color: MUTED }}>
                          {o.entreprise ? `${o.entreprise.nom} ${o.entreprise.prenom}`.trim() : 'Entreprise inconnue'}
                          {o.entreprise?.secteur ? ` · ${o.entreprise.secteur}` : ''}
                        </p>
                        <p style={{ margin: '4px 0 0', fontSize: 14, color: MUTED }}>
                          {o.localisation} · {o.duree} · publiée le {formatDate(o.createdAt)}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <button
                          onClick={() => traiterOffre(o.id, 'VALIDER')}
                          className="hover:brightness-110"
                          style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#16a34a', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                        >
                          Valider
                        </button>
                        <button
                          onClick={() => traiterOffre(o.id, 'REJETER')}
                          className="hover:bg-red-50"
                          style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #fecaca', background: '#fff', color: '#dc2626', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                        >
                          Rejeter
                        </button>
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ───────── SECTIONS PAS ENCORE DISPONIBLES ───────── */}
          {(vue === 'candidatures' || vue === 'conventions' || vue === 'rapports' || vue === 'parametres') && (
            <>
              <h1 style={titrePage}>{NAV.find((n) => n.id === vue)?.label}</h1>
              <section style={{ ...CARTE, marginTop: 24, padding: 40, textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 36 }}>🚧</p>
                <p style={{ margin: '8px 0 0', fontWeight: 600, color: NAVY }}>
                  Cette section sera disponible prochainement
                </p>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  )
}