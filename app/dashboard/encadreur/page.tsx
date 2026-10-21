// app/dashboard/encadreur/page.tsx
// Tableau de bord encadreur pédagogique — IPD Gestion des Stages

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

type Vue = 'suivi' | 'notifications'

interface ProgressionStagiaire {
  stageId: number
  etudiant: { id: number; nom: string; prenom: string }
  semaineActuelle: number
  rapportsSoumis: number
  rapportsValides: number
  rapportsEnRetard: number
  pourcentageProgression: number
}

interface UserSession {
  id: number
  nom: string
  prenom: string
  email: string
  role: string
}

interface NotificationItem {
  id: number
  message: string
  lu: boolean
  type: string
  createdAt: string
}

const LARGEUR_MAQUETTE = 1672
const abonnerRedimension = (rappel: () => void) => {
  window.addEventListener('resize', rappel)
  return () => window.removeEventListener('resize', rappel)
}
const lireLargeur = () => window.innerWidth
const largeurServeur = () => LARGEUR_MAQUETTE

const NAVY = '#0b2f7a'
const BLUE = '#1d6fe8'
const MUTED = '#6b7a99'

const CARTE: CSSProperties = {
  background: '#fff',
  borderRadius: 14,
  border: '1px solid #eef2fa',
  boxShadow: '0 2px 10px rgba(30, 70, 150, 0.06)',
}

