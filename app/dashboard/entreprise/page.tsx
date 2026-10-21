// app/dashboard/entreprise/page.tsx
// Tableau de bord entreprise — IPD Gestion des Stages

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

type Vue = 'dashboard' | 'conventions' | 'rapports' | 'offres' | 'notifications'

interface UserSession {
  id: number
  nom: string
  prenom: string
  email: string
  role: string
  secteur?: string
}

interface ConventionItem {
  id: number
  stageId: number
  statut: string
  stage: {
    etudiant: {
      nom: string
      prenom: string
      email?: string
      matricule?: string
      classe?: string
    }
  }
}

interface JournalAttente {
  id: number
  stageId?: number
  semaine: number
  contenu: string
  activites?: string
  heures?: number
  date?: string
  observations?: string
  statut?: string
  dateDepot: string
  stage: {
    id: number
    etudiant: {
      id?: number
      nom: string
      prenom: string
      matricule?: string
      classe?: string
      email?: string
    }
    candidature?: {
      offre?: {
        id?: number
        titre: string
      }
    }
  }
}

interface OffreItem {
  id: number
  titre: string
  description: string
  duree: string
  localisation: string
  tags: string
  statut: string
  createdAt: string
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
  briefcase: (
    <>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M2 13h20" />
    </>
  ),
  chevronDown: <path d="M6 9l6 6 6-6" />,
  logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
  check: <polyline points="20 6 9 17 4 12" />,
  x: (
    <>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
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

/* ───────── Styles ───────── */

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
  { id: 'conventions', label: 'Conventions à signer', icon: 'docCheck' },
  { id: 'rapports', label: 'Rapports à valider', icon: 'book' },
  { id: 'offres', label: 'Mes Offres', icon: 'briefcase' },
  { id: 'notifications', label: 'Mes Notifications', icon: 'bell' },
]

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

export default function EntrepriseDashboard() {
  const router = useRouter()

  const [user, setUser] = useState<UserSession | null>(null)
  const [vue, setVue] = useState<Vue>('dashboard')
  const [conventions, setConventions] = useState<ConventionItem[]>([])
  const [rapports, setRapports] = useState<JournalAttente[]>([])
  const [offres, setOffres] = useState<OffreItem[]>([])
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadNotifsCount, setUnreadNotifsCount] = useState<number>(0)
  const [filtreNotifs, setFiltreNotifs] = useState<'toutes' | 'non_lues'>('toutes')
  const [menuOuvert, setMenuOuvert] = useState(false)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState('')
  const [recharge, setRecharge] = useState(0)

  // Formulaire nouvelle offre
  const [nouvelleOffre, setNouvelleOffre] = useState({
    titre: '',
    description: '',
    duree: '3 mois',
    localisation: 'Dakar',
    tags: 'Génie Logiciel',
  })
  const [creationOffre, setCreationOffre] = useState(false)

  // Commentaire validation rapport
  const [commentaireRapport, setCommentaireRapport] = useState<Record<number, string>>({})
  const [actionRapportId, setActionRapportId] = useState<number | null>(null)

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

    if (parsedUser.role !== 'ENTREPRISE') {
      router.push('/login')
      return
    }

    setUser(parsedUser)

