// app/dashboard/etudiant/page.tsx
// Tableau de bord étudiant — IPD Gestion des Stages

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

type Vue =
  | 'dashboard'
  | 'stage'
  | 'candidatures'
  | 'convention'
  | 'journal'
  | 'offres'
  | 'notifications'
  | 'profil'

interface UserSession {
  id: number
  nom: string
  prenom: string
  email: string
  role: string
  matricule?: string
  classe?: string
  secteur?: string
  competences?: string
}

interface StageDetail {
  id: number
  dateDebut: string
  dateFin: string
  statut: string
  note?: number | null
  encadreur?: {
    id: number
    nom: string
    prenom: string
    email: string
  }
  candidature?: {
    id: number
    offre?: {
      id: number
      titre: string
      description: string
      duree: string
      localisation: string
      tags?: string
      entreprise?: {
        id: number
        nom: string
        prenom: string
        email: string
        secteur: string | null
      }
    }
  }
  convention?: {
    id: number
    statut: string
    pdfUrl?: string | null
  }
}

interface ConventionDetail {
  id: number
  stageId: number
  statut: string
  dateValidation?: string | null
  qrCodeUrl?: string | null
  pdfUrl?: string | null
}

interface JournalEntree {
  id: number
  semaine: number
  activites: string
  heures: number
  date: string
  statut: string
  commentaire?: string | null
  alerte?: boolean
}

interface OffreItem {
  id: number
  titre: string
  description: string
  duree: string
  localisation: string
  tags: string
  createdAt: string
  entreprise: { id?: number; nom: string; prenom: string }
}

interface CandidatureItem {
  id: number
  cvUrl: string
  lettreUrl?: string | null
  statut: 'EN_ATTENTE' | 'ACCEPTEE' | 'REFUSEE'
  score: number
  createdAt: string
  offre: {
    id: number
    titre: string
    description?: string
    duree: string
    localisation: string
    tags?: string
    entreprise: {
      id: number
      nom: string
      prenom: string
      email?: string
      secteur?: string | null
    }
  }
  stage?: {
    id: number
    statut: string
    dateDebut: string
    dateFin: string
  } | null
}