const ICONS = {
  chart: (
    <>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
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

const NAV: { id: Vue; label: string; icon: IconName }[] = [
  { id: 'suivi', label: 'Suivi des Stagiaires', icon: 'chart' },
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

export default function EncadreurDashboard() {
  const router = useRouter()

  const [user, setUser] = useState<UserSession | null>(null)
  const [vue, setVue] = useState<Vue>('suivi')
  const [stagiaires, setStagiaires] = useState<ProgressionStagiaire[]>([])
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadNotifsCount, setUnreadNotifsCount] = useState<number>(0)
  const [filtreNotifs, setFiltreNotifs] = useState<'toutes' | 'non_lues'>('toutes')
  const [recherche, setRecherche] = useState('')
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [menuOuvert, setMenuOuvert] = useState(false)

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

    if (parsedUser.role !== 'ENCADREUR') {
      router.push('/login')
      return
    }

    setUser(parsedUser)

    const charger = async () => {
      try {
        const entetes = { authorization: `Bearer ${token}` }
        const [rSuivi, rNotifs] = await Promise.all([
          fetch('/api/dashboard/encadreur', { headers: entetes }),
          fetch('/api/notifications', { headers: entetes }),
        ])

        if (rSuivi.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          router.push('/login')
          return
        }

        if (rSuivi.ok) {
          const data = await rSuivi.json()
          setStagiaires(Array.isArray(data) ? data : [])
        } else {
          setErreur('Impossible de charger les données du dashboard.')
        }

        if (rNotifs.ok) {
          const dataNotifs = await rNotifs.json()
          setNotifications(dataNotifs.notifications || [])
          setUnreadNotifsCount(dataNotifs.unreadCount || 0)
        }
      } catch {
        setErreur('Erreur de connexion avec le serveur.')
      } finally {
        setChargement(false)
      }
    }

    charger()
  }, [router])

  const seDeconnecter = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
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
        <div className="text-xl text-white">Chargement de votre espace encadreur...</div>
      </div>
    )
  }

  const bureau = largeur >= 1024
  const echelle = bureau ? Math.min(Math.max(largeur / LARGEUR_MAQUETTE, 0.6), 1.5) : 1
  const hauteurPage = `${100 / echelle}vh`

  const nomComplet = user ? `${user.prenom} ${user.nom}`.trim() : ''
  const initialesUser = initiales(nomComplet) || 'EN'

  const totalAlertes = stagiaires.reduce((acc, s) => acc + s.rapportsEnRetard, 0)
  const q = recherche.trim().toLowerCase()
  const stagiairesFiltres = q
    ? stagiaires.filter((s) => `${s.etudiant.prenom} ${s.etudiant.nom}`.toLowerCase().includes(q))
    : stagiaires

  const notifsAffichees =
    filtreNotifs === 'non_lues' ? notifications.filter((n) => !n.lu) : notifications

  const titrePage: CSSProperties = { margin: 0, fontSize: 30, fontWeight: 800, color: NAVY, lineHeight: 1.2 }
  const th: CSSProperties = { padding: '13px 16px', fontWeight: 600, color: '#5f6d8a', fontSize: 12.5 }

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
                Encadrement Pédagogique
              </p>
            </div>
          </div>

          <nav style={{ padding: '28px 14px 0', flex: 1 }}>
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
          {vue === 'suivi' ? (
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
              <span>🔍</span>
              <input
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher un étudiant stagiaire..."
                className="w-full bg-transparent outline-none"
                style={{ fontSize: 15, color: '#2d3b5a' }}
              />
            </label>
          ) : (
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#5f6d8a' }}>
                Espace Encadrant : <strong style={{ color: NAVY }}>{nomComplet}</strong>
              </span>
            </div>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
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
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: '#7c3aed',
                    color: '#fff',
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  {initialesUser}
                </span>
                <span style={{ textAlign: 'left', lineHeight: 1.3 }}>
                  <span style={{ display: 'block', fontSize: 14.5, fontWeight: 700, color: NAVY }}>{nomComplet}</span>
                  <span style={{ display: 'block', fontSize: 13, color: MUTED }}>Encadreur académique</span>
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

          {/* ───────── SUIVI DES STAGIAIRES ───────── */}
          {vue === 'suivi' && (
            <>
              <h1 style={titrePage}>Suivi académique des stages</h1>
              <p style={{ margin: '3px 0 24px', fontSize: 16, color: '#2f55b0' }}>
                Progression des rapports hebdomadaires et détection des alertes
              </p>

              {/* Cartes métriques */}
              <div style={{ display: 'grid', gridTemplateColumns: bureau ? 'repeat(3, 1fr)' : '1fr', gap: 19, marginBottom: 30 }}>
                <div style={{ ...CARTE, padding: 22 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: MUTED }}>STAGIAIRES SUIVIS</span>
                  <h3 style={{ margin: '8px 0 4px', fontSize: 32, fontWeight: 800, color: NAVY }}>{stagiaires.length}</h3>
                  <p style={{ margin: 0, fontSize: 13, color: '#16a34a' }}>Stages en cours</p>
                </div>

                <div style={{ ...CARTE, padding: 22 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: MUTED }}>ALERTES DE RETARD</span>
                  <h3 style={{ margin: '8px 0 4px', fontSize: 32, fontWeight: 800, color: totalAlertes > 0 ? '#dc2626' : '#16a34a' }}>
                    {totalAlertes}
                  </h3>
                  <p style={{ margin: 0, fontSize: 13, color: totalAlertes > 0 ? '#dc2626' : MUTED }}>
                    {totalAlertes > 0 ? 'Rapports non soumis depuis + de 7 jours' : 'Aucun retard constaté'}
                  </p>
                </div>

                <div style={{ ...CARTE, padding: 22 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: MUTED }}>TAUX GLOBAL DE REMISE</span>
                  <h3 style={{ margin: '8px 0 4px', fontSize: 32, fontWeight: 800, color: BLUE }}>
                    {stagiaires.length > 0 ? Math.round(stagiaires.reduce((acc, s) => acc + s.pourcentageProgression, 0) / stagiaires.length) : 0}%
                  </h3>
                  <p style={{ margin: 0, fontSize: 13, color: MUTED }}>Moyenne de régularité</p>
                </div>
              </div>

              {/* Tableau des stagiaires */}
              <section style={{ ...CARTE, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', minWidth: 700, borderCollapse: 'collapse', textAlign: 'left', fontSize: 13.5 }}>
                    <thead style={{ background: '#f4f7fc' }}>
                      <tr>
                        {['Étudiant', 'Semaine en cours', 'Rapports soumis', 'Validés', 'Alertes retard', 'Progression'].map((h) => (
                          <th key={h} style={th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {stagiairesFiltres.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: '40px 16px', textAlign: 'center', color: MUTED }}>
                            Aucun stagiaire trouvé.
                          </td>
                        </tr>
                      ) : (
                        stagiairesFiltres.map((s) => (
                          <tr key={s.stageId} style={{ borderTop: '1px solid #eef2fa' }}>
                            <td style={{ padding: '15px 16px', fontWeight: 700, color: NAVY }}>
                              {s.etudiant.prenom} {s.etudiant.nom}
                            </td>
                            <td style={{ padding: '15px 16px', color: '#2d3b5a' }}>Semaine {s.semaineActuelle}</td>
                            <td style={{ padding: '15px 16px', color: '#2d3b5a' }}>{s.rapportsSoumis} rapport(s)</td>
                            <td style={{ padding: '15px 16px', color: '#16a34a', fontWeight: 600 }}>{s.rapportsValides} validé(s)</td>
                            <td style={{ padding: '15px 16px' }}>
                              {s.rapportsEnRetard > 0 ? (
                                <span style={{ padding: '3px 8px', borderRadius: 999, background: '#fef2f2', color: '#dc2626', fontSize: 12, fontWeight: 700 }}>
                                  ⚠️ {s.rapportsEnRetard} en retard
                                </span>
                              ) : (
                                <span style={{ color: '#16a34a', fontSize: 12, fontWeight: 600 }}>À jour</span>
                              )}
                            </td>
                            <td style={{ padding: '15px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ flex: 1, height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                                  <div
                                    style={{
                                      width: `${s.pourcentageProgression}%`,
                                      height: '100%',
                                      background: s.pourcentageProgression >= 80 ? '#16a34a' : s.pourcentageProgression >= 50 ? BLUE : '#ea580c',
                                      borderRadius: 4,
                                    }}
                                  />
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 700, color: NAVY }}>{s.pourcentageProgression}%</span>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {/* ───────── MES NOTIFICATIONS ───────── */}
          {vue === 'notifications' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h1 style={titrePage}>Mes Notifications Pédagogiques</h1>
                  <p style={{ margin: '3px 0 0', fontSize: 16, color: '#2f55b0' }}>
                    Alertes de retard de rapports, dépôts de journaux et validations
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
