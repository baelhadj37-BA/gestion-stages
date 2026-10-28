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

/* ─────────── Types ─────────── */

type Statut = 'EN_ATTENTE' | 'ACCEPTEE' | 'REFUSEE'
type StatutConvention = 'ETAPE_ETUDIANT' | 'ETAPE_ENTREPRISE' | 'ETAPE_ADMIN' | 'VALIDEE' | 'REJETEE'
type StatutStage = 'EN_COURS' | 'TERMINE' | 'ABANDONNE'

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

interface Candidature {
  id: number
  cvUrl: string
  lettreUrl: string | null
  statut: Statut
  score: number
  createdAt: string
  etudiant: {
    id: number
    nom: string
    prenom: string
    email: string
    classe: string | null
    filiere: string | null
  } | null
  offre: {
    id: number
    titre: string
    duree: string
    localisation: string
    entreprise: { id: number; nom: string; prenom: string } | null
  } | null
}

interface Convention {
  id: number
  statut: StatutConvention
  pdfUrl: string | null
  motifRejet: string | null
  dateValidation: string | null
  createdAt: string
  stage: {
    id: number
    dateDebut: string
    dateFin: string
    candidature: {
      etudiant: { id: number; nom: string; prenom: string; email: string; classe: string | null; filiere: string | null }
      offre: {
        titre: string
        duree: string
        entreprise: { id: number; nom: string; prenom: string; secteur: string | null } | null
      }
    }
  }
}

interface JournalAlerte {
  id: number
  semaine: number
  statut: string
  alerte: boolean
  dateDepot: string
  commentaire: string | null
  stage: {
    etudiant: { id: number; nom: string; prenom: string }
    candidature: {
      offre: { titre: string; entreprise: { nom: string; prenom: string } | null }
    }
  }
}

interface StageRapport {
  id: number
  dateDebut: string
  dateFin: string
  note: number | null
  statut: StatutStage
  createdAt: string
  etudiant: { id: number; nom: string; prenom: string; email: string; classe: string | null; filiere: string | null }
  encadreur: { id: number; nom: string; prenom: string; email: string }
  candidature: {
    offre: {
      titre: string
      duree: string
      localisation: string
      entreprise: { id: number; nom: string; prenom: string } | null
    }
  }
  journaux: { id: number; semaine: number; statut: string; alerte: boolean; dateDepot: string }[]
}

interface RapportStats {
  total: number
  enCours: number
  termines: number
  moyenneNote: number | null
  nbAlertes: number
}

interface ProfilAdmin {
  id: number
  nom: string
  prenom: string
  email: string
  telephone: string | null
  createdAt: string
}

/* ─────────── Mise à l'échelle ───────────
   La page est dessinée pour une largeur de 1672 px (celle de la maquette),
   puis agrandie ou réduite pour remplir la fenêtre, comme une image. */

const LARGEUR_MAQUETTE = 1672

const abonnerRedimension = (rappel: () => void) => {
  window.addEventListener('resize', rappel)
  return () => window.removeEventListener('resize', rappel)
}
const lireLargeur = () => window.innerWidth
const largeurServeur = () => LARGEUR_MAQUETTE

/* ─────────── Icônes ─────────── */

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
  check: <path d="M20 6L9 17l-5-5" />,
  x: <path d="M18 6L6 18M6 6l12 12" />,
  filter: (
    <>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </>
  ),
  externalLink: (
    <>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </>
  ),
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

/* ─────────── Constantes de style ─────────── */

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

/* ─────────── Courbe d'évolution (SVG, sans dépendance) ─────────── */

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