interface NotificationItem {
  id: number
  message: string
  lu: boolean
  type: string
  createdAt: string
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

const ICONS = {
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  briefcase: (
    <>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M2 13h20" />
    </>
  ),
  docCheck: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 14l2 2 4-4" />
    </>
  ),
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </>
  ),
  list: (
    <>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </>
  ),
  chevronDown: <path d="M6 9l6 6 6-6" />,
  logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </>
  ),
  plus: (
    <>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </>
  ),
  check: <polyline points="20 6 9 17 4 12" />,
  alert: (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </>
  ),
  download: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </>
  ),
  user: (
    <>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
  send: (
    <>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </>
  ),
  building: (
    <>
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="9" y1="22" x2="9" y2="18" />
      <line x1="15" y1="22" x2="15" y2="18" />
      <line x1="8" y1="6" x2="10" y2="6" />
      <line x1="14" y1="6" x2="16" y2="6" />
      <line x1="8" y1="10" x2="10" y2="10" />
      <line x1="14" y1="10" x2="16" y2="10" />
      <line x1="8" y1="14" x2="10" y2="14" />
      <line x1="14" y1="14" x2="16" y2="14" />
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
  { id: 'dashboard', label: 'Vue d’ensemble', icon: 'grid' },
  { id: 'stage', label: 'Mon Stage', icon: 'briefcase' },
  { id: 'candidatures', label: 'Mes Candidatures', icon: 'send' },
  { id: 'convention', label: 'Ma Convention', icon: 'docCheck' },
  { id: 'journal', label: 'Journal de bord', icon: 'book' },
  { id: 'offres', label: 'Offres de stage', icon: 'list' },
  { id: 'notifications', label: 'Mes Notifications', icon: 'bell' },
  { id: 'profil', label: 'Mon Profil', icon: 'user' },
]

const STATUTS_CONVENTION: Record<string, { label: string; fond: string; texte: string }> = {
  ETAPE_ETUDIANT: { label: 'Initié par l’étudiant', fond: '#dbe8fd', texte: '#1d56c9' },
  ETAPE_ENTREPRISE: { label: 'En attente entreprise', fond: '#fde9d0', texte: '#c2410c' },
  ETAPE_ADMIN: { label: 'En attente administrateur', fond: '#eadffc', texte: '#6d28d9' },
  VALIDEE: { label: 'Validée & Certifiée', fond: '#d9f5e3', texte: '#15803d' },
  REJETEE: { label: 'Rejetée', fond: '#fde2e2', texte: '#b91c1c' },
}

const STATUTS_CANDIDATURE: Record<string, { label: string; fond: string; texte: string }> = {
  EN_ATTENTE: { label: 'En attente', fond: '#fde9d0', texte: '#c2410c' },
  ACCEPTEE: { label: 'Acceptée (Stage rattaché)', fond: '#d9f5e3', texte: '#15803d' },
  REFUSEE: { label: 'Non retenue', fond: '#fde2e2', texte: '#b91c1c' },
}

const initiales = (texte: string) =>
  texte
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((m) => m[0])
    .join('')
    .toUpperCase()

const formatDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

/* ───────── Page ───────── */

export default function EtudiantDashboard() {
  const router = useRouter()

  const [user, setUser] = useState<UserSession | null>(null)
  const [vue, setVue] = useState<Vue>('dashboard')
  const [stage, setStage] = useState<StageDetail | null>(null)
  const [convention, setConvention] = useState<ConventionDetail | null>(null)
  const [journaux, setJournaux] = useState<JournalEntree[]>([])
  const [offres, setOffres] = useState<OffreItem[]>([])
  const [candidatures, setCandidatures] = useState<CandidatureItem[]>([])
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadNotifsCount, setUnreadNotifsCount] = useState<number>(0)
  const [menuOuvert, setMenuOuvert] = useState(false)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState('')
  const [recharge, setRecharge] = useState(0)

  // Formulaire profil
  const [profilForm, setProfilForm] = useState({
    nom: '',
    prenom: '',
    matricule: '',
    classe: '',
    competences: '',
  })
  const [sauvegardeProfil, setSauvegardeProfil] = useState(false)

  // Modal postuler
  const [offreModal, setOffreModal] = useState<OffreItem | null>(null)
  const [cvUrlInput, setCvUrlInput] = useState('/uploads/cv-etudiant.pdf')
  const [lettreInput, setLettreInput] = useState('')
  const [envoiCandidature, setEnvoiCandidature] = useState(false)

  // Formulaire nouveau journal
  const [semaineInput, setSemaineInput] = useState<number>(1)
  const [heuresInput, setHeuresInput] = useState<number>(35)
  const [activitesInput, setActivitesInput] = useState('')
  const [envoiJournal, setEnvoiJournal] = useState(false)

  // Filtre notifications
  const [filtreNotifs, setFiltreNotifs] = useState<'toutes' | 'non_lues'>('toutes')

  const largeur = useSyncExternalStore(abonnerRedimension, lireLargeur, largeurServeur)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const brut = localStorage.getItem('user')

    if (!token || !brut) {
      router.push('/login')
      return
    }

    let parsedUser: UserSession
    try {
      parsedUser = JSON.parse(brut)
    } catch {
      router.push('/login')
      return
    }

    if (parsedUser.role !== 'ETUDIANT') {
      router.push('/login')
      return
    }

    setUser(parsedUser)
    setProfilForm({
      nom: parsedUser.nom || '',
      prenom: parsedUser.prenom || '',
      matricule: parsedUser.matricule || '',
      classe: parsedUser.classe || '',
      competences: parsedUser.competences || '',
    })

    const charger = async () => {
      try {
        const entetes = { authorization: `Bearer ${token}` }
        const [rStage, rJournaux, rOffres, rCandidatures, rNotifs, rProfil] = await Promise.all([
          fetch('/api/stages/me', { headers: entetes }),
          fetch('/api/journal/crud', { headers: entetes }),
          fetch('/api/offres', { headers: entetes }),
          fetch('/api/candidatures', { headers: entetes }),
          fetch('/api/notifications', { headers: entetes }),
          fetch('/api/users/profile', { headers: entetes }),
        ])

        if (rStage.status === 401 || rJournaux.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          router.push('/login')
          return
        }

        if (rStage.ok) {
          const dataStage = await rStage.json()
          const stageActif = Array.isArray(dataStage) ? dataStage[0] : dataStage
          setStage(stageActif || null)

          if (stageActif?.id) {
            const rConv = await fetch(`/api/convention?stageId=${stageActif.id}`, { headers: entetes })
            if (rConv.ok) {
              setConvention(await rConv.json())
            }
          }
        } else {
          setStage(null)
        }

        if (rJournaux.ok) {
          const listJ = await rJournaux.json()
          setJournaux(Array.isArray(listJ) ? listJ : [])
          if (Array.isArray(listJ) && listJ.length > 0) {
            setSemaineInput(Math.max(...listJ.map((j) => j.semaine || 1)) + 1)
          }
        }

        if (rOffres.ok) {
          const dataOffres = await rOffres.json()
          setOffres(Array.isArray(dataOffres) ? dataOffres : [])
        }

        if (rCandidatures.ok) {
          const dataCand = await rCandidatures.json()
          setCandidatures(Array.isArray(dataCand) ? dataCand : [])
        }

        if (rNotifs.ok) {
          const dataNotifs = await rNotifs.json()
          setNotifications(dataNotifs.notifications || [])
          setUnreadNotifsCount(dataNotifs.unreadCount || 0)
        }

        if (rProfil.ok) {
          const dataProfil = await rProfil.json()
          setUser(dataProfil)
          setProfilForm({
            nom: dataProfil.nom || '',
            prenom: dataProfil.prenom || '',
            matricule: dataProfil.matricule || '',
            classe: dataProfil.classe || '',
            competences: dataProfil.competences || '',
          })
          localStorage.setItem('user', JSON.stringify(dataProfil))
        }

        setErreur('')
      } catch {
        setErreur('Impossible de joindre le serveur.')
      } finally {
        setChargement(false)
      }
    }

    charger()
  }, [router, recharge])

  const seDeconnecter = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  const initierConvention = async () => {
    if (!stage?.id) return
    const token = localStorage.getItem('token')
    try {
      const res = await fetch('/api/convention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ stageId: stage.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErreur(data.error || 'Erreur lors de l’initiation de la convention.')
        return
      }
      setSucces('Convention initiée avec succès ! Transmise à l’entreprise.')
      setRecharge((r) => r + 1)
    } catch {
      setErreur('Erreur de communication avec le serveur.')
    }
  }

  const soumettreJournal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activitesInput.trim()) {
      setErreur('Veuillez décrire vos activités de la semaine.')
      return
    }

    const token = localStorage.getItem('token')
    setEnvoiJournal(true)
    setErreur('')

    try {
      const res = await fetch('/api/journal/crud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({
          semaine: semaineInput,
          heures: heuresInput,
          activites: activitesInput.trim(),
          date: new Date().toISOString().split('T')[0],
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setErreur(data.error || 'Erreur lors du dépôt du rapport.')
        return
      }

      setSucces(`Rapport de la semaine ${semaineInput} soumis avec succès à l'entreprise pour validation.`)
      setActivitesInput('')
      setSemaineInput((s) => s + 1)
      setRecharge((r) => r + 1)
    } catch {
      setErreur('Erreur réseau.')
    } finally {
      setEnvoiJournal(false)
    }
  }

  const postulerOffre = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!offreModal) return
    setEnvoiCandidature(true)
    setErreur('')

    const token = localStorage.getItem('token')
    try {
      const res = await fetch('/api/candidatures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({
          offreId: offreModal.id,
          cvUrl: cvUrlInput,
          lettreUrl: lettreInput,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setErreur(data.error || 'Erreur lors de la soumission de la candidature.')
        return
      }

      setSucces(`Votre candidature pour "${offreModal.titre}" a été transmise à l'entreprise.`)
      setOffreModal(null)
      setLettreInput('')
      setRecharge((r) => r + 1)
      setVue('candidatures')
    } catch {
      setErreur('Erreur réseau.')
    } finally {
      setEnvoiCandidature(false)
    }
  }

  const sauvegarderProfil = async (e: React.FormEvent) => {
    e.preventDefault()
    setSauvegardeProfil(true)
    setErreur('')

    const token = localStorage.getItem('token')
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify(profilForm),
      })

      const data = await res.json()
      if (!res.ok) {
        setErreur(data.error || 'Erreur lors de la mise à jour.')
        return
      }

      setUser(data)
      localStorage.setItem('user', JSON.stringify(data))
      setSucces('Profil mis à jour avec succès !')
    } catch {
      setErreur('Erreur réseau.')
    } finally {
      setSauvegardeProfil(false)
    }
  }

  const marquerToutesNotificationsLues = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ all: true }),
      })
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })))
        setUnreadNotifsCount(0)
      }
    } catch {
      // ignore
    }
  }

  const marquerNotificationLue = async (id: number) => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, lu: true } : n)))
        setUnreadNotifsCount((prev) => Math.max(0, prev - 1))
      }
    } catch {
      // ignore
    }
  }

  if (chargement) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #0b3590 0%, #1565e8 100%)' }}
      >
        <div className="text-xl text-white">Chargement de votre espace étudiant...</div>
      </div>
    )
  }

  const bureau = largeur >= 1024
  const echelle = bureau ? Math.min(Math.max(largeur / LARGEUR_MAQUETTE, 0.6), 1.5) : 1
  const hauteurPage = `${100 / echelle}vh`

  const nomComplet = user ? `${user.prenom} ${user.nom}`.trim() : ''
  const initialesUser = initiales(nomComplet) || 'ET'
  const entrepriseObj = stage?.candidature?.offre?.entreprise
  const entrepriseNom = entrepriseObj ? `${entrepriseObj.nom} ${entrepriseObj.prenom}`.trim() : 'Non assignée'
  const encadreurNom = stage?.encadreur ? `${stage.encadreur.prenom} ${stage.encadreur.nom}`.trim() : 'Non assigné'
  const conventionStatut = convention
    ? STATUTS_CONVENTION[convention.statut] || { label: convention.statut, fond: '#f1f5fb', texte: '#2d3b5a' }
    : null

  const candidaturesOffreIds = new Set(candidatures.map((c) => c.offre.id))
  const notifsAffichees =
    filtreNotifs === 'non_lues' ? notifications.filter((n) => !n.lu) : notifications

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
            overflowY: 'auto',
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
              <Image src="/ipddddddddd.jpeg" alt="Logo IPD" fill sizes="68px" priority style={{ objectFit: 'contain' }} />
            </div>
            <div style={{ lineHeight: 1.3 }}>
              <p style={{ margin: 0, fontSize: 13.5, fontWeight: 800 }}>
                INSTITUT POLYTECHNIQUE
                <br />
                DE DAKAR
              </p>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: '#dbe7ff' }}>
                Espace Étudiant
              </p>
            </div>
          </div>

          <nav style={{ padding: '24px 14px 0', flex: 1 }}>
            {NAV.map((n) => {
              const actif = vue === n.id
              const hasBadge = n.id === 'notifications' && unreadNotifsCount > 0
              return (
                <button
                  key={n.id}
                  onClick={() => setVue(n.id)}
                  className={actif ? '' : 'hover:bg-white/10'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    height: 44,
                    padding: '0 16px',
                    marginBottom: 8,
                    borderRadius: 8,
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: '#fff',
                    fontSize: 15,
                    fontWeight: 500,
                    ...(actif
                      ? { background: '#1565e8', boxShadow: '0 6px 16px rgba(0,0,0,0.25)' }
                      : { background: 'transparent' }),
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                    <Icon name={n.icon} size={22} />
                    <span>{n.label}</span>
                  </div>
                  {hasBadge && (
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: '#ef4444',
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {unreadNotifsCount}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          <div style={{ position: 'relative', marginTop: 'auto', height: 180, flexShrink: 0 }}>
            <svg
              viewBox="0 0 315 180"
              preserveAspectRatio="none"
              aria-hidden="true"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            >
              <path d="M0 80 C 90 70, 200 40, 315 0 L315 180 L0 180 Z" fill="rgba(21,101,232,0.38)" />
            </svg>
            <p
              style={{
                position: 'absolute',
                left: 50,
                top: 70,
                margin: 0,
                fontFamily: "'Segoe Script', 'Brush Script MT', cursive",
                fontSize: 18,
                lineHeight: '24px',
                transform: 'rotate(-10deg)',
                transformOrigin: 'left bottom',
              }}
            >
              Ensemble pour
              <br />
              l’avenir de nos étudiants
            </p>
          </div>
        </aside>
      )}

      {/* ═══════════ COLONNE PRINCIPALE ═══════════ */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        {/* Header */}
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
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#5f6d8a' }}>
              Matricule : <strong style={{ color: NAVY }}>{user?.matricule || 'Non renseigné'}</strong> · Classe : <strong style={{ color: NAVY }}>{user?.classe || 'Étudiant'}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Bouton cloche notifications */}
            <button
              onClick={() => setVue('notifications')}
              title="Mes Notifications"
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: vue === 'notifications' ? '#dbe8fd' : '#f1f5fb',
                color: vue === 'notifications' ? BLUE : '#5f6d8a',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Icon name="bell" size={20} />
              {unreadNotifsCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: '#ef4444',
                    color: '#fff',
                    fontSize: 10.5,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            {/* Menu profil */}
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
                    width: 46,
                    height: 46,
                    borderRadius: '50%',
                    background: BLUE,
                    color: '#fff',
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  {initialesUser}
                </span>
                <span style={{ textAlign: 'left', lineHeight: 1.3 }}>
                  <span style={{ display: 'block', fontSize: 14.5, fontWeight: 700, color: NAVY }}>{nomComplet}</span>
                  <span style={{ display: 'block', fontSize: 13, color: MUTED }}>Étudiant</span>
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
                    width: 200,
                    padding: 8,
                    borderRadius: 12,
                    background: '#fff',
                    border: '1px solid #eef2fa',
                    boxShadow: '0 10px 30px rgba(30,70,150,0.15)',
                    zIndex: 30,
                  }}
                >
                  <button
                    onClick={() => {
                      setVue('profil')
                      setMenuOuvert(false)
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: 'none',
                      background: 'transparent',
                      color: NAVY,
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <Icon name="user" size={18} />
                    Mon Profil
                  </button>
                  <button
                    onClick={() => {
                      setVue('notifications')
                      setMenuOuvert(false)
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: 'none',
                      background: 'transparent',
                      color: NAVY,
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <Icon name="bell" size={18} />
                    Mes Notifications
                  </button>
                  <div style={{ height: 1, background: '#eef2fa', margin: '4px 0' }} />
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
              <button onClick={() => setErreur('')} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 700 }}>✕</button>
            </div>
          )}

          {succes && (
            <div
              role="status"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                marginBottom: 20,
                padding: '12px 20px',
                borderRadius: 10,
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                color: '#065f46',
                fontSize: 14,
              }}
            >
              <span>{succes}</span>
              <button onClick={() => setSucces('')} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 700 }}>✕</button>
            </div>
          )}

          {/* ───────── VUE D'ENSEMBLE ───────── */}
          {vue === 'dashboard' && (
            <>
              <h1 style={titrePage}>Bonjour, {user?.prenom} 👋</h1>
              <p style={{ margin: '3px 0 24px', fontSize: 16, color: '#2f55b0' }}>
                Suivi académique de votre stage et de vos documents
              </p>

              {/* Cartes récapitulatives */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: bureau ? 'repeat(3, 1fr)' : 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: 19,
                }}
              >
                {/* Carte Stage */}
                <div style={{ ...CARTE, padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: BLUE, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Stage Actif
                    </span>
                    <h3 style={{ margin: '8px 0 4px', fontSize: 19, fontWeight: 700, color: NAVY }}>
                      {stage?.candidature?.offre?.titre || 'Aucun stage assigné'}
                    </h3>
                    <p style={{ margin: 0, fontSize: 14, color: '#2d3b5a', fontWeight: 600 }}>
                      🏢 {entrepriseNom}
                    </p>
                    {stage?.encadreur && (
                      <p style={{ margin: '4px 0 0', fontSize: 13, color: MUTED }}>
                        👨‍🏫 Encadreur : {encadreurNom}
                      </p>
                    )}
                    <p style={{ margin: '8px 0 0', fontSize: 12.5, color: MUTED }}>
                      Du {formatDate(stage?.dateDebut)} au {formatDate(stage?.dateFin)}
                    </p>
                  </div>
                  <button
                    onClick={() => setVue('stage')}
                    style={{ marginTop: 14, alignSelf: 'flex-start', background: 'transparent', border: 'none', color: BLUE, fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0 }}
                  >
                    Détails du stage →
                  </button>
                </div>

                {/* Carte Convention */}
                <div style={{ ...CARTE, padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: BLUE, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Statut Convention
                    </span>
                    <div style={{ marginTop: 10 }}>
                      {conventionStatut ? (
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '6px 14px',
                            borderRadius: 999,
                            background: conventionStatut.fond,
                            color: conventionStatut.texte,
                            fontSize: 13,
                            fontWeight: 700,
                          }}
                        >
                          {conventionStatut.label}
                        </span>
                      ) : (
                        <button
                          onClick={initierConvention}
                          disabled={!stage}
                          className="hover:brightness-110"
                          style={{
                            padding: '8px 16px',
                            borderRadius: 8,
                            border: 'none',
                            background: BLUE,
                            color: '#fff',
                            fontSize: 13.5,
                            fontWeight: 600,
                            cursor: stage ? 'pointer' : 'not-allowed',
                            opacity: stage ? 1 : 0.6,
                          }}
                        >
                          Initier ma convention
                        </button>
                      )}
                    </div>
                    <p style={{ margin: '12px 0 0', fontSize: 12.5, color: MUTED }}>
                      {convention?.statut === 'VALIDEE' ? 'Prête avec QR Code sécurisé' : 'Circuit tripartite obligatoire'}
                    </p>
                  </div>
                  <button
                    onClick={() => setVue('convention')}
                    style={{ marginTop: 14, alignSelf: 'flex-start', background: 'transparent', border: 'none', color: BLUE, fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0 }}
                  >
                    Consulter la convention →
                  </button>
                </div>

                {/* Carte Journal */}
                <div style={{ ...CARTE, padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: BLUE, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Journal Hebdomadaire
                    </span>
                    <h3 style={{ margin: '8px 0 4px', fontSize: 26, fontWeight: 800, color: NAVY }}>
                      {journaux.length} rapport(s) soumis
                    </h3>
                    <p style={{ margin: 0, fontSize: 13.5, color: '#16a34a', fontWeight: 600 }}>
                      Prochain rapport : Semaine {semaineInput}
                    </p>
                  </div>
                  <button
                    onClick={() => setVue('journal')}
                    style={{ marginTop: 14, alignSelf: 'flex-start', background: 'transparent', border: 'none', color: BLUE, fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0 }}
                  >
                    Remplir le journal →
                  </button>
                </div>
              </div>

              {/* Dernières entrées du journal */}
              <div style={{ marginTop: 30 }}>
                <div style={{ ...CARTE, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 22px' }}>
                    <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: NAVY }}>Derniers rapports de stage</h2>
                    <button onClick={() => setVue('journal')} style={{ background: 'transparent', border: 'none', color: BLUE, fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
                      Tout voir →
                    </button>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', minWidth: 600, borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                      <thead style={{ background: '#f4f7fc' }}>
                        <tr>
                          {['Semaine', 'Date de dépôt', 'Heures', 'Statut', 'Observations / Retours Entreprise'].map((h) => (
                            <th key={h} style={th}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {journaux.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ padding: '30px 16px', textAlign: 'center', color: MUTED }}>
                              Aucun rapport soumis pour le moment.
                            </td>
                          </tr>
                        ) : (
                          journaux.slice(0, 5).map((j) => (
                            <tr key={j.id} style={{ borderTop: '1px solid #eef2fa' }}>
                              <td style={{ padding: '14px 16px', fontWeight: 700, color: NAVY }}>Semaine {j.semaine}</td>
                              <td style={{ padding: '14px 16px', color: MUTED }}>{formatDate(j.date)}</td>
                              <td style={{ padding: '14px 16px', color: '#2d3b5a' }}>{j.heures} h</td>
                              <td style={{ padding: '14px 16px' }}>
                                <span
                                  style={{
                                    display: 'inline-block',
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
                              </td>
                              <td style={{ padding: '14px 16px', color: MUTED }}>{j.commentaire || '—'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ───────── MON STAGE ───────── */}
          {vue === 'stage' && (
            <>
              <h1 style={titrePage}>Mon Stage en Entreprise</h1>
              <p style={{ margin: '3px 0 24px', fontSize: 16, color: '#2f55b0' }}>
                Fiche complète du stage académique et encadrement professionnel
              </p>

              {!stage ? (
                <div style={{ ...CARTE, padding: 40, textAlign: 'center' }}>
                  <p style={{ fontSize: 44, margin: 0 }}>💼</p>
                  <h3 style={{ margin: '14px 0 8px', fontSize: 20, fontWeight: 700, color: NAVY }}>
                    Aucun stage actif rattaché
                  </h3>
                  <p style={{ margin: '0 auto 24px', maxWidth: 500, color: MUTED, fontSize: 14 }}>
                    Vous n’avez pas encore de stage assigné. Postulez aux offres disponibles pour obtenir une convention de stage.
                  </p>
                  <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
                    <button
                      onClick={() => setVue('offres')}
                      style={{
                        padding: '10px 22px',
                        borderRadius: 8,
                        border: 'none',
                        background: BLUE,
                        color: '#fff',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Consulter les offres
                    </button>
                    <button
                      onClick={() => setVue('candidatures')}
                      style={{
                        padding: '10px 22px',
                        borderRadius: 8,
                        border: '1px solid #dde4f1',
                        background: '#fff',
                        color: NAVY,
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Mes candidatures
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {/* Carte Principale */}
                  <div style={{ ...CARTE, padding: 28 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid #eef2fa', paddingBottom: 20, flexWrap: 'wrap', gap: 14 }}>
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: BLUE, textTransform: 'uppercase' }}>
                          Stage Référence #{stage.id}
                        </span>
                        <h2 style={{ margin: '6px 0', fontSize: 24, fontWeight: 800, color: NAVY }}>
                          {stage.candidature?.offre?.titre || 'Stage de Fin d’Études'}
                        </h2>
                        <p style={{ margin: 0, fontSize: 15, color: '#2d3b5a', fontWeight: 600 }}>
                          Entreprise Partenaire : <strong style={{ color: BLUE }}>{entrepriseNom}</strong>
                        </p>
                      </div>
                      <span
                        style={{
                          padding: '6px 16px',
                          borderRadius: 999,
                          fontSize: 13,
                          fontWeight: 700,
                          background: '#d9f5e3',
                          color: '#15803d',
                        }}
                      >
                        ● {stage.statut}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: bureau ? 'repeat(3, 1fr)' : '1fr', gap: 20, marginTop: 20 }}>
                      <div style={{ padding: 16, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: MUTED }}>PÉRIODE & DURÉE</span>
                        <p style={{ margin: '6px 0 2px', fontSize: 15, fontWeight: 700, color: NAVY }}>
                          Du {formatDate(stage.dateDebut)} au {formatDate(stage.dateFin)}
                        </p>
                        <span style={{ fontSize: 12.5, color: MUTED }}>
                          Durée contractuelle : {stage.candidature?.offre?.duree || '3 mois'}
                        </span>
                      </div>

                      <div style={{ padding: 16, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: MUTED }}>LOCALISATION DU STAGE</span>
                        <p style={{ margin: '6px 0 2px', fontSize: 15, fontWeight: 700, color: NAVY }}>
                          📍 {stage.candidature?.offre?.localisation || 'Dakar, Sénégal'}
                        </p>
                        <span style={{ fontSize: 12.5, color: MUTED }}>
                          Secteur : {stage.candidature?.offre?.entreprise?.secteur || 'Technologies & Logiciel'}
                        </span>
                      </div>

                      <div style={{ padding: 16, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: MUTED }}>ENCADREUR ACADÉMIQUE (IPD)</span>
                        <p style={{ margin: '6px 0 2px', fontSize: 15, fontWeight: 700, color: NAVY }}>
                          👨‍🏫 {encadreurNom}
                        </p>
                        <span style={{ fontSize: 12.5, color: MUTED }}>
                          {stage.encadreur?.email || 'encadreur@ipd.sn'}
                        </span>
                      </div>
                    </div>

                    {stage.candidature?.offre?.description && (
                      <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid #eef2fa' }}>
                        <h4 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: NAVY }}>
                          Description de la mission & Objectifs pédagogiques
                        </h4>
                        <p style={{ margin: 0, fontSize: 14, color: '#3b4a6b', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                          {stage.candidature.offre.description}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions & Raccourcis liés */}
                  <div style={{ display: 'grid', gridTemplateColumns: bureau ? 'repeat(2, 1fr)' : '1fr', gap: 18 }}>
                    <div style={{ ...CARTE, padding: 22 }}>
                      <h4 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: NAVY }}>
                        Journal de bord hebdomadaire
                      </h4>
                      <p style={{ margin: '0 0 16px', fontSize: 13.5, color: MUTED }}>
                        Vous avez soumis <strong>{journaux.length} rapport(s)</strong>. Le tuteur de {entrepriseNom} examine et valide vos activités.
                      </p>
                      <button
                        onClick={() => setVue('journal')}
                        style={{
                          padding: '8px 18px',
                          borderRadius: 8,
                          border: 'none',
                          background: BLUE,
                          color: '#fff',
                          fontSize: 13.5,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Ouvrir le journal de bord
                      </button>
                    </div>

                    <div style={{ ...CARTE, padding: 22 }}>
                      <h4 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: NAVY }}>
                        Convention tripartite officielle
                      </h4>
                      <p style={{ margin: '0 0 16px', fontSize: 13.5, color: MUTED }}>
                        Statut : <strong>{conventionStatut?.label || 'Non initiée'}</strong>. Circuit officiel entre vous, l’entreprise et l’administration IPD.
                      </p>
                      <button
                        onClick={() => setVue('convention')}
                        style={{
                          padding: '8px 18px',
                          borderRadius: 8,
                          border: '1px solid #dde4f1',
                          background: '#fff',
                          color: NAVY,
                          fontSize: 13.5,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Gérer ma convention
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ───────── MES CANDIDATURES ───────── */}
          {vue === 'candidatures' && (
            <>
              <h1 style={titrePage}>Mes Candidatures</h1>
              <p style={{ margin: '3px 0 24px', fontSize: 16, color: '#2f55b0' }}>
                Suivi de vos postulations aux offres de stage en entreprise
              </p>

              {candidatures.length === 0 ? (
                <div style={{ ...CARTE, padding: 40, textAlign: 'center' }}>
                  <p style={{ fontSize: 40, margin: 0 }}>📮</p>
                  <h3 style={{ margin: '14px 0 6px', fontSize: 19, fontWeight: 700, color: NAVY }}>
                    Aucune candidature enregistrée
                  </h3>
                  <p style={{ margin: '0 0 20px', color: MUTED, fontSize: 14 }}>
                    Parcourez les offres de stage publiées par nos entreprises partenaires et postulez directement.
                  </p>
                  <button
                    onClick={() => setVue('offres')}
                    style={{
                      padding: '10px 22px',
                      borderRadius: 8,
                      border: 'none',
                      background: BLUE,
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Voir les offres disponibles
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {candidatures.map((c) => {
                    const st = STATUTS_CANDIDATURE[c.statut] || { label: c.statut, fond: '#f1f5fb', texte: '#2d3b5a' }
                    return (
                      <div key={c.id} style={{ ...CARTE, padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                          <div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: BLUE }}>
                              Candidature #{c.id} · Déposée le {formatDate(c.createdAt)}
                            </span>
                            <h3 style={{ margin: '4px 0', fontSize: 18, fontWeight: 700, color: NAVY }}>
                              {c.offre.titre}
                            </h3>
                            <p style={{ margin: 0, fontSize: 14, color: '#2d3b5a' }}>
                              🏢 {c.offre.entreprise.nom} {c.offre.entreprise.prenom} · 📍 {c.offre.localisation} · ⏱️ {c.offre.duree}
                            </p>
                          </div>
                          <span
                            style={{
                              padding: '6px 14px',
                              borderRadius: 999,
                              fontSize: 13,
                              fontWeight: 700,
                              background: st.fond,
                              color: st.texte,
                            }}
                          >
                            {st.label}
                          </span>
                        </div>

                        {c.offre.description && (
                          <p style={{ margin: '4px 0 0', fontSize: 13.5, color: MUTED, lineHeight: 1.5 }}>
                            {c.offre.description}
                          </p>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #eef2fa', paddingTop: 12, marginTop: 4 }}>
                          <span style={{ fontSize: 12.5, color: MUTED }}>
                            Document rattaché : <a href={c.cvUrl} target="_blank" rel="noreferrer" style={{ color: BLUE, textDecoration: 'underline' }}>Curriculum Vitae (PDF)</a>
                          </span>
                          {c.statut === 'ACCEPTEE' && (
                            <button
                              onClick={() => setVue('stage')}
                              style={{
                                padding: '6px 14px',
                                borderRadius: 6,
                                border: 'none',
                                background: '#16a34a',
                                color: '#fff',
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Accéder au stage →
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* ───────── CONVENTION ───────── */}
          {vue === 'convention' && (
            <>
              <h1 style={titrePage}>Convention de stage tripartite</h1>
              <p style={{ margin: '3px 0 24px', fontSize: 16, color: '#2f55b0' }}>
                Circuit d’approbation et certificat officiel avec QR Code
              </p>

              <div style={{ ...CARTE, padding: 30 }}>
                {!convention ? (
                  <div style={{ textAlign: 'center', padding: '30px 0' }}>
                    <p style={{ fontSize: 40, margin: 0 }}>📄</p>
                    <h3 style={{ margin: '14px 0 6px', fontSize: 19, fontWeight: 700, color: NAVY }}>
                      Convention non encore initiée
                    </h3>
                    <p style={{ margin: '0 0 20px', color: MUTED, fontSize: 14 }}>
                      Vous devez initier votre convention pour lancer la validation par votre entreprise et l’administration.
                    </p>
                    <button
                      onClick={initierConvention}
                      disabled={!stage}
                      style={{
                        padding: '12px 24px',
                        borderRadius: 10,
                        border: 'none',
                        background: BLUE,
                        color: '#fff',
                        fontSize: 15,
                        fontWeight: 600,
                        cursor: stage ? 'pointer' : 'not-allowed',
                      }}
                    >
                      Initier la convention maintenant
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #eef2fa', paddingBottom: 20 }}>
                      <div>
                        <span style={{ fontSize: 13, color: MUTED }}>NUMÉRO DE DOSSIER #{convention.id}</span>
                        <h2 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 800, color: NAVY }}>
                          {stage?.candidature?.offre?.titre || 'Convention de stage'}
                        </h2>
                      </div>
                      <span
                        style={{
                          padding: '8px 18px',
                          borderRadius: 999,
                          fontSize: 14,
                          fontWeight: 700,
                          background: conventionStatut?.fond || '#f1f5fb',
                          color: conventionStatut?.texte || '#2d3b5a',
                        }}
                      >
                        {conventionStatut?.label}
                      </span>
                    </div>

                    {/* Circuit en 3 étapes */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, margin: '26px 0' }}>
                      <div style={{ padding: 16, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: BLUE }}>ÉTAPE 1</span>
                        <h4 style={{ margin: '4px 0', fontSize: 15, color: NAVY }}>Initiation Étudiant</h4>
                        <p style={{ margin: 0, fontSize: 12.5, color: '#16a34a' }}>✓ Complétée</p>
                      </div>
                      <div style={{ padding: 16, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: BLUE }}>ÉTAPE 2</span>
                        <h4 style={{ margin: '4px 0', fontSize: 15, color: NAVY }}>Validation Entreprise</h4>
                        <p style={{ margin: 0, fontSize: 12.5, color: convention.statut === 'ETAPE_ETUDIANT' ? '#ea580c' : '#16a34a' }}>
                          {convention.statut === 'ETAPE_ETUDIANT' ? 'En attente' : '✓ Validée'}
                        </p>
                      </div>
                      <div style={{ padding: 16, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: BLUE }}>ÉTAPE 3</span>
                        <h4 style={{ margin: '4px 0', fontSize: 15, color: NAVY }}>Validation par l'administrateur</h4>
                        <p style={{ margin: 0, fontSize: 12.5, color: convention.statut === 'VALIDEE' ? '#16a34a' : '#ea580c' }}>
                          {convention.statut === 'VALIDEE' ? '✓ Sceau apposé' : 'En attente'}
                        </p>
                      </div>
                    </div>

                    {convention.statut === 'VALIDEE' && convention.qrCodeUrl && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: 20, background: '#ecfdf5', borderRadius: 12, border: '1px solid #a7f3d0' }}>
                        <div style={{ width: 100, height: 100, position: 'relative', background: '#fff', borderRadius: 8, padding: 4 }}>
                          <Image src={convention.qrCodeUrl} alt="QR Code" fill style={{ objectFit: 'contain' }} />
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#065f46' }}>
                            Convention Officiellement Signée & Certifiée
                          </h4>
                          <p style={{ margin: '4px 0 12px', fontSize: 13, color: '#047857' }}>
                            Ce document intègre un QR Code infalsifiable garantissant son authenticité auprès de l’administration.
                          </p>
                          {convention.pdfUrl && (
                            <a
                              href={convention.pdfUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '8px 16px',
                                background: '#059669',
                                color: '#fff',
                                borderRadius: 8,
                                textDecoration: 'none',
                                fontSize: 13.5,
                                fontWeight: 600,
                              }}
                            >
                              <Icon name="download" size={16} /> Télécharger le PDF officiel
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ───────── JOURNAL DE BORD ───────── */}
          {vue === 'journal' && (
            <>
              <h1 style={titrePage}>Journal de bord hebdomadaire</h1>
              <p style={{ margin: '3px 0 24px', fontSize: 16, color: '#2f55b0' }}>
                Soumettez chaque semaine votre compte-rendu d’activités à l’entreprise
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: bureau ? '450px 1fr' : '1fr', gap: 24 }}>
                {/* Formulaire nouveau rapport */}
                <section style={{ ...CARTE, padding: 24 }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: NAVY }}>
                    Déposer un rapport
                  </h3>
                  <form onSubmit={soumettreJournal} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 4 }}>
                        Semaine
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={semaineInput}
                        onChange={(e) => setSemaineInput(Number(e.target.value))}
                        style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 8, border: '1px solid #dde4f1', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 4 }}>
                        Volume horaire (heures)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={heuresInput}
                        onChange={(e) => setHeuresInput(Number(e.target.value))}
                        style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 8, border: '1px solid #dde4f1', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 4 }}>
                        Activités réalisées & compétences mobilisées
                      </label>
                      <textarea
                        rows={6}
                        value={activitesInput}
                        onChange={(e) => setActivitesInput(e.target.value)}
                        placeholder="Détaillez vos réalisations, outils maîtrisés et progrès de la semaine..."
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #dde4f1', outline: 'none', resize: 'vertical' }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={envoiJournal}
                      className="hover:brightness-110"
                      style={{
                        height: 44,
                        borderRadius: 8,
                        border: 'none',
                        background: BLUE,
                        color: '#fff',
                        fontSize: 14.5,
                        fontWeight: 600,
                        cursor: envoiJournal ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {envoiJournal ? 'Envoi en cours...' : 'Soumettre le rapport à l’entreprise'}
                    </button>
                  </form>
                </section>

                {/* Historique des journaux */}
                <section style={{ ...CARTE, padding: 24 }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: NAVY }}>
                    Historique des semaines ({journaux.length})
                  </h3>
                  {journaux.length === 0 ? (
                    <p style={{ color: MUTED, fontSize: 14 }}>Aucun rapport soumis.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {journaux.map((j) => (
                        <div key={j.id} style={{ padding: 16, borderRadius: 10, border: '1px solid #eef2fa', background: '#fafcff' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 15, fontWeight: 700, color: NAVY }}>Semaine #{j.semaine}</span>
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
                          <p style={{ margin: '8px 0', fontSize: 13.5, color: '#2d3b5a', whiteSpace: 'pre-wrap' }}>{j.activites}</p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: MUTED, marginTop: 10, paddingTop: 8, borderTop: '1px solid #edf2f7', flexWrap: 'wrap', gap: 6 }}>
                            <span>Déposé le {formatDate(j.date)} · {j.heures}h effectuées</span>
                            {j.commentaire && <span style={{ color: '#b91c1c', fontWeight: 600 }}>Retour tuteur : {j.commentaire}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </>
          )}

          {/* ───────── OFFRES ───────── */}
          {vue === 'offres' && (
            <>
              <h1 style={titrePage}>Offres de stage disponibles</h1>
              <p style={{ margin: '3px 0 24px', fontSize: 16, color: '#2f55b0' }}>
                {offres.length} offre(s) active(s) proposée(s) par nos entreprises partenaires
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: bureau ? 'repeat(2, 1fr)' : '1fr', gap: 18 }}>
                {offres.map((o) => {
                  const dejaPostule = candidaturesOffreIds.has(o.id)
                  return (
                    <div key={o.id} style={{ ...CARTE, padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: BLUE }}>
                            {o.entreprise?.nom} {o.entreprise?.prenom}
                          </span>
                          {dejaPostule && (
                            <span style={{ fontSize: 11.5, padding: '2px 8px', borderRadius: 999, background: '#d9f5e3', color: '#15803d', fontWeight: 700 }}>
                              ✓ Candidature envoyée
                            </span>
                          )}
                        </div>
                        <h3 style={{ margin: '4px 0 8px', fontSize: 18, fontWeight: 700, color: NAVY }}>{o.titre}</h3>
                        <p style={{ margin: '0 0 12px', fontSize: 13.5, color: '#3b4a6b', lineHeight: '20px' }}>{o.description}</p>
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #eef2fa', paddingTop: 12, fontSize: 12.5, color: MUTED }}>
                          <span>📍 {o.localisation} · ⏱️ {o.duree}</span>
                          <span style={{ background: '#f1f5fb', padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>{o.tags}</span>
                        </div>
                        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setOffreModal(o)}
                            disabled={dejaPostule}
                            style={{
                              padding: '8px 16px',
                              borderRadius: 8,
                              border: 'none',
                              background: dejaPostule ? '#e2e8f0' : BLUE,
                              color: dejaPostule ? '#64748b' : '#fff',
                              fontSize: 13,
                              fontWeight: 600,
                              cursor: dejaPostule ? 'default' : 'pointer',
                            }}
                          >
                            {dejaPostule ? 'Déjà postulé' : 'Postuler à ce stage →'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Modal de candidature */}
              {offreModal && (
                <div
                  style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 50,
                    padding: 16,
                  }}
                >
                  <div style={{ ...CARTE, width: '100%', maxWidth: 540, padding: 28 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: BLUE }}>CANDIDATURE STAGE</span>
                        <h3 style={{ margin: '4px 0 0', fontSize: 19, fontWeight: 700, color: NAVY }}>
                          {offreModal.titre}
                        </h3>
                        <p style={{ margin: 0, fontSize: 13, color: MUTED }}>{offreModal.entreprise.nom}</p>
                      </div>
                      <button
                        onClick={() => setOffreModal(null)}
                        style={{ background: 'transparent', border: 'none', fontSize: 18, color: MUTED, cursor: 'pointer' }}
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={postulerOffre} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 4 }}>
                          Lien ou nom de votre CV
                        </label>
                        <input
                          type="text"
                          value={cvUrlInput}
                          onChange={(e) => setCvUrlInput(e.target.value)}
                          placeholder="/uploads/cv-mon-nom.pdf"
                          style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 8, border: '1px solid #dde4f1', outline: 'none' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 4 }}>
                          Lettre / Message de motivation (optionnel)
                        </label>
                        <textarea
                          rows={4}
                          value={lettreInput}
                          onChange={(e) => setLettreInput(e.target.value)}
                          placeholder="Présentez brièvement vos compétences clés et votre motivation..."
                          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #dde4f1', outline: 'none', resize: 'vertical' }}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                        <button
                          type="button"
                          onClick={() => setOffreModal(null)}
                          style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #dde4f1', background: '#fff', color: NAVY, fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          disabled={envoiCandidature}
                          style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: BLUE, color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}
                        >
                          {envoiCandidature ? 'Envoi...' : 'Envoyer ma candidature'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ───────── MES NOTIFICATIONS ───────── */}
          {vue === 'notifications' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h1 style={titrePage}>Mes Notifications</h1>
                  <p style={{ margin: '3px 0 0', fontSize: 16, color: '#2f55b0' }}>
                    Alertes d’assiduité, validations d’entreprise et mises à jour de convention
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => setFiltreNotifs('toutes')}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 8,
                      border: 'none',
                      background: filtreNotifs === 'toutes' ? BLUE : '#fff',
                      color: filtreNotifs === 'toutes' ? '#fff' : NAVY,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Toutes ({notifications.length})
                  </button>
                  <button
                    onClick={() => setFiltreNotifs('non_lues')}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 8,
                      border: 'none',
                      background: filtreNotifs === 'non_lues' ? BLUE : '#fff',
                      color: filtreNotifs === 'non_lues' ? '#fff' : NAVY,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Non lues ({unreadNotifsCount})
                  </button>
                  {unreadNotifsCount > 0 && (
                    <button
                      onClick={marquerToutesNotificationsLues}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 8,
                        border: '1px solid #dde4f1',
                        background: '#fff',
                        color: BLUE,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Tout marquer comme lu
                    </button>
                  )}
                </div>
              </div>

              {notifsAffichees.length === 0 ? (
                <div style={{ ...CARTE, padding: 40, textAlign: 'center', color: MUTED }}>
                  <p style={{ fontSize: 36, margin: 0 }}>🔔</p>
                  <p style={{ fontWeight: 600, color: NAVY, margin: '8px 0 0' }}>Aucune notification pour le moment</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {notifsAffichees.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        ...CARTE,
                        padding: 18,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 16,
                        borderLeft: n.lu ? '1px solid #eef2fa' : `4px solid ${BLUE}`,
                        background: n.lu ? '#fff' : '#f8faff',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 38,
                            height: 38,
                            borderRadius: '50%',
                            background: n.lu ? '#f1f5fb' : '#dbe8fd',
                            color: n.lu ? MUTED : BLUE,
                          }}
                        >
                          <Icon name="bell" size={18} />
                        </span>
                        <div>
                          <p style={{ margin: 0, fontSize: 14.5, fontWeight: n.lu ? 500 : 700, color: NAVY }}>
                            {n.message}
                          </p>
                          <span style={{ fontSize: 12, color: MUTED }}>{formatDate(n.createdAt)}</span>
                        </div>
                      </div>

                      {!n.lu && (
                        <button
                          onClick={() => marquerNotificationLue(n.id)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 6,
                            border: '1px solid #dde4f1',
                            background: '#fff',
                            color: BLUE,
                            fontSize: 12.5,
                            fontWeight: 600,
                            cursor: 'pointer',
                            flexShrink: 0,
                          }}
                        >
                          Marquer comme lu
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ───────── MON PROFIL ───────── */}
          {vue === 'profil' && (
            <>
              <h1 style={titrePage}>Mon Profil Étudiant</h1>
              <p style={{ margin: '3px 0 24px', fontSize: 16, color: '#2f55b0' }}>
                Vos coordonnées académiques et compétences enregistrées
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: bureau ? '360px 1fr' : '1fr', gap: 24 }}>
                {/* Carte profil gauche */}
                <div style={{ ...CARTE, padding: 26, textAlign: 'center' }}>
                  <div
                    style={{
                      width: 84,
                      height: 84,
                      borderRadius: '50%',
                      background: BLUE,
                      color: '#fff',
                      fontSize: 28,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                    }}
                  >
                    {initialesUser}
                  </div>
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: NAVY }}>{nomComplet}</h3>
                  <p style={{ margin: '4px 0 16px', fontSize: 13.5, color: MUTED }}>{user?.email}</p>

                  <div style={{ textAlign: 'left', borderTop: '1px solid #eef2fa', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      <span style={{ fontSize: 12, color: MUTED }}>Matricule académique</span>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: NAVY }}>{user?.matricule || 'Non renseigné'}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: 12, color: MUTED }}>Classe / Filière</span>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: NAVY }}>{user?.classe || 'Non renseignée'}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: 12, color: MUTED }}>Compétences</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                        {user?.competences
                          ? user.competences.split(',').map((c) => (
                              <span key={c} style={{ background: '#f1f5fb', color: BLUE, padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                                {c.trim()}
                              </span>
                            ))
                          : <span style={{ fontSize: 13, color: MUTED }}>Aucune compétence renseignée</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Formulaire modification droite */}
                <div style={{ ...CARTE, padding: 28 }}>
                  <h3 style={{ margin: '0 0 18px', fontSize: 18, fontWeight: 700, color: NAVY }}>
                    Modifier mes informations
                  </h3>
                  <form onSubmit={sauvegarderProfil} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: bureau ? '1fr 1fr' : '1fr', gap: 14 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 4 }}>
                          Prénom
                        </label>
                        <input
                          type="text"
                          value={profilForm.prenom}
                          onChange={(e) => setProfilForm({ ...profilForm, prenom: e.target.value })}
                          style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 8, border: '1px solid #dde4f1', outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 4 }}>
                          Nom
                        </label>
                        <input
                          type="text"
                          value={profilForm.nom}
                          onChange={(e) => setProfilForm({ ...profilForm, nom: e.target.value })}
                          style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 8, border: '1px solid #dde4f1', outline: 'none' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: bureau ? '1fr 1fr' : '1fr', gap: 14 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 4 }}>
                          Numéro de Matricule
                        </label>
                        <input
                          type="text"
                          value={profilForm.matricule}
                          onChange={(e) => setProfilForm({ ...profilForm, matricule: e.target.value })}
                          placeholder="Ex: L3GL2026-001"
                          style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 8, border: '1px solid #dde4f1', outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 4 }}>
                          Classe / Niveau
                        </label>
                        <input
                          type="text"
                          value={profilForm.classe}
                          onChange={(e) => setProfilForm({ ...profilForm, classe: e.target.value })}
                          placeholder="Ex: L3 Génie Logiciel"
                          style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 8, border: '1px solid #dde4f1', outline: 'none' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 4 }}>
                        Compétences techniques (séparées par des virgules)
                      </label>
                      <input
                        type="text"
                        value={profilForm.competences}
                        onChange={(e) => setProfilForm({ ...profilForm, competences: e.target.value })}
                        placeholder="Ex: JavaScript, React, Node.js, SQL, Python"
                        style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 8, border: '1px solid #dde4f1', outline: 'none' }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={sauvegardeProfil}
                      className="hover:brightness-110"
                      style={{
                        alignSelf: 'flex-start',
                        padding: '10px 24px',
                        borderRadius: 8,
                        border: 'none',
                        background: BLUE,
                        color: '#fff',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: sauvegardeProfil ? 'not-allowed' : 'pointer',
                        marginTop: 6,
                      }}
                    >
                      {sauvegardeProfil ? 'Enregistrement...' : 'Enregistrer les modifications'}
                    </button>
                  </form>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