    const charger = async () => {
      try {
        const entetes = { authorization: `Bearer ${token}` }
        const [rConv, rJournaux, rOffres, rNotifs] = await Promise.all([
          fetch('/api/convention/en-attente', { headers: entetes }),
          fetch('/api/journal/en-attente', { headers: entetes }),
          fetch('/api/offres?mine=true', { headers: entetes }),
          fetch('/api/notifications', { headers: entetes }),
        ])

        if (rConv.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          router.push('/login')
          return
        }

        if (rConv.ok) {
          const data = await rConv.json()
          setConventions(Array.isArray(data) ? data : [])
        }

        if (rJournaux.ok) {
          const data = await rJournaux.json()
          setRapports(Array.isArray(data) ? data : [])
        }

        if (rOffres.ok) {
          const data = await rOffres.json()
          setOffres(Array.isArray(data) ? data : [])
        }

        if (rNotifs.ok) {
          const dataNotifs = await rNotifs.json()
          setNotifications(dataNotifs.notifications || [])
          setUnreadNotifsCount(dataNotifs.unreadCount || 0)
        }

        setErreur('')
      } catch {
        setErreur('Impossible de contacter le serveur.')
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

  const signerConvention = async (id: number) => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`/api/convention/${id}/entreprise`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'VALIDER' }),
      })
      if (!res.ok) {
        setErreur('Erreur lors de la signature de la convention.')
        return
      }
      setSucces('Convention signée avec succès ! Transmise à l’administrateur pour visa final.')
      setRecharge((r) => r + 1)
    } catch {
      setErreur('Erreur de connexion.')
    }
  }

  const validerRapport = async (id: number, statut: 'VALIDE' | 'REJETE') => {
    const token = localStorage.getItem('token')
    const commentaire = commentaireRapport[id] || ''
    setActionRapportId(id)

    try {
      const res = await fetch(`/api/journal/${id}/validate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ statut, commentaire }),
      })
      if (!res.ok) {
        setErreur('Impossible de mettre à jour le rapport.')
        return
      }
      setSucces(`Rapport ${statut === 'VALIDE' ? 'validé avec succès' : 'renvoyé pour correction'}. L'étudiant a été notifié.`)
      setRecharge((r) => r + 1)
    } catch {
      setErreur('Erreur de connexion.')
    } finally {
      setActionRapportId(null)
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

  const creerOffre = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nouvelleOffre.titre.trim() || !nouvelleOffre.description.trim()) {
      setErreur('Le titre et la description sont requis.')
      return
    }

    const token = localStorage.getItem('token')
    setCreationOffre(true)
    setErreur('')

    try {
      const res = await fetch('/api/offres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify(nouvelleOffre),
      })
      if (!res.ok) {
        setErreur('Erreur lors de la publication de l’offre.')
        return
      }
      setSucces('Offre publiée avec succès ! Elle est désormais visible par les étudiants.')
      setNouvelleOffre({ titre: '', description: '', duree: '3 mois', localisation: 'Dakar', tags: 'Génie Logiciel' })
      setRecharge((r) => r + 1)
    } catch {
      setErreur('Erreur réseau.')
    } finally {
      setCreationOffre(false)
    }
  }

  if (chargement) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #0b3590 0%, #1565e8 100%)' }}
      >
        <div className="text-xl text-white">Chargement de votre espace entreprise...</div>
      </div>
    )
  }

  const bureau = largeur >= 1024
  const echelle = bureau ? Math.min(Math.max(largeur / LARGEUR_MAQUETTE, 0.6), 1.5) : 1
  const hauteurPage = `${100 / echelle}vh`

  const nomComplet = user ? `${user.prenom} ${user.nom}`.trim() : ''
  const initialesUser = initiales(nomComplet) || 'EN'
  const notifsAffichees =
    filtreNotifs === 'non_lues' ? notifications.filter((n) => !n.lu) : notifications

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
              <Image src="/logo-ipd.png" alt="Logo IPD" fill sizes="68px" priority style={{ objectFit: 'contain' }} />
            </div>
            <div style={{ lineHeight: 1.3 }}>
              <p style={{ margin: 0, fontSize: 13.5, fontWeight: 800 }}>
                INSTITUT POLYTECHNIQUE
                <br />
                DE DAKAR
              </p>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: '#dbe7ff' }}>
                Espace Entreprise
              </p>
            </div>
          </div>

          <nav style={{ padding: '24px 14px 0', flex: 1 }}>
            {NAV.map((n) => {
              const actif = vue === n.id
              const hasBadge =
                (n.id === 'rapports' && rapports.length > 0) ||
                (n.id === 'conventions' && conventions.length > 0) ||
                (n.id === 'notifications' && unreadNotifsCount > 0)
              const badgeCount =
                n.id === 'rapports'
                  ? rapports.length
                  : n.id === 'conventions'
                  ? conventions.length
                  : unreadNotifsCount

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
                        background: n.id === 'notifications' ? '#ef4444' : '#f59e0b',
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {badgeCount}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
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
              Entreprise Partenaire : <strong style={{ color: NAVY }}>{nomComplet}</strong> {user?.secteur ? `(${user.secteur})` : ''}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Cloche notification */}
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
                    background: '#16a34a',
                    color: '#fff',
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  {initialesUser}
                </span>
                <span style={{ textAlign: 'left', lineHeight: 1.3 }}>
                  <span style={{ display: 'block', fontSize: 14.5, fontWeight: 700, color: NAVY }}>{nomComplet}</span>
                  <span style={{ display: 'block', fontSize: 13, color: MUTED }}>Tuteur Entreprise</span>
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
            <div role="alert" style={{ marginBottom: 20, padding: '12px 20px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 14 }}>
              {erreur}
            </div>
          )}

          {succes && (
            <div role="status" style={{ marginBottom: 20, padding: '12px 20px', borderRadius: 10, background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', fontSize: 14 }}>
              {succes}
            </div>
          )}

          {/* ───────── VUE D'ENSEMBLE ───────── */}
          {vue === 'dashboard' && (
            <>
              <h1 style={titrePage}>Tableau de bord Entreprise</h1>
              <p style={{ margin: '3px 0 24px', fontSize: 16, color: '#2f55b0' }}>
                Gestion de vos stagiaires et validation des engagements
              </p>

              {/* Cartes métriques */}
              <div style={{ display: 'grid', gridTemplateColumns: bureau ? 'repeat(3, 1fr)' : '1fr', gap: 19 }}>
                <div style={{ ...CARTE, padding: 22 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: MUTED }}>CONVENTIONS À SIGNER</span>
                  <h3 style={{ margin: '8px 0 4px', fontSize: 30, fontWeight: 800, color: conventions.length > 0 ? '#ea580c' : NAVY }}>
                    {conventions.length}
                  </h3>
                  <button onClick={() => setVue('conventions')} style={{ background: 'transparent', border: 'none', color: BLUE, fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                    Consulter et signer →
                  </button>
                </div>

                <div style={{ ...CARTE, padding: 22 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: MUTED }}>RAPPORTS HEBDOMADAIRES EN ATTENTE</span>
                  <h3 style={{ margin: '8px 0 4px', fontSize: 30, fontWeight: 800, color: rapports.length > 0 ? '#1d56c9' : NAVY }}>
                    {rapports.length}
                  </h3>
                  <button onClick={() => setVue('rapports')} style={{ background: 'transparent', border: 'none', color: BLUE, fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                    Valider les rapports →
                  </button>
                </div>

                <div style={{ ...CARTE, padding: 22 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: MUTED }}>OFFRES ACTIVES PUBLIÉES</span>
                  <h3 style={{ margin: '8px 0 4px', fontSize: 30, fontWeight: 800, color: NAVY }}>
                    {offres.length}
                  </h3>
                  <button onClick={() => setVue('offres')} style={{ background: 'transparent', border: 'none', color: BLUE, fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                    Gérer mes offres →
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ───────── CONVENTIONS À SIGNER ───────── */}
          {vue === 'conventions' && (
            <>
              <h1 style={titrePage}>Conventions en attente de votre signature</h1>
              <p style={{ margin: '3px 0 24px', fontSize: 16, color: '#2f55b0' }}>
                {conventions.length} convention(s) initiée(s) par vos stagiaires
              </p>

              {conventions.length === 0 ? (
                <div style={{ ...CARTE, padding: 40, textAlign: 'center', color: MUTED }}>
                  <p style={{ fontSize: 36, margin: 0 }}>📄</p>
                  <p style={{ fontWeight: 600, color: NAVY, margin: '8px 0 0' }}>Aucune convention en attente</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {conventions.map((c) => (
                    <div key={c.id} style={{ ...CARTE, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: BLUE }}>DOSSIER #{c.id}</span>
                        <h3 style={{ margin: '4px 0', fontSize: 18, fontWeight: 700, color: NAVY }}>
                          {c.stage.etudiant.prenom} {c.stage.etudiant.nom}
                        </h3>
                        <p style={{ margin: 0, fontSize: 13, color: MUTED }}>
                          Classe : {c.stage.etudiant.classe || 'Étudiant'} · Matricule : {c.stage.etudiant.matricule || 'N/A'}
                        </p>
                      </div>
                      <button
                        onClick={() => signerConvention(c.id)}
                        className="hover:brightness-110"
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
                        Signer et valider la convention
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ───────── RAPPORTS À VALIDER ───────── */}
          {vue === 'rapports' && (
            <>
              <h1 style={titrePage}>Validation des rapports hebdomadaires</h1>
              <p style={{ margin: '3px 0 24px', fontSize: 16, color: '#2f55b0' }}>
                {rapports.length} rapport(s) soumis par vos stagiaires en attente de visa
              </p>

              {rapports.length === 0 ? (
                <div style={{ ...CARTE, padding: 40, textAlign: 'center', color: MUTED }}>
                  <p style={{ fontSize: 36, margin: 0 }}>📝</p>
                  <p style={{ fontWeight: 600, color: NAVY, margin: '8px 0 0' }}>Tous les rapports sont à jour</p>
                  <p style={{ margin: '4px 0 0', fontSize: 13 }}>Aucun nouveau rapport soumis par vos stagiaires.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {rapports.map((r) => (
                    <div key={r.id} style={{ ...CARTE, padding: 24 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid #eef2fa', paddingBottom: 14, flexWrap: 'wrap', gap: 12 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 13, fontWeight: 800, color: BLUE, background: '#dbe8fd', padding: '3px 10px', borderRadius: 999 }}>
                              Semaine #{r.semaine}
                            </span>
                            <span style={{ fontSize: 13, color: MUTED }}>
                              {r.heures ? `${r.heures}h effectuées` : '35h effectuées'}
                            </span>
                          </div>
                          <h3 style={{ margin: '6px 0 2px', fontSize: 19, fontWeight: 700, color: NAVY }}>
                            {r.stage.etudiant.prenom} {r.stage.etudiant.nom}
                          </h3>
                          <p style={{ margin: 0, fontSize: 13, color: MUTED }}>
                            {r.stage.candidature?.offre?.titre ? `Stage : ${r.stage.candidature.offre.titre} · ` : ''}
                            Classe : {r.stage.etudiant.classe || 'L3 Génie Logiciel'} · Matricule : {r.stage.etudiant.matricule || 'N/A'}
                          </p>
                        </div>
                        <span style={{ fontSize: 12.5, color: MUTED }}>
                          Déposé le {formatDate(r.dateDepot)}
                        </span>
                      </div>

                      <div style={{ margin: '16px 0', background: '#fafcff', padding: 16, borderRadius: 10, border: '1px solid #eef2fa' }}>
                        <h4 style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700, color: MUTED, textTransform: 'uppercase' }}>
                          Activités & réalisations détaillées
                        </h4>
                        <p style={{ margin: 0, fontSize: 14.5, color: '#2d3b5a', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                          {r.activites || r.contenu}
                        </p>
                        {r.observations && (
                          <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px dashed #e2e8f0', fontSize: 13, color: '#64748b' }}>
                            <strong>Observations de l'étudiant :</strong> {r.observations}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 14, flexWrap: 'wrap' }}>
                        <input
                          type="text"
                          placeholder="Commentaire ou recommandation pour l’étudiant (ex: Excellent travail, bien documenté)..."
                          value={commentaireRapport[r.id] || ''}
                          onChange={(e) => setCommentaireRapport({ ...commentaireRapport, [r.id]: e.target.value })}
                          style={{ flex: 1, minWidth: 260, height: 42, padding: '0 12px', borderRadius: 8, border: '1px solid #dde4f1', outline: 'none' }}
                        />
                        <button
                          onClick={() => validerRapport(r.id, 'VALIDE')}
                          disabled={actionRapportId === r.id}
                          style={{ padding: '0 20px', height: 42, borderRadius: 8, border: 'none', background: '#16a34a', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                        >
                          {actionRapportId === r.id ? 'Validation...' : 'Valider ce rapport'}
                        </button>
                        <button
                          onClick={() => validerRapport(r.id, 'REJETE')}
                          disabled={actionRapportId === r.id}
                          style={{ padding: '0 20px', height: 42, borderRadius: 8, border: '1px solid #fecaca', background: '#fff', color: '#dc2626', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                        >
                          Demander correction
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ───────── MES OFFRES ───────── */}
          {vue === 'offres' && (
            <>
              <h1 style={titrePage}>Offres de stage</h1>
              <p style={{ margin: '3px 0 24px', fontSize: 16, color: '#2f55b0' }}>
                Publiez vos opportunités de recrutement pour les étudiants de l’IPD
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: bureau ? '460px 1fr' : '1fr', gap: 24 }}>
                <section style={{ ...CARTE, padding: 24 }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: NAVY }}>
                    Déposer une nouvelle offre
                  </h3>
                  <form onSubmit={creerOffre} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 4 }}>Titre de l’offre</label>
                      <input
                        type="text"
                        value={nouvelleOffre.titre}
                        onChange={(e) => setNouvelleOffre({ ...nouvelleOffre, titre: e.target.value })}
                        placeholder="Ex: Développeur Fullstack Junior"
                        style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 8, border: '1px solid #dde4f1', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 4 }}>Durée</label>
                      <input
                        type="text"
                        value={nouvelleOffre.duree}
                        onChange={(e) => setNouvelleOffre({ ...nouvelleOffre, duree: e.target.value })}
                        placeholder="Ex: 3 mois"
                        style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 8, border: '1px solid #dde4f1', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 4 }}>Localisation</label>
                      <input
                        type="text"
                        value={nouvelleOffre.localisation}
                        onChange={(e) => setNouvelleOffre({ ...nouvelleOffre, localisation: e.target.value })}
                        placeholder="Ex: Dakar, Almadies"
                        style={{ width: '100%', height: 42, padding: '0 12px', borderRadius: 8, border: '1px solid #dde4f1', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 4 }}>Description & profil recherché</label>
                      <textarea
                        rows={5}
                        value={nouvelleOffre.description}
                        onChange={(e) => setNouvelleOffre({ ...nouvelleOffre, description: e.target.value })}
                        placeholder="Missions du stage, technologies requises..."
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #dde4f1', outline: 'none', resize: 'vertical' }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={creationOffre}
                      style={{ height: 44, borderRadius: 8, border: 'none', background: BLUE, color: '#fff', fontSize: 14.5, fontWeight: 600, cursor: 'pointer' }}
                    >
                      {creationOffre ? 'Publication...' : 'Publier l’offre'}
                    </button>
                  </form>
                </section>

                <section style={{ ...CARTE, padding: 24 }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: NAVY }}>
                    Vos offres publiées ({offres.length})
                  </h3>
                  {offres.length === 0 ? (
                    <p style={{ color: MUTED, fontSize: 14 }}>Vous n’avez pas encore déposé d’offre.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {offres.map((o) => (
                        <div key={o.id} style={{ padding: 16, borderRadius: 10, border: '1px solid #eef2fa', background: '#fafcff' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: NAVY }}>{o.titre}</h4>
                            <span style={{ fontSize: 12, padding: '3px 8px', borderRadius: 999, background: o.statut === 'PUBLIEE' ? '#d9f5e3' : '#fde9d0', color: o.statut === 'PUBLIEE' ? '#15803d' : '#c2410c', fontWeight: 600 }}>
                              {o.statut}
                            </span>
                          </div>
                          <p style={{ margin: '8px 0', fontSize: 13, color: '#3b4a6b' }}>{o.description}</p>
                          <span style={{ fontSize: 12, color: MUTED }}>📍 {o.localisation} · ⏱️ {o.duree}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </>
          )}

          {/* ───────── MES NOTIFICATIONS ───────── */}
          {vue === 'notifications' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h1 style={titrePage}>Mes Notifications</h1>
                  <p style={{ margin: '3px 0 0', fontSize: 16, color: '#2f55b0' }}>
                    Alertes sur les rapports de stage, conventions et nouvelles candidatures
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
        </main>
      </div>
    </div>
  )
}