/* ─────────── Page ─────────── */

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

  // ── Créer encadreur ──
  const [modalEncadreur, setModalEncadreur] = useState(false)
  const [formEncadreur, setFormEncadreur] = useState({ nom: '', prenom: '', email: '', motDePasse: '', telephone: '', specialite: '' })
  const [creationEncadreur, setCreationEncadreur] = useState(false)
  const [erreurEncadreur, setErreurEncadreur] = useState('')
  const [succesEncadreur, setSuccesEncadreur] = useState('')

  // ── Candidatures ──
  const [candidatures, setCandidatures] = useState<Candidature[]>([])
  // ── Rapports ──
  const [rapportStats, setRapportStats] = useState<RapportStats | null>(null)
  const [stages, setStages] = useState<StageRapport[]>([])
  const [alertesJournaux, setAlertesJournaux] = useState<JournalAlerte[]>([])
  const [chargementRapports, setChargementRapports] = useState(false)
  const [erreurRapports, setErreurRapports] = useState('')
  const [filtreStages, setFiltreStages] = useState<StatutStage | 'TOUS'>('TOUS')
  const [ongletRapport, setOngletRapport] = useState<'stages' | 'alertes'>('stages')
  const [noteEdit, setNoteEdit] = useState<{ id: number; valeur: string } | null>(null)
  const [enregistrementNote, setEnregistrementNote] = useState(false)
  // ── Paramètres ──
  const [profilAdmin, setProfilAdmin] = useState<ProfilAdmin | null>(null)
  const [chargementParametres, setChargementParametres] = useState(false)
  const [erreurParametres, setErreurParametres] = useState('')
  const [succesParametres, setSuccesParametres] = useState('')
  const [formProfil, setFormProfil] = useState({ nom: '', prenom: '', email: '', telephone: '' })
  const [enregistrementProfil, setEnregistrementProfil] = useState(false)
  const [formMdp, setFormMdp] = useState({ ancien: '', nouveau: '', confirmation: '' })
  const [enregistrementMdp, setEnregistrementMdp] = useState(false)
  const [erreurMdp, setErreurMdp] = useState('')
  const [succesMdp, setSuccesMdp] = useState('')
  const [ongletParametres, setOngletParametres] = useState<'profil' | 'securite'>('profil')
  // ── Conventions ──
  const [conventions, setConventions] = useState<Convention[]>([])
  const [chargementConventions, setChargementConventions] = useState(false)
  const [erreurConventions, setErreurConventions] = useState('')
  const [filtreConventions, setFiltreConventions] = useState<StatutConvention | 'TOUTES'>('TOUTES')
  const [actionConventionId, setActionConventionId] = useState<number | null>(null)
  const [motifRejet, setMotifRejet] = useState('')
  const [convRejetId, setConvRejetId] = useState<number | null>(null)
  const [chargementCandidatures, setChargementCandidatures] = useState(false)
  const [erreurCandidatures, setErreurCandidatures] = useState('')
  const [filtreCandidatures, setFiltreCandidatures] = useState<Statut | 'TOUTES'>('TOUTES')
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

  // Charger les candidatures quand on bascule vers cette vue
  useEffect(() => {
    if (vue !== 'candidatures') return
    const token = localStorage.getItem('token')
    if (!token) return

    const chargerCandidatures = async () => {
      setChargementCandidatures(true)
      setErreurCandidatures('')
      try {
        const res = await fetch('/api/candidatures', {
          headers: { authorization: `Bearer ${token}` },
        })
        if (res.status === 401 || res.status === 403) {
          router.push('/login')
          return
        }
        if (!res.ok) {
          setErreurCandidatures('Impossible de charger les candidatures.')
          return
        }
        const data = await res.json()
        setCandidatures(data.candidatures || [])
      } catch {
        setErreurCandidatures('Impossible de contacter le serveur.')
      } finally {
        setChargementCandidatures(false)
      }
    }

    chargerCandidatures()
  }, [vue, router])

  const seDeconnecter = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  const creerEncadreur = async () => {
    setErreurEncadreur('')
    setSuccesEncadreur('')
    const { nom, prenom, email, motDePasse } = formEncadreur
    if (!nom.trim() || !prenom.trim() || !email.trim() || !motDePasse.trim()) {
      setErreurEncadreur('Nom, prénom, email et mot de passe sont obligatoires.')
      return
    }
    if (motDePasse.length < 6) {
      setErreurEncadreur('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }
    const token = localStorage.getItem('token')
    setCreationEncadreur(true)
    try {
      const res = await fetch('/api/admin/encadreurs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify(formEncadreur),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) { setErreurEncadreur(data?.message || 'Erreur lors de la création.'); return }
      if (data?.encadreur) { setUsers((prev) => [...prev, data.encadreur]) }
      setSuccesEncadreur(`Encadreur ${prenom} ${nom} créé avec succès !`)
      setFormEncadreur({ nom: '', prenom: '', email: '', motDePasse: '', telephone: '', specialite: '' })
      setTimeout(() => { setModalEncadreur(false); setSuccesEncadreur('') }, 1800)
    } catch {
      setErreurEncadreur('Impossible de contacter le serveur.')
    } finally {
      setCreationEncadreur(false)
    }
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

  // Charger les conventions quand on bascule vers cette vue
  useEffect(() => {
    if (vue !== 'conventions') return
    const token = localStorage.getItem('token')
    if (!token) return

    const chargerConventions = async () => {
      setChargementConventions(true)
      setErreurConventions('')
      try {
        const res = await fetch('/api/conventions', {
          headers: { authorization: `Bearer ${token}` },
        })
        if (res.status === 401 || res.status === 403) { router.push('/login'); return }
        if (!res.ok) { setErreurConventions('Impossible de charger les conventions.'); return }
        const data = await res.json()
        setConventions(data.data || [])
      } catch {
        setErreurConventions('Impossible de contacter le serveur.')
      } finally {
        setChargementConventions(false)
      }
    }

    chargerConventions()
  }, [vue, router])

  // Charger les rapports quand on bascule vers cette vue
  useEffect(() => {
    if (vue !== 'rapports') return
    const token = localStorage.getItem('token')
    if (!token) return

    const chargerRapports = async () => {
      setChargementRapports(true)
      setErreurRapports('')
      try {
        const res = await fetch('/api/admin/rapports', {
          headers: { authorization: `Bearer ${token}` },
        })
        if (res.status === 401 || res.status === 403) { router.push('/login'); return }
        if (!res.ok) { setErreurRapports('Impossible de charger les rapports.'); return }
        const data = await res.json()
        setRapportStats(data.stats)
        setStages(data.stages || [])
        setAlertesJournaux(data.alertes || [])
      } catch {
        setErreurRapports('Impossible de contacter le serveur.')
      } finally {
        setChargementRapports(false)
      }
    }
    chargerRapports()
  }, [vue, router])

  // Charger le profil admin quand on bascule vers Paramètres
  useEffect(() => {
    if (vue !== 'parametres') return
    const token = localStorage.getItem('token')
    if (!token) return

    const chargerParametres = async () => {
      setChargementParametres(true)
      setErreurParametres('')
      try {
        const res = await fetch('/api/admin/parametres', { headers: { authorization: `Bearer ${token}` } })
        if (res.status === 401 || res.status === 403) { router.push('/login'); return }
        if (!res.ok) { setErreurParametres('Impossible de charger les paramètres.'); return }
        const data = await res.json()
        setProfilAdmin(data.profil)
        setFormProfil({
          nom: data.profil.nom || '',
          prenom: data.profil.prenom || '',
          email: data.profil.email || '',
          telephone: data.profil.telephone || '',
        })
      } catch {
        setErreurParametres('Impossible de contacter le serveur.')
      } finally {
        setChargementParametres(false)
      }
    }
    chargerParametres()
  }, [vue, router])

  const enregistrerNote = async () => {
    if (!noteEdit) return
    const note = parseFloat(noteEdit.valeur.replace(',', '.'))
    if (isNaN(note) || note < 0 || note > 20) {
      setErreurRapports('La note doit être un nombre entre 0 et 20.')
      return
    }
    const token = localStorage.getItem('token')
    setEnregistrementNote(true)
    try {
      const res = await fetch('/api/admin/rapports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ stageId: noteEdit.id, note }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        setErreurRapports(err?.message || 'Impossible d\'enregistrer la note.')
        return
      }
      setStages((prev) => prev.map((s) => s.id === noteEdit.id ? { ...s, note } : s))
      if (rapportStats) {
        const toutesNotes = stages.map((s) => s.id === noteEdit.id ? note : s.note).filter((n): n is number => n !== null)
        const moy = toutesNotes.length > 0 ? toutesNotes.reduce((a, b) => a + b, 0) / toutesNotes.length : null
        setRapportStats({ ...rapportStats, moyenneNote: moy })
      }
      setNoteEdit(null)
    } catch {
      setErreurRapports('Impossible de contacter le serveur.')
    } finally {
      setEnregistrementNote(false)
    }
  }

  const enregistrerProfil = async () => {
    setSuccesParametres('')
    setErreurParametres('')
    if (!formProfil.nom.trim() || !formProfil.prenom.trim() || !formProfil.email.trim()) {
      setErreurParametres('Nom, prénom et email sont requis.')
      return
    }
    const token = localStorage.getItem('token')
    setEnregistrementProfil(true)
    try {
      const res = await fetch('/api/admin/parametres', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify(formProfil),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) { setErreurParametres(data?.message || 'Erreur lors de la mise à jour.'); return }
      setProfilAdmin(data.profil)
      setSuccesParametres('Profil mis à jour avec succès.')
    } catch {
      setErreurParametres('Impossible de contacter le serveur.')
    } finally {
      setEnregistrementProfil(false)
    }
  }

  const changerMotDePasse = async () => {
    setErreurMdp('')
    setSuccesMdp('')
    if (!formMdp.ancien || !formMdp.nouveau || !formMdp.confirmation) {
      setErreurMdp('Tous les champs sont requis.')
      return
    }
    if (formMdp.nouveau.length < 8) {
      setErreurMdp('Le nouveau mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (formMdp.nouveau !== formMdp.confirmation) {
      setErreurMdp('La confirmation ne correspond pas au nouveau mot de passe.')
      return
    }
    const token = localStorage.getItem('token')
    setEnregistrementMdp(true)
    try {
      const res = await fetch('/api/admin/parametres', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ ancienMotDePasse: formMdp.ancien, nouveauMotDePasse: formMdp.nouveau }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) { setErreurMdp(data?.message || 'Erreur lors du changement.'); return }
      setSuccesMdp('Mot de passe changé avec succès.')
      setFormMdp({ ancien: '', nouveau: '', confirmation: '' })
    } catch {
      setErreurMdp('Impossible de contacter le serveur.')
    } finally {
      setEnregistrementMdp(false)
    }
  }

  const validerConvention = async (id: number) => {
    const token = localStorage.getItem('token')
    setActionConventionId(id)
    try {
      const res = await fetch(`/api/conventions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'VALIDER' }),
      })
      if (res.status === 401 || res.status === 403) { seDeconnecter(); return }
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        setErreurConventions(err?.message || 'Impossible de valider la convention.')
        return
      }
      setConventions((prev) => prev.map((c) => c.id === id ? { ...c, statut: 'VALIDEE', dateValidation: new Date().toISOString() } : c))
    } catch {
      setErreurConventions('Impossible de contacter le serveur.')
    } finally {
      setActionConventionId(null)
    }
  }

  const rejeterConvention = async (id: number, motif: string) => {
    const token = localStorage.getItem('token')
    setActionConventionId(id)
    try {
      const res = await fetch(`/api/conventions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'REJETER', motifRejet: motif }),
      })
      if (res.status === 401 || res.status === 403) { seDeconnecter(); return }
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        setErreurConventions(err?.message || 'Impossible de rejeter la convention.')
        return
      }
      setConventions((prev) => prev.map((c) => c.id === id ? { ...c, statut: 'REJETEE', motifRejet: motif } : c))
      setConvRejetId(null)
      setMotifRejet('')
    } catch {
      setErreurConventions('Impossible de contacter le serveur.')
    } finally {
      setActionConventionId(null)
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

  // Candidatures filtrées par statut
  const candidaturesFiltrees =
    filtreCandidatures === 'TOUTES'
      ? candidatures
      : candidatures.filter((c) => c.statut === filtreCandidatures)

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

  // Compteurs par statut pour les candidatures
  const nbEnAttente = candidatures.filter((c) => c.statut === 'EN_ATTENTE').length
  const nbAcceptees = candidatures.filter((c) => c.statut === 'ACCEPTEE').length
  const nbRefusees = candidatures.filter((c) => c.statut === 'REFUSEE').length

  // Stages filtrés
  const stagesFiltres = filtreStages === 'TOUS' ? stages : stages.filter((s) => s.statut === filtreStages)

  // Conventions filtrées
  const conventionsFiltrees = filtreConventions === 'TOUTES' ? conventions : conventions.filter((c) => c.statut === filtreConventions)
  const nbConvEtapeAdmin = conventions.filter((c) => c.statut === 'ETAPE_ADMIN').length

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
              l&apos;avenir de nos étudiants
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

          {/* ─────────── TABLEAU DE BORD ─────────── */}
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
                    <p style={{ margin: '3px 0 0', fontSize: 16, color: '#2f55b0' }}>Vue d&apos;ensemble de la plateforme</p>
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
                        <>Pas encore de période précédente pour comparer l&apos;évolution des candidatures.</>
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

          {/* ─────────── UTILISATEURS ─────────── */}
          {vue === 'utilisateurs' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
                <div>
                  <h1 style={titrePage}>Gestion des utilisateurs</h1>
                  <p style={{ margin: '4px 0 0', fontSize: 16, color: '#2f55b0' }}>
                    {usersFiltres.length} utilisateur(s)
                  </p>
                </div>
                <button
                  onClick={() => { setModalEncadreur(true); setErreurEncadreur(''); setSuccesEncadreur('') }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '11px 22px', borderRadius: 10, border: 'none',
                    background: BLUE, color: '#fff', fontSize: 14.5, fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(29,111,232,0.35)',
                  }}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Créer un encadreur
                </button>
              </div>

              {/* Modal Créer encadreur */}
              {modalEncadreur && (
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(11,47,122,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
                  onClick={(e) => { if (e.target === e.currentTarget) setModalEncadreur(false) }}
                >
                  <div style={{ ...CARTE, width: '100%', maxWidth: 500, padding: '32px 36px', position: 'relative' }}>
                    <button onClick={() => setModalEncadreur(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', cursor: 'pointer', color: MUTED, display: 'flex' }}>
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                    <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: NAVY }}>Créer un encadreur</h2>
                    <p style={{ margin: '0 0 24px', fontSize: 14, color: MUTED }}>L&apos;encadreur pourra se connecter avec ces identifiants.</p>
                    {erreurEncadreur && <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 8, background: '#fde2e2', color: '#b91c1c', fontSize: 13.5 }}>{erreurEncadreur}</div>}
                    {succesEncadreur && <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 8, background: '#d9f5e3', color: '#15803d', fontSize: 13.5, fontWeight: 600 }}>{succesEncadreur}</div>}
                    {(['nom', 'prenom', 'email', 'motDePasse', 'telephone', 'specialite'] as const).map((champ) => (
                      <div key={champ} style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#3b4a6b', marginBottom: 6 }}>
                          {champ === 'nom' ? 'Nom *' : champ === 'prenom' ? 'Prénom *' : champ === 'email' ? 'Email *' : champ === 'motDePasse' ? 'Mot de passe *' : champ === 'telephone' ? 'Téléphone' : 'Spécialité'}
                        </label>
                        <input
                          type={champ === 'motDePasse' ? 'password' : champ === 'email' ? 'email' : 'text'}
                          value={formEncadreur[champ]}
                          onChange={(e) => setFormEncadreur((f) => ({ ...f, [champ]: e.target.value }))}
                          placeholder={champ === 'motDePasse' ? 'Min. 6 caractères' : champ === 'specialite' ? 'ex: Informatique, Réseaux…' : ''}
                          style={{ width: '100%', height: 42, padding: '0 14px', borderRadius: 8, border: '1.5px solid #dfe6f3', fontSize: 14, color: '#2d3b5a', outline: 'none', background: '#f8faff', boxSizing: 'border-box' }}
                        />
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                      <button onClick={() => setModalEncadreur(false)} style={{ flex: 1, height: 44, borderRadius: 9, border: '1.5px solid #dfe6f3', background: '#fff', color: MUTED, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
                      <button onClick={creerEncadreur} disabled={creationEncadreur} style={{ flex: 2, height: 44, borderRadius: 9, border: 'none', background: creationEncadreur ? '#93b4f0' : BLUE, color: '#fff', fontSize: 14.5, fontWeight: 700, cursor: creationEncadreur ? 'not-allowed' : 'pointer' }}>
                        {creationEncadreur ? 'Création…' : 'Créer l\'encadreur'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

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

          {/* ─────────── OFFRES EN ATTENTE ─────────── */}
          {vue === 'offres' && (
            <>
              <h1 style={titrePage}>Offres en attente de validation</h1>
              <p style={{ margin: '4px 0 24px', fontSize: 16, color: '#2f55b0' }}>
                {offresFiltrees.length} offre(s) à traiter
              </p>

              {offresFiltrees.length === 0 ? (
                <section style={{ ...CARTE, padding: 40, textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 36 }}>🎉</p>
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

          {/* ─────────── CANDIDATURES ─────────── */}
          {vue === 'candidatures' && (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
                <div>
                  <h1 style={titrePage}>Candidatures</h1>
                  <p style={{ margin: '4px 0 0', fontSize: 16, color: '#2f55b0' }}>
                    {candidaturesFiltrees.length} candidature(s)
                    {filtreCandidatures !== 'TOUTES' ? ` · filtre : ${STATUTS[filtreCandidatures].label}` : ' au total'}
                  </p>
                </div>

                {/* Compteurs + filtres */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {([
                    { id: 'TOUTES', label: 'Toutes', nb: candidatures.length, fond: '#f1f5fb', texte: NAVY },
                    { id: 'EN_ATTENTE', label: 'En attente', nb: nbEnAttente, fond: '#dbe8fd', texte: '#1d56c9' },
                    { id: 'ACCEPTEE', label: 'Acceptées', nb: nbAcceptees, fond: '#d9f5e3', texte: '#15803d' },
                    { id: 'REFUSEE', label: 'Refusées', nb: nbRefusees, fond: '#fde2e2', texte: '#b91c1c' },
                  ] as const).map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFiltreCandidatures(f.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '7px 16px',
                        borderRadius: 999,
                        border: filtreCandidatures === f.id ? `2px solid ${f.texte}` : '2px solid transparent',
                        background: f.fond,
                        color: f.texte,
                        fontSize: 13.5,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {f.label}
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: 22,
                          height: 22,
                          borderRadius: 999,
                          background: 'rgba(0,0,0,0.08)',
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {f.nb}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {erreurCandidatures && (
                <div
                  role="alert"
                  style={{
                    marginBottom: 16,
                    padding: '12px 20px',
                    borderRadius: 10,
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#b91c1c',
                    fontSize: 14,
                  }}
                >
                  {erreurCandidatures}
                </div>
              )}

              {chargementCandidatures ? (
                <section style={{ ...CARTE, padding: 40, textAlign: 'center' }}>
                  <p style={{ margin: 0, color: MUTED, fontSize: 15 }}>Chargement des candidatures…</p>
                </section>
              ) : candidaturesFiltrees.length === 0 ? (
                <section style={{ ...CARTE, padding: 40, textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 36 }}>📋</p>
                  <p style={{ margin: '8px 0 0', fontWeight: 600, color: NAVY }}>
                    {filtreCandidatures === 'TOUTES'
                      ? 'Aucune candidature pour le moment'
                      : `Aucune candidature ${STATUTS[filtreCandidatures as Statut].label.toLowerCase()}`}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: 14, color: MUTED }}>
                    Les candidatures des étudiants apparaîtront ici.
                  </p>
                </section>
              ) : (
                <section style={{ ...CARTE, overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', minWidth: 750, borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                      <thead style={{ background: '#f4f7fc' }}>
                        <tr>
                          {['Étudiant', 'Offre de stage', 'Entreprise', 'Date', 'Statut', 'Documents'].map((h) => (
                            <th key={h} style={th}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {candidaturesFiltrees.map((c) => {
                          const s = STATUTS[c.statut]
                          const nomEtudiant = c.etudiant
                            ? `${c.etudiant.prenom} ${c.etudiant.nom}`.trim()
                            : 'Inconnu'
                          const nomEntreprise = c.offre?.entreprise
                            ? `${c.offre.entreprise.nom} ${c.offre.entreprise.prenom}`.trim()
                            : '—'

                          return (
                            <tr key={c.id} style={{ borderTop: '1px solid #eef2fa' }}>
                              {/* Étudiant */}
                              <td style={{ padding: '14px 16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <span
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      width: 34,
                                      height: 34,
                                      flexShrink: 0,
                                      borderRadius: '50%',
                                      background: COULEURS_AVATAR[c.id % COULEURS_AVATAR.length],
                                      color: '#fff',
                                      fontSize: 12,
                                      fontWeight: 700,
                                    }}
                                  >
                                    {initiales(nomEtudiant)}
                                  </span>
                                  <div>
                                    <div style={{ fontWeight: 600, color: NAVY, fontSize: 13 }}>{nomEtudiant}</div>
                                    {c.etudiant?.email && (
                                      <div style={{ fontSize: 11.5, color: MUTED, marginTop: 1 }}>{c.etudiant.email}</div>
                                    )}
                                    {c.etudiant?.classe && (
                                      <div style={{ fontSize: 11.5, color: MUTED }}>{c.etudiant.classe}</div>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Offre */}
                              <td style={{ padding: '14px 16px' }}>
                                <div style={{ fontWeight: 600, color: '#2d3b5a', fontSize: 13 }}>
                                  {c.offre?.titre ?? '—'}
                                </div>
                                {c.offre?.duree && (
                                  <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{c.offre.duree}</div>
                                )}
                              </td>

                              {/* Entreprise */}
                              <td style={{ padding: '14px 16px', color: MUTED, fontSize: 13 }}>
                                {nomEntreprise}
                              </td>

                              {/* Date */}
                              <td style={{ padding: '14px 16px', color: MUTED, whiteSpace: 'nowrap', fontSize: 13 }}>
                                {formatDate(c.createdAt)}
                              </td>

                              {/* Statut */}
                              <td style={{ padding: '14px 16px' }}>
                                <span
                                  style={{
                                    display: 'inline-block',
                                    padding: '5px 13px',
                                    borderRadius: 999,
                                    background: s.fond,
                                    color: s.texte,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {s.label}
                                </span>
                              </td>

                              {/* Documents */}
                              <td style={{ padding: '14px 16px' }}>
                                <div style={{ display: 'flex', gap: 8 }}>
                                  <a
                                    href={c.cvUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 5,
                                      padding: '4px 10px',
                                      borderRadius: 6,
                                      background: '#eef4ff',
                                      color: BLUE,
                                      fontSize: 12,
                                      fontWeight: 600,
                                      textDecoration: 'none',
                                    }}
                                  >
                                    <Icon name="doc" size={14} />
                                    CV
                                  </a>
                                  {c.lettreUrl && (
                                    <a
                                      href={c.lettreUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 5,
                                        padding: '4px 10px',
                                        borderRadius: 6,
                                        background: '#eadffc',
                                        color: '#7c3aed',
                                        fontSize: 12,
                                        fontWeight: 600,
                                        textDecoration: 'none',
                                      }}
                                    >
                                      <Icon name="doc" size={14} />
                                      LM
                                    </a>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </>
          )}

          {/* ─────────── CONVENTIONS ─────────── */}
          {vue === 'conventions' && (() => {
            const STATUTS_CONV: Record<StatutConvention, { label: string; fond: string; texte: string }> = {
              ETAPE_ETUDIANT:   { label: 'Étape étudiant',   fond: '#fef9c3', texte: '#a16207' },
              ETAPE_ENTREPRISE: { label: 'Étape entreprise', fond: '#dbe8fd', texte: '#1d56c9' },
              ETAPE_ADMIN:      { label: 'À valider',        fond: '#fde9d0', texte: '#c05622' },
              VALIDEE:          { label: 'Validée',          fond: '#d9f5e3', texte: '#15803d' },
              REJETEE:          { label: 'Rejetée',          fond: '#fde2e2', texte: '#b91c1c' },
            }
            const filtres: { id: StatutConvention | 'TOUTES'; label: string }[] = [
              { id: 'TOUTES', label: `Toutes (${conventions.length})` },
              { id: 'ETAPE_ADMIN', label: `À valider (${nbConvEtapeAdmin})` },
              { id: 'ETAPE_ETUDIANT', label: 'Étape étudiant' },
              { id: 'ETAPE_ENTREPRISE', label: 'Étape entreprise' },
              { id: 'VALIDEE', label: 'Validées' },
              { id: 'REJETEE', label: 'Rejetées' },
            ]
            return (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <h1 style={titrePage}>Conventions de stage</h1>
                  {nbConvEtapeAdmin > 0 && (
                    <div style={{ background: '#fde9d0', color: '#c05622', borderRadius: 8, padding: '6px 14px', fontWeight: 600, fontSize: 13 }}>
                      {nbConvEtapeAdmin} convention{nbConvEtapeAdmin > 1 ? 's' : ''} en attente de validation
                    </div>
                  )}
                </div>

                {erreurConventions && (
                  <div style={{ background: '#fde2e2', color: '#b91c1c', borderRadius: 10, padding: '12px 16px', marginTop: 16, fontSize: 14 }}>
                    {erreurConventions}
                  </div>
                )}

                {/* Filtres */}
                <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
                  {filtres.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFiltreConventions(f.id)}
                      style={{
                        padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                        background: filtreConventions === f.id ? NAVY : '#eef2fa',
                        color: filtreConventions === f.id ? '#fff' : MUTED,
                        transition: 'all .15s',
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Tableau */}
                <section style={{ ...CARTE, marginTop: 20, overflow: 'hidden' }}>
                  {chargementConventions ? (
                    <div style={{ padding: 48, textAlign: 'center', color: MUTED }}>Chargement…</div>
                  ) : conventionsFiltrees.length === 0 ? (
                    <div style={{ padding: 48, textAlign: 'center', color: MUTED }}>
                      <p style={{ margin: 0, fontSize: 36 }}>📋</p>
                      <p style={{ margin: '8px 0 0', fontWeight: 600, color: NAVY }}>Aucune convention trouvée</p>
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #eef2fa', background: '#f8faff' }}>
                          <th style={th}>Étudiant</th>
                          <th style={th}>Offre / Entreprise</th>
                          <th style={th}>Période de stage</th>
                          <th style={th}>Statut</th>
                          <th style={th}>PDF</th>
                          <th style={th}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {conventionsFiltrees.map((conv, idx) => {
                          const etudiant = conv.stage.candidature.etudiant
                          const offre = conv.stage.candidature.offre
                          const entreprise = offre.entreprise
                          const nomEtudiant = `${etudiant.prenom} ${etudiant.nom}`
                          const couleurAv = COULEURS_AVATAR[etudiant.id % COULEURS_AVATAR.length]
                          const s = STATUTS_CONV[conv.statut]
                          const enAttenteAdmin = conv.statut === 'ETAPE_ADMIN'
                          const estEnAction = actionConventionId === conv.id
                          const estRejet = convRejetId === conv.id
                          return (
                            <tr key={conv.id} style={{ borderBottom: idx < conventionsFiltrees.length - 1 ? '1px solid #eef2fa' : 'none' }}>
                              {/* Étudiant */}
                              <td style={{ padding: '14px 16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: couleurAv, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                                    {initiales(nomEtudiant)}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 600, color: NAVY, fontSize: 13.5 }}>{nomEtudiant}</div>
                                    <div style={{ fontSize: 12, color: MUTED }}>{etudiant.email}</div>
                                    {etudiant.classe && <div style={{ fontSize: 11, color: MUTED }}>{etudiant.classe}{etudiant.filiere ? ` — ${etudiant.filiere}` : ''}</div>}
                                  </div>
                                </div>
                              </td>
                              {/* Offre / Entreprise */}
                              <td style={{ padding: '14px 16px' }}>
                                <div style={{ fontWeight: 600, color: NAVY, fontSize: 13.5 }}>{offre.titre}</div>
                                <div style={{ fontSize: 12, color: MUTED }}>{offre.duree}</div>
                                {entreprise && <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{entreprise.nom} {entreprise.prenom}</div>}
                              </td>
                              {/* Période */}
                              <td style={{ padding: '14px 16px', fontSize: 13, color: MUTED }}>
                                <div>{formatDate(conv.stage.dateDebut)}</div>
                                <div style={{ color: '#9ca3af' }}>→</div>
                                <div>{formatDate(conv.stage.dateFin)}</div>
                              </td>
                              {/* Statut */}
                              <td style={{ padding: '14px 16px' }}>
                                <span style={{ background: s.fond, color: s.texte, borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                                  {s.label}
                                </span>
                                {conv.motifRejet && (
                                  <div style={{ fontSize: 11, color: '#b91c1c', marginTop: 4, maxWidth: 180 }} title={conv.motifRejet}>
                                    {conv.motifRejet.length > 60 ? conv.motifRejet.slice(0, 60) + '…' : conv.motifRejet}
                                  </div>
                                )}
                              </td>
                              {/* PDF */}
                              <td style={{ padding: '14px 16px' }}>
                                {conv.pdfUrl ? (
                                  <a href={conv.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#eef2fa', color: NAVY, borderRadius: 8, padding: '5px 10px', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                                    <Icon name="externalLink" size={13} /> PDF
                                  </a>
                                ) : (
                                  <span style={{ color: '#c7d0e0', fontSize: 12 }}>—</span>
                                )}
                              </td>
                              {/* Actions */}
                              <td style={{ padding: '14px 16px' }}>
                                {enAttenteAdmin ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {estRejet ? (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <input
                                          type="text"
                                          placeholder="Motif du rejet…"
                                          value={motifRejet}
                                          onChange={(e) => setMotifRejet(e.target.value)}
                                          style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid #fca5a5', fontSize: 12, outline: 'none', width: 200 }}
                                        />
                                        <div style={{ display: 'flex', gap: 6 }}>
                                          <button
                                            onClick={() => rejeterConvention(conv.id, motifRejet)}
                                            disabled={estEnAction || !motifRejet.trim()}
                                            style={{ flex: 1, padding: '6px 10px', borderRadius: 7, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 600, fontSize: 12, cursor: motifRejet.trim() ? 'pointer' : 'not-allowed', opacity: motifRejet.trim() ? 1 : 0.5 }}
                                          >
                                            Confirmer
                                          </button>
                                          <button onClick={() => { setConvRejetId(null); setMotifRejet('') }} style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid #e2e8f0', background: '#fff', color: MUTED, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                                            Annuler
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div style={{ display: 'flex', gap: 6 }}>
                                        <button
                                          onClick={() => validerConvention(conv.id)}
                                          disabled={estEnAction}
                                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 7, border: 'none', background: '#16a34a', color: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer', opacity: estEnAction ? 0.6 : 1 }}
                                        >
                                          <Icon name="check" size={13} sw={2.5} /> Valider
                                        </button>
                                        <button
                                          onClick={() => setConvRejetId(conv.id)}
                                          disabled={estEnAction}
                                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 7, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer', opacity: estEnAction ? 0.6 : 1 }}
                                        >
                                          <Icon name="x" size={13} sw={2.5} /> Rejeter
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span style={{ color: '#c7d0e0', fontSize: 12 }}>—</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </section>
              </>
            )
          })()}

          {/* ─────────── RAPPORTS ET ÉVALUATIONS ─────────── */}
          {vue === 'rapports' && (() => {
            const STATUTS_STAGE: Record<StatutStage, { label: string; fond: string; texte: string }> = {
              EN_COURS:  { label: 'En cours',  fond: '#dbe8fd', texte: '#1d56c9' },
              TERMINE:   { label: 'Terminé',   fond: '#d9f5e3', texte: '#15803d' },
              ABANDONNE: { label: 'Abandonné', fond: '#fde2e2', texte: '#b91c1c' },
            }
            return (
              <>
                <h1 style={titrePage}>Rapports et évaluations</h1>

                {erreurRapports && (
                  <div style={{ background: '#fde2e2', color: '#b91c1c', borderRadius: 10, padding: '12px 16px', marginTop: 16, fontSize: 14 }}>
                    {erreurRapports}
                  </div>
                )}

                {/* Cartes stats */}
                {rapportStats && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 24 }}>
                    {[
                      { label: 'Total stages', valeur: rapportStats.total, fond: '#dbe8fd', couleur: '#1d6fe8' },
                      { label: 'En cours', valeur: rapportStats.enCours, fond: '#fde9d0', couleur: '#f59e0b' },
                      { label: 'Terminés', valeur: rapportStats.termines, fond: '#d9f5e3', couleur: '#16a34a' },
                      { label: 'Moyenne générale', valeur: rapportStats.moyenneNote !== null ? `${rapportStats.moyenneNote.toFixed(2)}/20` : '—', fond: '#eadffc', couleur: '#7c3aed' },
                    ].map((c) => (
                      <div key={c.label} style={{ ...CARTE, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: c.fond, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ color: c.couleur, display: 'flex' }}><Icon name="chart" size={18} sw={1.8} /></span>
                        </div>
                        <div style={{ fontSize: 26, fontWeight: 800, color: NAVY, marginTop: 4 }}>{c.valeur}</div>
                        <div style={{ fontSize: 12.5, color: MUTED, fontWeight: 500 }}>{c.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Onglets */}
                <div style={{ display: 'flex', gap: 4, marginTop: 28, borderBottom: '2px solid #eef2fa' }}>
                  {([
                    { id: 'stages' as const, label: `Stages (${stages.length})`, alerte: false as boolean },
                    { id: 'alertes' as const, label: `Alertes journaux (${alertesJournaux.length})`, alerte: alertesJournaux.length > 0 },
                  ]).map((o) => (
                    <button
                      key={o.id}
                      onClick={() => setOngletRapport(o.id)}
                      style={{
                        padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
                        fontSize: 14, fontWeight: 700, color: ongletRapport === o.id ? BLUE : MUTED,
                        borderBottom: ongletRapport === o.id ? `2px solid ${BLUE}` : '2px solid transparent',
                        marginBottom: -2, display: 'flex', alignItems: 'center', gap: 6,
                      }}
                    >
                      {o.label}
                      {o.alerte && <span style={{ background: '#ef4444', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{alertesJournaux.length}</span>}
                    </button>
                  ))}
                </div>

                {chargementRapports ? (
                  <div style={{ padding: 48, textAlign: 'center', color: MUTED }}>Chargement…</div>
                ) : ongletRapport === 'stages' ? (
                  <>
                    {/* Filtres stages */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                      {([
                        { id: 'TOUS', label: `Tous (${stages.length})` },
                        { id: 'EN_COURS', label: `En cours (${stages.filter(s => s.statut === 'EN_COURS').length})` },
                        { id: 'TERMINE', label: `Terminés (${stages.filter(s => s.statut === 'TERMINE').length})` },
                        { id: 'ABANDONNE', label: `Abandonnés (${stages.filter(s => s.statut === 'ABANDONNE').length})` },
                      ] as { id: StatutStage | 'TOUS'; label: string }[]).map((f) => (
                        <button key={f.id} onClick={() => setFiltreStages(f.id)}
                          style={{ padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: filtreStages === f.id ? NAVY : '#eef2fa', color: filtreStages === f.id ? '#fff' : MUTED }}>
                          {f.label}
                        </button>
                      ))}
                    </div>

                    <section style={{ ...CARTE, marginTop: 16, overflow: 'hidden' }}>
                      {stagesFiltres.length === 0 ? (
                        <div style={{ padding: 48, textAlign: 'center', color: MUTED }}>
                          <p style={{ margin: 0, fontSize: 36 }}>📊</p>
                          <p style={{ margin: '8px 0 0', fontWeight: 600, color: NAVY }}>Aucun stage trouvé</p>
                        </div>
                      ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid #eef2fa', background: '#f8faff' }}>
                              <th style={th}>Étudiant</th>
                              <th style={th}>Stage / Entreprise</th>
                              <th style={th}>Période</th>
                              <th style={th}>Journaux</th>
                              <th style={th}>Statut</th>
                              <th style={th}>Note /20</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stagesFiltres.map((stage, idx) => {
                              const nomEt = `${stage.etudiant.prenom} ${stage.etudiant.nom}`
                              const couleurAv = COULEURS_AVATAR[stage.etudiant.id % COULEURS_AVATAR.length]
                              const s = STATUTS_STAGE[stage.statut] ?? { label: stage.statut, fond: '#eef2fa', texte: MUTED }
                              const nbJournaux = stage.journaux.length
                              const nbAlertes = stage.journaux.filter(j => j.alerte).length
                              const estEdit = noteEdit?.id === stage.id
                              return (
                                <tr key={stage.id} style={{ borderBottom: idx < stagesFiltres.length - 1 ? '1px solid #eef2fa' : 'none' }}>
                                  {/* Étudiant */}
                                  <td style={{ padding: '14px 16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: couleurAv, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                                        {initiales(nomEt)}
                                      </div>
                                      <div>
                                        <div style={{ fontWeight: 600, color: NAVY, fontSize: 13.5 }}>{nomEt}</div>
                                        <div style={{ fontSize: 12, color: MUTED }}>{stage.etudiant.email}</div>
                                        {stage.etudiant.classe && <div style={{ fontSize: 11, color: MUTED }}>{stage.etudiant.classe}</div>}
                                      </div>
                                    </div>
                                  </td>
                                  {/* Stage / Entreprise */}
                                  <td style={{ padding: '14px 16px' }}>
                                    <div style={{ fontWeight: 600, color: NAVY, fontSize: 13.5 }}>{stage.candidature.offre.titre}</div>
                                    <div style={{ fontSize: 12, color: MUTED }}>{stage.candidature.offre.duree} — {stage.candidature.offre.localisation}</div>
                                    {stage.candidature.offre.entreprise && (
                                      <div style={{ fontSize: 12, color: MUTED }}>{stage.candidature.offre.entreprise.nom} {stage.candidature.offre.entreprise.prenom}</div>
                                    )}
                                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Enc. : {stage.encadreur?.prenom ?? '—'} {stage.encadreur?.nom ?? ''}</div>
                                  </td>
                                  {/* Période */}
                                  <td style={{ padding: '14px 16px', fontSize: 13, color: MUTED, whiteSpace: 'nowrap' }}>
                                    <div>{formatDate(stage.dateDebut)}</div>
                                    <div style={{ color: '#9ca3af' }}>→ {formatDate(stage.dateFin)}</div>
                                  </td>
                                  {/* Journaux */}
                                  <td style={{ padding: '14px 16px' }}>
                                    <div style={{ fontSize: 13, color: NAVY, fontWeight: 600 }}>{nbJournaux} entrée{nbJournaux > 1 ? 's' : ''}</div>
                                    {nbAlertes > 0 && (
                                      <div style={{ fontSize: 12, color: '#ef4444', fontWeight: 600, marginTop: 2 }}>⚠ {nbAlertes} alerte{nbAlertes > 1 ? 's' : ''}</div>
                                    )}
                                  </td>
                                  {/* Statut */}
                                  <td style={{ padding: '14px 16px' }}>
                                    <span style={{ background: s.fond, color: s.texte, borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>
                                      {s.label}
                                    </span>
                                  </td>
                                  {/* Note */}
                                  <td style={{ padding: '14px 16px' }}>
                                    {estEdit ? (
                                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                        <input
                                          type="text"
                                          value={noteEdit.valeur}
                                          onChange={(e) => setNoteEdit({ id: stage.id, valeur: e.target.value })}
                                          placeholder="0–20"
                                          style={{ width: 70, padding: '5px 8px', borderRadius: 7, border: '1px solid #1d6fe8', fontSize: 13, outline: 'none' }}
                                          onKeyDown={(e) => { if (e.key === 'Enter') enregistrerNote() }}
                                        />
                                        <button onClick={enregistrerNote} disabled={enregistrementNote}
                                          style={{ padding: '5px 10px', borderRadius: 7, border: 'none', background: '#16a34a', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                          ✓
                                        </button>
                                        <button onClick={() => setNoteEdit(null)}
                                          style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid #e2e8f0', background: '#fff', color: MUTED, fontSize: 12, cursor: 'pointer' }}>
                                          ✕
                                        </button>
                                      </div>
                                    ) : (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontWeight: 700, color: stage.note !== null ? NAVY : '#c7d0e0', fontSize: 15 }}>
                                          {stage.note !== null ? `${stage.note}/20` : '—'}
                                        </span>
                                        <button
                                          onClick={() => setNoteEdit({ id: stage.id, valeur: stage.note !== null ? String(stage.note) : '' })}
                                          style={{ padding: '3px 8px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8faff', color: MUTED, fontSize: 11, cursor: 'pointer' }}>
                                          {stage.note !== null ? 'Modifier' : 'Noter'}
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      )}
                    </section>
                  </>
                ) : (
                  /* Alertes journaux */
                  <section style={{ ...CARTE, marginTop: 16, overflow: 'hidden' }}>
                    {alertesJournaux.length === 0 ? (
                      <div style={{ padding: 48, textAlign: 'center', color: MUTED }}>
                        <p style={{ margin: 0, fontSize: 36 }}>✅</p>
                        <p style={{ margin: '8px 0 0', fontWeight: 600, color: NAVY }}>Aucune alerte active</p>
                      </div>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #eef2fa', background: '#f8faff' }}>
                            <th style={th}>Étudiant</th>
                            <th style={th}>Stage</th>
                            <th style={th}>Semaine</th>
                            <th style={th}>Date dépôt</th>
                            <th style={th}>Commentaire</th>
                          </tr>
                        </thead>
                        <tbody>
                          {alertesJournaux.map((j, idx) => {
                            const nomEt = `${j.stage.etudiant.prenom} ${j.stage.etudiant.nom}`
                            const couleurAv = COULEURS_AVATAR[j.stage.etudiant.id % COULEURS_AVATAR.length]
                            return (
                              <tr key={j.id} style={{ borderBottom: idx < alertesJournaux.length - 1 ? '1px solid #eef2fa' : 'none', background: '#fffbf5' }}>
                                <td style={{ padding: '14px 16px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: couleurAv, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                                      {initiales(nomEt)}
                                    </div>
                                    <div style={{ fontWeight: 600, color: NAVY, fontSize: 13.5 }}>{nomEt}</div>
                                  </div>
                                </td>
                                <td style={{ padding: '14px 16px' }}>
                                  <div style={{ fontWeight: 600, color: NAVY, fontSize: 13 }}>{j.stage.candidature.offre.titre}</div>
                                  {j.stage.candidature.offre.entreprise && (
                                    <div style={{ fontSize: 12, color: MUTED }}>{j.stage.candidature.offre.entreprise.nom}</div>
                                  )}
                                </td>
                                <td style={{ padding: '14px 16px' }}>
                                  <span style={{ background: '#fde9d0', color: '#c05622', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>
                                    Semaine {j.semaine}
                                  </span>
                                </td>
                                <td style={{ padding: '14px 16px', fontSize: 13, color: MUTED }}>{formatDate(j.dateDepot)}</td>
                                <td style={{ padding: '14px 16px', fontSize: 13, color: MUTED, maxWidth: 240 }}>
                                  {j.commentaire ? j.commentaire : <span style={{ color: '#c7d0e0' }}>Aucun commentaire</span>}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    )}
                  </section>
                )}
              </>
            )
          })()}

          {/* ─────────── PARAMÈTRES ─────────── */}
          {vue === 'parametres' && (() => {
            const ONGLETS_PARAM = [
              { id: 'profil',   label: 'Informations du profil' },
              { id: 'securite', label: 'Sécurité' },
            ] as const

            const champStyle: React.CSSProperties = {
              width: '100%', padding: '10px 14px', borderRadius: 8,
              border: '1.5px solid #dce5f3', fontSize: 14, color: NAVY,
              outline: 'none', boxSizing: 'border-box' as const,
            }
            const labelStyle: React.CSSProperties = {
              display: 'block', fontSize: 12, fontWeight: 600,
              color: MUTED, marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.04em',
            }

            return (
              <>
                <h1 style={titrePage}>Paramètres</h1>

                {/* Bannières */}
                {erreurParametres && (
                  <div style={{ background: '#fde8e8', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 18px', marginBottom: 20, color: '#b91c1c', fontSize: 14 }}>
                    {erreurParametres}
                  </div>
                )}

                {chargementParametres && (
                  <div style={{ textAlign: 'center', padding: 40, color: MUTED }}>Chargement…</div>
                )}

                {!chargementParametres && (
                  <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>

                    {/* Carte profil résumé */}
                    <div style={{ ...CARTE, padding: 28, minWidth: 220, flex: '0 0 220px', textAlign: 'center' }}>
                      <div style={{
                        width: 72, height: 72, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #1d6fe8, #0b2f7a)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 28, color: '#fff', fontWeight: 700,
                        margin: '0 auto 14px',
                      }}>
                        {(profilAdmin?.prenom?.[0] || '?').toUpperCase()}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 16, color: NAVY }}>
                        {profilAdmin ? `${profilAdmin.prenom} ${profilAdmin.nom}` : '—'}
                      </div>
                      <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>Administrateur</div>
                      <div style={{ fontSize: 12, color: MUTED, marginTop: 8, wordBreak: 'break-all' as const }}>
                        {profilAdmin?.email}
                      </div>
                      {profilAdmin?.telephone && (
                        <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>{profilAdmin.telephone}</div>
                      )}
                      {profilAdmin?.createdAt && (
                        <div style={{ fontSize: 11, color: '#b0bcd0', marginTop: 12 }}>
                          Compte créé le {formatDate(profilAdmin.createdAt)}
                        </div>
                      )}
                    </div>

                    {/* Panneau principal */}
                    <div style={{ flex: 1, minWidth: 320 }}>

                      {/* Onglets */}
                      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#f1f5fb', borderRadius: 10, padding: 4, width: 'fit-content' }}>
                        {ONGLETS_PARAM.map((o) => (
                          <button key={o.id} onClick={() => setOngletParametres(o.id)}
                            style={{
                              padding: '8px 22px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                              background: ongletParametres === o.id ? '#fff' : 'transparent',
                              color: ongletParametres === o.id ? BLUE : MUTED,
                              boxShadow: ongletParametres === o.id ? '0 1px 4px rgba(30,70,150,0.10)' : 'none',
                              transition: 'all 0.15s',
                            }}>
                            {o.label}
                          </button>
                        ))}
                      </div>

                      {/* ── Onglet PROFIL ── */}
                      {ongletParametres === 'profil' && (
                        <div style={{ ...CARTE, padding: 28 }}>
                          <h2 style={{ margin: '0 0 22px', fontSize: 16, fontWeight: 700, color: NAVY }}>
                            Informations du profil
                          </h2>

                          {succesParametres && (
                            <div style={{ background: '#d9f5e3', border: '1px solid #86efac', borderRadius: 8, padding: '10px 16px', marginBottom: 18, color: '#15803d', fontSize: 13 }}>
                              {succesParametres}
                            </div>
                          )}

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                            <div>
                              <label style={labelStyle}>Prénom</label>
                              <input style={champStyle} value={formProfil.prenom}
                                onChange={(e) => setFormProfil((p) => ({ ...p, prenom: e.target.value }))}
                                placeholder="Votre prénom" />
                            </div>
                            <div>
                              <label style={labelStyle}>Nom</label>
                              <input style={champStyle} value={formProfil.nom}
                                onChange={(e) => setFormProfil((p) => ({ ...p, nom: e.target.value }))}
                                placeholder="Votre nom" />
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                              <label style={labelStyle}>Adresse email</label>
                              <input style={champStyle} type="email" value={formProfil.email}
                                onChange={(e) => setFormProfil((p) => ({ ...p, email: e.target.value }))}
                                placeholder="email@exemple.com" />
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                              <label style={labelStyle}>Téléphone (optionnel)</label>
                              <input style={champStyle} value={formProfil.telephone}
                                onChange={(e) => setFormProfil((p) => ({ ...p, telephone: e.target.value }))}
                                placeholder="+221 XX XXX XX XX" />
                            </div>
                          </div>

                          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={enregistrerProfil} disabled={enregistrementProfil}
                              style={{
                                padding: '10px 28px', borderRadius: 9, border: 'none', cursor: 'pointer',
                                background: BLUE, color: '#fff', fontWeight: 700, fontSize: 14,
                                opacity: enregistrementProfil ? 0.6 : 1,
                              }}>
                              {enregistrementProfil ? 'Enregistrement…' : 'Enregistrer les modifications'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* ── Onglet SÉCURITÉ ── */}
                      {ongletParametres === 'securite' && (
                        <div style={{ ...CARTE, padding: 28 }}>
                          <h2 style={{ margin: '0 0 22px', fontSize: 16, fontWeight: 700, color: NAVY }}>
                            Changer le mot de passe
                          </h2>

                          {erreurMdp && (
                            <div style={{ background: '#fde8e8', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 16px', marginBottom: 18, color: '#b91c1c', fontSize: 13 }}>
                              {erreurMdp}
                            </div>
                          )}
                          {succesMdp && (
                            <div style={{ background: '#d9f5e3', border: '1px solid #86efac', borderRadius: 8, padding: '10px 16px', marginBottom: 18, color: '#15803d', fontSize: 13 }}>
                              {succesMdp}
                            </div>
                          )}

                          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 16, maxWidth: 440 }}>
                            <div>
                              <label style={labelStyle}>Mot de passe actuel</label>
                              <input style={champStyle} type="password" value={formMdp.ancien}
                                onChange={(e) => setFormMdp((p) => ({ ...p, ancien: e.target.value }))}
                                placeholder="••••••••" />
                            </div>
                            <div>
                              <label style={labelStyle}>Nouveau mot de passe</label>
                              <input style={champStyle} type="password" value={formMdp.nouveau}
                                onChange={(e) => setFormMdp((p) => ({ ...p, nouveau: e.target.value }))}
                                placeholder="Minimum 8 caractères" />
                            </div>
                            <div>
                              <label style={labelStyle}>Confirmer le nouveau mot de passe</label>
                              <input style={champStyle} type="password" value={formMdp.confirmation}
                                onChange={(e) => setFormMdp((p) => ({ ...p, confirmation: e.target.value }))}
                                placeholder="••••••••" />
                            </div>
                          </div>

                          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', maxWidth: 440 }}>
                            <button onClick={changerMotDePasse} disabled={enregistrementMdp}
                              style={{
                                padding: '10px 28px', borderRadius: 9, border: 'none', cursor: 'pointer',
                                background: '#16a34a', color: '#fff', fontWeight: 700, fontSize: 14,
                                opacity: enregistrementMdp ? 0.6 : 1,
                              }}>
                              {enregistrementMdp ? 'Modification…' : 'Changer le mot de passe'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )
          })()}
        </main>
      </div>
    </div>
  )
}