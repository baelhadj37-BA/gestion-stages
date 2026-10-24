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

type Vue =
  | 'dashboard'
  | 'entreprise'
  | 'offres'
  | 'candidatures'
  | 'messages'
  | 'parametres'

interface Offre {
  id: number
  titre: string
  statut: string
  duree: string
  localisation: string | null
  tags: string | null
  createdAt: string
  nbCandidatures: number
}

interface Stats {
  offresPubliees: number
  offresEnAttente: number
  totalCandidatures: number
  candidaturesEnAttente: number
}

interface Notification {
  id: number
  message: string
  lu: boolean
  date: string
}

interface Candidature {
  id: number
  statut: string
  cvUrl: string
  lettreUrl: string | null
  score: number
  createdAt: string
  etudiant: { id: number; nom: string; prenom: string; email: string; telephone: string | null; classe: string | null; filiere: string | null }
  offre: { id: number; titre: string; duree: string }
}

/* ─── Mise à l'échelle ─── */
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
  doc: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h6" />
    </>
  ),
  building: (
    <path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h2a2 2 0 0 1 2 2v10M2 21h20M8 7h4M8 11h4M8 15h4" />
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
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowUpRight: <path d="M7 17L17 7M8 7h9v9" />,
  plus: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  chevronDown: <path d="M6 9l6 6 6-6" />,
  logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
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
  message: (
    <>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
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
  { id: 'dashboard',    label: 'Tableau de bord',      icon: 'grid'      },
  { id: 'entreprise',   label: 'Mon entreprise',        icon: 'building'  },
  { id: 'offres',       label: 'Mes offres de stage',   icon: 'briefcase' },
  { id: 'candidatures', label: 'Mes candidatures',      icon: 'doc'       },
  { id: 'messages',     label: 'Messages',              icon: 'message'   },
  { id: 'parametres',   label: 'Paramètres',            icon: 'gear'      },
]

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

function statutBadge(statut: string): { label: string; fond: string; texte: string } {
  if (statut === 'PUBLIEE')    return { label: 'Publiée',    fond: '#d9f5e3', texte: '#15803d' }
  if (statut === 'EN_ATTENTE') return { label: 'En attente', fond: '#fef3c7', texte: '#d97706' }
  if (statut === 'FERMEE')     return { label: 'Fermée',     fond: '#fde2e2', texte: '#b91c1c' }
  return { label: statut, fond: '#f1f5f9', texte: '#64748b' }
}

/* ───────── Page ───────── */
export default function EntrepriseDashboard() {
  const router = useRouter()

  const [entreprise, setEntreprise] = useState<{ nom: string; prenom: string } | null>(null)
  const [vue, setVue] = useState<Vue>('dashboard')
  const [stats, setStats] = useState<Stats | null>(null)
  const [offres, setOffres] = useState<Offre[]>([])
  const [menuOuvert, setMenuOuvert] = useState(false)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  // Profil entreprise
  const [profil, setProfil] = useState<{
    nom: string; prenom: string; email: string;
    telephone: string; secteur: string; competences: string;
  } | null>(null)
  const [profilEdit, setProfilEdit] = useState(false)
  const [profilForm, setProfilForm] = useState({ nom: '', prenom: '', email: '', telephone: '', secteur: '', competences: '' })
  const [profilSaving, setProfilSaving] = useState(false)
  const [profilMsg, setProfilMsg] = useState('')

  // Offres (section complète)
  const [toutesOffres, setToutesOffres] = useState<Offre[]>([])
  const [offresChargement, setOffresChargement] = useState(false)
  const [offresErreur, setOffresErreur] = useState('')
  const [modalOffre, setModalOffre] = useState(false)
  const [offreForm, setOffreForm] = useState({
    titre: '', duree: '', localisation: '', description: '', tags: '',
  })
  const [offreEnvoi, setOffreEnvoi] = useState(false)
  const [offreMsg, setOffreMsg] = useState('')

  // Notifications (section Messages)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notifChargement, setNotifChargement] = useState(false)
  const [notifErreur, setNotifErreur] = useState('')
  const [notifNonLues, setNotifNonLues] = useState(0)
  const [marquageEnCours, setMarquageEnCours] = useState(false)

  // Candidatures
  const [candidatures, setCandidatures] = useState<Candidature[]>([])
  const [candidaturesChargement, setCandidaturesChargement] = useState(false)
  const [candidaturesErreur, setCandidaturesErreur] = useState('')
  const [filtreStatut, setFiltreStatut] = useState<string>('TOUS')
  const [candidatureSelectee, setCandidatureSelectee] = useState<Candidature | null>(null)
  const [actionEnCours, setActionEnCours] = useState<number | null>(null)

  // ── Paramètres ──
  const [mdpForm, setMdpForm] = useState({ ancien: '', nouveau: '', confirmation: '' })
  const [mdpEnvoi, setMdpEnvoi] = useState(false)
  const [mdpMsg, setMdpMsg] = useState<{ type: 'ok' | 'err'; texte: string } | null>(null)
  const [suppressionMdp, setSuppressionMdp] = useState('')
  const [suppressionEnvoi, setSuppressionEnvoi] = useState(false)
  const [suppressionMsg, setSuppressionMsg] = useState<{ type: 'ok' | 'err'; texte: string } | null>(null)
  const [confirmSuppressionOuverte, setConfirmSuppressionOuverte] = useState(false)

  const largeur = useSyncExternalStore(abonnerRedimension, lireLargeur, largeurServeur)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const brut  = localStorage.getItem('user')

    if (!token || !brut) { router.push('/login'); return }

    let utilisateur: { nom: string; prenom: string; role: string }
    try { utilisateur = JSON.parse(brut) }
    catch { router.push('/login'); return }

    if (utilisateur.role !== 'ENTREPRISE') { router.push('/login'); return }

    const sessionExpiree = () => {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/login')
    }

    const charger = async () => {
      setTimeout(() => setEntreprise(utilisateur), 0)
      try {
        const [resStats, resProfil, resNotif] = await Promise.all([
          fetch('/api/entreprise/stats',         { headers: { authorization: `Bearer ${token}` } }),
          fetch('/api/entreprise/profil',        { headers: { authorization: `Bearer ${token}` } }),
          fetch('/api/entreprise/notifications', { headers: { authorization: `Bearer ${token}` } }),
        ])
        if (resStats.status === 401 || resStats.status === 403) { sessionExpiree(); return }
        if (!resStats.ok) { setErreur(`Impossible de charger le tableau de bord (erreur ${resStats.status})`); return }
        const dataStats = await resStats.json()
        setStats(dataStats.stats)
        setOffres(dataStats.offresRecentes)
        if (resProfil.ok) {
          const dataProfil = await resProfil.json()
          setProfil(dataProfil.profil)
          setProfilForm({
            nom:         dataProfil.profil.nom         ?? '',
            prenom:      dataProfil.profil.prenom       ?? '',
            email:       dataProfil.profil.email        ?? '',
            telephone:   dataProfil.profil.telephone    ?? '',
            secteur:     dataProfil.profil.secteur      ?? '',
            competences: dataProfil.profil.competences  ?? '',
          })
        }
        if (resNotif.ok) {
          const dataNotif = await resNotif.json()
          setNotifNonLues(dataNotif.nonLues)
        }
        setErreur('')
      } catch {
        setErreur('Impossible de contacter le serveur.')
      } finally {
        setChargement(false)
      }
    }

    charger()
  }, [router])

  const sauvegarderProfil = async () => {
    const token = localStorage.getItem('token')
    setProfilSaving(true)
    setProfilMsg('')
    try {
      const res = await fetch('/api/entreprise/profil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify(profilForm),
      })
      const data = await res.json()
      if (!res.ok) { setProfilMsg(data.message ?? 'Erreur lors de la sauvegarde'); return }
      setProfil(data.profil)
      setEntreprise({ nom: data.profil.nom, prenom: data.profil.prenom })
      setProfilEdit(false)
      setProfilMsg('Profil mis à jour avec succès ✓')
    } catch {
      setProfilMsg('Impossible de contacter le serveur.')
    } finally {
      setProfilSaving(false)
    }
  }

  const chargerOffres = async () => {
    const token = localStorage.getItem('token')
    setOffresChargement(true)
    setOffresErreur('')
    try {
      const res = await fetch('/api/entreprise/offres', {
        headers: { authorization: `Bearer ${token}` },
      })
      if (!res.ok) { setOffresErreur('Impossible de charger les offres'); return }
      const data = await res.json()
      setToutesOffres(data.offres)
    } catch {
      setOffresErreur('Impossible de contacter le serveur.')
    } finally {
      setOffresChargement(false)
    }
  }

  const creerOffre = async () => {
    const token = localStorage.getItem('token')
    if (!offreForm.titre || !offreForm.duree) { setOffreMsg('Titre et durée sont obligatoires'); return }
    setOffreEnvoi(true)
    setOffreMsg('')
    try {
      const res = await fetch('/api/entreprise/offres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify(offreForm),
      })
      const data = await res.json()
      if (!res.ok) { setOffreMsg(data.message ?? 'Erreur lors de la création'); return }
      setToutesOffres(prev => [data.offre, ...prev])
      setOffres(prev => [data.offre, ...prev].slice(0, 5))
      setStats(prev => prev ? { ...prev, offresEnAttente: prev.offresEnAttente + 1 } : prev)
      setOffreForm({ titre: '', duree: '', localisation: '', description: '', tags: '' })
      setModalOffre(false)
      setOffreMsg('')
    } catch {
      setOffreMsg('Impossible de contacter le serveur.')
    } finally {
      setOffreEnvoi(false)
    }
  }

  const chargerNotifications = async () => {
    const token = localStorage.getItem('token')
    setNotifChargement(true)
    setNotifErreur('')
    try {
      const res = await fetch('/api/entreprise/notifications', {
        headers: { authorization: `Bearer ${token}` },
      })
      if (!res.ok) { setNotifErreur('Impossible de charger les notifications'); return }
      const data = await res.json()
      setNotifications(data.notifications)
      setNotifNonLues(data.nonLues)
    } catch {
      setNotifErreur('Impossible de contacter le serveur.')
    } finally {
      setNotifChargement(false)
    }
  }

  const toutMarquerLu = async () => {
    const token = localStorage.getItem('token')
    setMarquageEnCours(true)
    try {
      await fetch('/api/entreprise/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      })
      setNotifications(prev => prev.map(n => ({ ...n, lu: true })))
      setNotifNonLues(0)
    } finally {
      setMarquageEnCours(false)
    }
  }

  const marquerUneNotifLue = async (id: number) => {
    const token = localStorage.getItem('token')
    try {
      await fetch('/api/entreprise/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ id }),
      })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n))
      setNotifNonLues(prev => Math.max(0, prev - 1))
    } catch { /* silencieux */ }
  }

  const chargerCandidatures = async () => {
    const token = localStorage.getItem('token')
    setCandidaturesChargement(true)
    setCandidaturesErreur('')
    try {
      const res = await fetch('/api/candidatures', {
        headers: { authorization: `Bearer ${token}` },
      })
      if (!res.ok) { setCandidaturesErreur('Impossible de charger les candidatures'); return }
      const data = await res.json()
      setCandidatures(data.candidatures)
    } catch {
      setCandidaturesErreur('Impossible de contacter le serveur.')
    } finally {
      setCandidaturesChargement(false)
    }
  }

  const changerStatutCandidature = async (candidatureId: number, statut: string) => {
    const token = localStorage.getItem('token')
    setActionEnCours(candidatureId)
    try {
      const res = await fetch('/api/candidatures', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: candidatureId, statut }),
      })
      if (!res.ok) return
      setCandidatures(prev => prev.map(c => c.id === candidatureId ? { ...c, statut } : c))
      if (candidatureSelectee?.id === candidatureId) {
        setCandidatureSelectee(prev => prev ? { ...prev, statut } : null)
      }
    } finally {
      setActionEnCours(null)
    }
  }

  const changerMotDePasse = async () => {
    if (!mdpForm.nouveau || !mdpForm.ancien) {
      setMdpMsg({ type: 'err', texte: 'Veuillez remplir tous les champs.' })
      return
    }
    if (mdpForm.nouveau !== mdpForm.confirmation) {
      setMdpMsg({ type: 'err', texte: 'Les deux nouveaux mots de passe ne correspondent pas.' })
      return
    }
    if (mdpForm.nouveau.length < 8) {
      setMdpMsg({ type: 'err', texte: 'Le nouveau mot de passe doit faire au moins 8 caractères.' })
      return
    }
    const token = localStorage.getItem('token')
    setMdpEnvoi(true)
    setMdpMsg(null)
    try {
      const res = await fetch('/api/entreprise/parametres', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ ancienMotDePasse: mdpForm.ancien, nouveauMotDePasse: mdpForm.nouveau }),
      })
      const data = await res.json()
      if (res.ok) {
        setMdpMsg({ type: 'ok', texte: data.message || 'Mot de passe mis à jour avec succès.' })
        setMdpForm({ ancien: '', nouveau: '', confirmation: '' })
      } else {
        setMdpMsg({ type: 'err', texte: data.message || 'Erreur lors du changement.' })
      }
    } catch {
      setMdpMsg({ type: 'err', texte: 'Impossible de contacter le serveur.' })
    } finally {
      setMdpEnvoi(false)
    }
  }

  const supprimerCompte = async () => {
    if (!suppressionMdp) {
      setSuppressionMsg({ type: 'err', texte: 'Veuillez saisir votre mot de passe.' })
      return
    }
    const token = localStorage.getItem('token')
    setSuppressionEnvoi(true)
    setSuppressionMsg(null)
    try {
      const res = await fetch('/api/entreprise/parametres', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ motDePasse: suppressionMdp }),
      })
      const data = await res.json()
      if (res.ok) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        document.cookie = 'token=; path=/; max-age=0'
        router.push('/login')
      } else {
        setSuppressionMsg({ type: 'err', texte: data.message || 'Erreur lors de la suppression.' })
        setSuppressionEnvoi(false)
      }
    } catch {
      setSuppressionMsg({ type: 'err', texte: 'Impossible de contacter le serveur.' })
      setSuppressionEnvoi(false)
    }
  }

  const seDeconnecter = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    document.cookie = 'token=; path=/; max-age=0'
    router.push('/login')
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

  const bureau = largeur >= 1024
  const echelle = bureau ? Math.min(Math.max(largeur / LARGEUR_MAQUETTE, 0.6), 1.5) : 1
  const hauteurPage = `${100 / echelle}vh`

  const nomEntreprise = entreprise ? entreprise.nom.trim() : ''
  const initialesEnt = nomEntreprise.split(' ').filter(Boolean).slice(0, 2).map((m) => m[0]).join('').toUpperCase() || 'E'

  const cartes = stats ? [
    { label: 'Offres publiées',        valeur: stats.offresPubliees,       icon: 'briefcase' as IconName, fond: '#dbe8fd', couleur: BLUE,      vers: 'offres'        as Vue },
    { label: 'Offres en attente',      valeur: stats.offresEnAttente,      icon: 'clock'     as IconName, fond: '#fef3c7', couleur: '#d97706', vers: 'offres'        as Vue },
    { label: 'Total candidatures',     valeur: stats.totalCandidatures,    icon: 'users'     as IconName, fond: '#d9f5e3', couleur: '#16a34a', vers: 'candidatures'  as Vue },
    { label: 'Candidatures en attente',valeur: stats.candidaturesEnAttente,icon: 'doc'       as IconName, fond: '#fde9d0', couleur: '#f59e0b', vers: 'candidatures'  as Vue },
  ] : []

  const th: CSSProperties = { padding: '13px 16px', fontWeight: 600, color: '#5f6d8a', fontSize: 12.5 }
  const titrePage: CSSProperties = { margin: 0, fontSize: 30, fontWeight: 800, color: NAVY, lineHeight: 1.2 }

  return (
    <div style={{ display: 'flex', minHeight: hauteurPage, background: '#f4f7fc', zoom: echelle }}>

      {/* ═══════════ SIDEBAR ═══════════ */}
      {bureau && (
        <aside style={{
          position: 'sticky', top: 0, alignSelf: 'flex-start',
          display: 'flex', flexDirection: 'column',
          width: 315, flexShrink: 0, height: hauteurPage, overflow: 'hidden',
          color: '#fff',
          background: 'linear-gradient(180deg, #0b3590 0%, #0a2c7e 60%, #0a3a9a 100%)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '19px 22px 0' }}>
            <div style={{ position: 'relative', width: 68, height: 68, flexShrink: 0, overflow: 'hidden', borderRadius: '50%', background: '#fff' }}>
              <Image src="/logo-ipd.png" alt="Logo IPD" fill sizes="68px" priority style={{ objectFit: 'contain' }} />
            </div>
            <div style={{ lineHeight: 1.3 }}>
              <p style={{ margin: 0, fontSize: 13.5, fontWeight: 800 }}>INSTITUT POLYTECHNIQUE<br />DE DAKAR</p>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: '#dbe7ff' }}>Plateforme de gestion des stages</p>
            </div>
          </div>

          <nav style={{ padding: '30px 14px 0' }}>
            {NAV.map((n) => {
              const actif = vue === n.id
              return (
                <button key={n.id} onClick={() => { setVue(n.id); if (n.id === 'candidatures') chargerCandidatures(); if (n.id === 'offres') chargerOffres(); if (n.id === 'messages') chargerNotifications() }}
                  className={actif ? '' : 'hover:bg-white/10'}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 24,
                    width: '100%', height: 46, padding: '0 17px', marginBottom: 10,
                    borderRadius: 8, border: 'none', textAlign: 'left', cursor: 'pointer',
                    color: '#fff', fontSize: 15.5, fontWeight: 500,
                    ...(actif ? { background: '#1565e8', boxShadow: '0 6px 16px rgba(0,0,0,0.25)' } : { background: 'transparent' }),
                  }}
                >
                  <Icon name={n.icon} size={26} />
                  {n.label}
                </button>
              )
            })}
          </nav>

          <div style={{ position: 'relative', marginTop: 'auto', height: 260, flexShrink: 0 }}>
            <svg viewBox="0 0 315 260" preserveAspectRatio="none" aria-hidden="true"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
              <path d="M0 120 C 90 100, 200 60, 315 0 L315 260 L0 260 Z" fill="rgba(21,101,232,0.38)" />
            </svg>
            <p style={{
              position: 'absolute', left: 60, top: 100, margin: 0,
              fontFamily: "'Segoe Script', 'Brush Script MT', cursive",
              fontSize: 20, lineHeight: '27px',
              transform: 'rotate(-12deg)', transformOrigin: 'left bottom',
            }}>
              Ensemble pour<br />l&apos;avenir de nos étudiants
            </p>
            <svg viewBox="0 0 200 40" aria-hidden="true" style={{ position: 'absolute', left: 88, top: 182, width: 165 }}>
              <path d="M5 35 Q80 5 195 12" stroke="white" fill="none" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </aside>
      )}

      {/* ═══════════ COLONNE PRINCIPALE ═══════════ */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>

        {/* Header */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 20,
          display: 'flex', alignItems: 'center', gap: 18,
          height: 84, padding: '0 24px',
          background: '#fff', borderBottom: '1px solid #eef2fa',
        }}>
          <label style={{
            display: 'flex', alignItems: 'center', gap: 14,
            flex: 1, maxWidth: 659, height: 44, padding: '0 18px',
            borderRadius: 10, background: '#f1f5fb', color: '#7b88a3',
          }}>
            <Icon name="search" size={21} />
            <input
              placeholder="Rechercher une offre, une candidature..."
              className="w-full bg-transparent outline-none"
              style={{ fontSize: 15, color: '#2d3b5a' }}
            />
          </label>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 22 }}>
            <button aria-label="Notifications"
              onClick={() => { setVue('messages'); chargerNotifications() }}
              style={{ position: 'relative', color: NAVY, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }}>
              <Icon name="bell" size={27} />
              {notifNonLues > 0 && (
                <span style={{
                  position: 'absolute', top: -6, right: -7,
                  minWidth: 18, height: 18, padding: '0 4px', borderRadius: 9,
                  background: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {notifNonLues}
                </span>
              )}
            </button>

            <span style={{ width: 1, height: 48, background: '#e6ecf5' }} />

            <div style={{ position: 'relative' }}>
              <button onClick={() => setMenuOuvert((o) => !o)}
                style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <span style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 48, height: 48, borderRadius: '50%',
                  background: BLUE, color: '#fff', fontSize: 15, fontWeight: 700,
                }}>
                  {initialesEnt}
                </span>
                <span style={{ textAlign: 'left', lineHeight: 1.3 }}>
                  <span style={{ display: 'block', fontSize: 14.5, fontWeight: 700, color: NAVY }}>{nomEntreprise}</span>
                  <span style={{ display: 'block', fontSize: 13, color: MUTED }}>Entreprise</span>
                </span>
                <span style={{ color: MUTED, display: 'flex' }}><Icon name="chevronDown" size={18} /></span>
              </button>

              {menuOuvert && (
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 10px)',
                  width: 190, padding: 8, borderRadius: 12,
                  background: '#fff', border: '1px solid #eef2fa',
                  boxShadow: '0 10px 30px rgba(30,70,150,0.15)',
                }}>
                  <button onClick={seDeconnecter} className="hover:bg-red-50"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      width: '100%', padding: '10px 12px', borderRadius: 8,
                      border: 'none', background: 'transparent',
                      color: '#dc2626', fontSize: 14, fontWeight: 500, cursor: 'pointer',
                    }}>
                    <Icon name="logout" size={18} />
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Nav mobile */}
        {!bureau && (
          <nav className="flex gap-2 overflow-x-auto bg-white px-4 py-2">
            {NAV.map((n) => (
              <button key={n.id} onClick={() => { setVue(n.id); if (n.id === 'candidatures') chargerCandidatures(); if (n.id === 'offres') chargerOffres(); if (n.id === 'messages') chargerNotifications() }}
                className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium"
                style={vue === n.id ? { background: BLUE, color: '#fff' } : { color: NAVY, background: '#f1f5fb' }}>
                {n.label}
              </button>
            ))}
          </nav>
        )}

        <main style={{ flex: 1, padding: bureau ? '24px 24px 40px' : '20px 16px 32px' }}>
          {erreur && (
            <div role="alert" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
              marginBottom: 20, padding: '12px 20px', borderRadius: 10,
              background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 14,
            }}>
              <span>{erreur}</span>
              <button onClick={() => window.location.reload()}
                style={{ fontWeight: 600, textDecoration: 'underline', background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', flexShrink: 0 }}>
                Réessayer
              </button>
            </div>
          )}

          {/* ─── DASHBOARD ─── */}
          {vue === 'dashboard' && (
            <>
              {/* En-tête */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '0 0 0 11px', marginBottom: 30 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <svg viewBox="0 0 24 24" width="38" height="38" aria-hidden="true">
                    <rect x="2" y="2" width="9.5" height="9.5" rx="2.5" fill={BLUE} />
                    <rect x="12.5" y="2" width="9.5" height="9.5" rx="2.5" fill={BLUE} />
                    <rect x="2" y="12.5" width="9.5" height="9.5" rx="2.5" fill={BLUE} />
                    <rect x="12.5" y="12.5" width="9.5" height="9.5" rx="2.5" fill={BLUE} />
                  </svg>
                  <div>
                    <h1 style={titrePage}>Bonjour, {nomEntreprise || '…'} 👋</h1>
                    <p style={{ margin: '3px 0 0', fontSize: 16, color: '#2f55b0' }}>Bienvenue sur votre espace entreprise</p>
                  </div>
                </div>
                <button onClick={() => setVue('offres')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    height: 44, padding: '0 22px', borderRadius: 10,
                    border: 'none', background: BLUE, color: '#fff',
                    fontSize: 14.5, fontWeight: 600, cursor: 'pointer',
                  }}>
                  <Icon name="plus" size={20} />
                  Publier une offre
                </button>
              </div>

              {/* Cartes stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: bureau ? 'repeat(4, 1fr)' : 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 19, marginBottom: 24,
              }}>
                {cartes.map((c) => (
                  <button key={c.label} onClick={() => setVue(c.vers)}
                    className="transition-shadow hover:shadow-md"
                    style={{
                      ...CARTE,
                      display: 'flex', alignItems: 'center', gap: 20,
                      minHeight: 130, padding: '0 22px 0 20px',
                      textAlign: 'left', cursor: 'pointer',
                    }}>
                    <span style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: 58, height: 58, flexShrink: 0, borderRadius: '50%',
                      background: c.fond, color: c.couleur,
                    }}>
                      <Icon name={c.icon} size={28} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#2d3b5a' }}>{c.label}</span>
                      <span style={{ display: 'block', fontSize: 32, fontWeight: 800, lineHeight: 1.25, color: NAVY }}>{c.valeur}</span>
                    </span>
                    <span style={{ color: BLUE, display: 'flex' }}><Icon name="arrowRight" size={17} /></span>
                  </button>
                ))}
              </div>

              {/* Tableau offres + Actions rapides */}
              <div style={{ display: 'grid', gridTemplateColumns: bureau ? '2fr 1fr' : '1fr', gap: 19 }}>

                {/* Offres récentes */}
                <section style={{ ...CARTE, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 22px 16px' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: 14, margin: 0, fontSize: 17, fontWeight: 700, color: NAVY }}>
                      <span style={{ color: BLUE, display: 'flex' }}><Icon name="briefcase" size={26} /></span>
                      Mes offres récentes
                    </h2>
                    <button onClick={() => setVue('offres')}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', color: BLUE, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                      Voir toutes <Icon name="arrowRight" size={16} />
                    </button>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', minWidth: 480, borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
                      <thead style={{ background: '#f4f7fc' }}>
                        <tr>
                          {['Titre', 'Statut', 'Durée', 'Candidatures', 'Publiée le'].map((h) => (
                            <th key={h} style={th}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {offres.length === 0 && (
                          <tr>
                            <td colSpan={5} style={{ padding: '40px 16px', textAlign: 'center', color: MUTED, fontSize: 14 }}>
                              Aucune offre publiée pour le moment
                            </td>
                          </tr>
                        )}
                        {offres.map((o) => {
                          const b = statutBadge(o.statut)
                          return (
                            <tr key={o.id} style={{ borderTop: '1px solid #eef2fa' }}>
                              <td style={{ padding: '14px 16px', fontWeight: 600, color: NAVY, maxWidth: 200 }}>
                                <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                  {o.titre}
                                </span>
                              </td>
                              <td style={{ padding: '14px 16px' }}>
                                <span style={{
                                  display: 'inline-block', padding: '4px 12px', borderRadius: 999,
                                  background: b.fond, color: b.texte, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
                                }}>
                                  {b.label}
                                </span>
                              </td>
                              <td style={{ padding: '14px 16px', color: MUTED, whiteSpace: 'nowrap' }}>{o.duree} sem.</td>
                              <td style={{ padding: '14px 16px', color: NAVY, fontWeight: 700, textAlign: 'center' }}>{o.nbCandidatures}</td>
                              <td style={{ padding: '14px 16px', color: MUTED, whiteSpace: 'nowrap' }}>{formatDate(o.createdAt)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Panneau droit */}
                <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Actions rapides */}
                  <div style={{ ...CARTE, padding: '22px 22px 16px' }}>
                    <h2 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 700, color: NAVY }}>Actions rapides</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[
                        { label: 'Publier une nouvelle offre', icon: 'plus'     as IconName, fond: '#dbe8fd', couleur: BLUE,      vers: 'offres'       as Vue },
                        { label: 'Voir les candidatures',      icon: 'users'    as IconName, fond: '#d9f5e3', couleur: '#16a34a', vers: 'candidatures' as Vue },
                        { label: 'Mettre à jour le profil',   icon: 'building' as IconName, fond: '#eadffc', couleur: '#7c3aed', vers: 'entreprise'   as Vue },
                      ].map((a) => (
                        <button key={a.label} onClick={() => setVue(a.vers)}
                          className="hover:shadow-sm"
                          style={{
                            display: 'flex', alignItems: 'center', gap: 16,
                            padding: '14px 16px', borderRadius: 10,
                            border: '1px solid #eef2fa', background: '#fafbff',
                            cursor: 'pointer', textAlign: 'left',
                          }}>
                          <span style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 40, height: 40, flexShrink: 0, borderRadius: '50%',
                            background: a.fond, color: a.couleur,
                          }}>
                            <Icon name={a.icon} size={20} />
                          </span>
                          <span style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{a.label}</span>
                          <span style={{ marginLeft: 'auto', color: BLUE, display: 'flex' }}><Icon name="arrowRight" size={16} /></span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Résumé activité */}
                  {stats && (
                    <div style={{
                      ...CARTE, padding: '20px 22px',
                      background: 'linear-gradient(135deg, #0b3590 0%, #1565e8 100%)',
                      border: 'none', color: '#fff',
                    }}>
                      <p style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, opacity: 0.8 }}>Résumé de l&apos;activité</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[
                          { label: 'Offres actives',           valeur: stats.offresPubliees      },
                          { label: 'En cours de validation',   valeur: stats.offresEnAttente     },
                          { label: 'Candidatures reçues',      valeur: stats.totalCandidatures   },
                        ].map((item) => (
                          <div key={item.label} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.15)',
                          }}>
                            <span style={{ fontSize: 13.5, opacity: 0.85 }}>{item.label}</span>
                            <span style={{ fontSize: 20, fontWeight: 800 }}>{item.valeur}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              </div>
            </>
          )}

          {/* ─── MES OFFRES ─── */}
          {vue === 'offres' && (
            <>
              {/* Modal création offre */}
              {modalOffre && (
                <div style={{
                  position: 'fixed', inset: 0, zIndex: 100,
                  background: 'rgba(11,47,122,0.45)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', padding: 20,
                }} onClick={() => setModalOffre(false)}>
                  <div style={{
                    ...CARTE, width: '100%', maxWidth: 620, maxHeight: '90vh',
                    overflowY: 'auto', padding: '30px 32px',
                  }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: NAVY }}>Nouvelle offre de stage</h2>
                      <button onClick={() => setModalOffre(false)} style={{ background: 'none', border: 'none', fontSize: 22, color: MUTED, cursor: 'pointer', lineHeight: 1 }}>✕</button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {([
                        { key: 'titre',       label: 'Titre du stage *',   placeholder: 'Ex: Stage développeur web', type: 'text' },
                        { key: 'duree',       label: 'Durée *',            placeholder: 'Ex: 3 mois, 12 semaines',   type: 'text' },
                        { key: 'localisation',label: 'Localisation',       placeholder: 'Ex: Dakar, Sénégal',        type: 'text' },
                        { key: 'tags',        label: 'Tags / mots-clés',   placeholder: 'Ex: React, Node.js, MySQL', type: 'text' },
                      ] as { key: keyof typeof offreForm; label: string; placeholder: string; type: string }[]).map(({ key, label, placeholder }) => (
                        <div key={key}>
                          <label style={{ fontSize: 12, fontWeight: 600, color: MUTED, display: 'block', marginBottom: 4 }}>{label}</label>
                          <input
                            type="text"
                            value={offreForm[key]}
                            onChange={e => setOffreForm(f => ({ ...f, [key]: e.target.value }))}
                            placeholder={placeholder}
                            style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d9f0', borderRadius: 8, fontSize: 13.5, color: NAVY, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }}
                          />
                        </div>
                      ))}
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: MUTED, display: 'block', marginBottom: 4 }}>Description du stage</label>
                        <textarea
                          value={offreForm.description}
                          onChange={e => setOffreForm(f => ({ ...f, description: e.target.value }))}
                          placeholder="Décrivez les missions, objectifs et conditions du stage…"
                          rows={4}
                          style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d9f0', borderRadius: 8, fontSize: 13.5, color: NAVY, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', outline: 'none' }}
                        />
                      </div>
                    </div>

                    {offreMsg && (
                      <p style={{ margin: '12px 0 0', fontSize: 13, color: offreMsg.includes('obligatoire') ? '#b91c1c' : '#15803d', fontWeight: 500 }}>{offreMsg}</p>
                    )}

                    <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
                      <button onClick={() => setModalOffre(false)} style={{
                        padding: '11px 22px', background: '#fff', color: NAVY,
                        border: '1px solid #d1d9f0', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer',
                      }}>Annuler</button>
                      <button onClick={creerOffre} disabled={offreEnvoi} style={{
                        padding: '11px 26px', background: BLUE, color: '#fff',
                        border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 14,
                        cursor: offreEnvoi ? 'not-allowed' : 'pointer', opacity: offreEnvoi ? 0.7 : 1,
                      }}>
                        {offreEnvoi ? 'Création…' : 'Créer l\'offre'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                  <h1 style={titrePage}>Mes offres de stage</h1>
                  <p style={{ margin: '4px 0 0', fontSize: 16, color: '#2f55b0' }}>{toutesOffres.length} offre(s)</p>
                </div>
                <button onClick={() => { setModalOffre(true); setOffreMsg('') }} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  height: 44, padding: '0 22px', borderRadius: 10,
                  border: 'none', background: BLUE, color: '#fff',
                  fontSize: 14.5, fontWeight: 600, cursor: 'pointer',
                }}>
                  <Icon name="plus" size={20} />
                  Nouvelle offre
                </button>
              </div>
              <section style={{ ...CARTE, overflow: 'hidden' }}>
                {offresChargement ? (
                  <div style={{ padding: 48, textAlign: 'center', color: MUTED }}>Chargement…</div>
                ) : offresErreur ? (
                  <div style={{ padding: 32, textAlign: 'center', color: '#b91c1c' }}>{offresErreur}</div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', minWidth: 600, borderCollapse: 'collapse', textAlign: 'left', fontSize: 13.5 }}>
                      <thead style={{ background: '#f4f7fc' }}>
                        <tr>
                          {['Titre', 'Statut', 'Durée', 'Localisation', 'Candidatures', 'Publiée le'].map((h) => (
                            <th key={h} style={th}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {toutesOffres.length === 0 && (
                          <tr>
                            <td colSpan={6} style={{ padding: '40px 16px', textAlign: 'center', color: MUTED }}>Aucune offre pour le moment</td>
                          </tr>
                        )}
                        {toutesOffres.map((o) => {
                          const b = statutBadge(o.statut)
                          return (
                            <tr key={o.id} style={{ borderTop: '1px solid #eef2fa' }}>
                              <td style={{ padding: '14px 16px', fontWeight: 600, color: NAVY }}>{o.titre}</td>
                              <td style={{ padding: '14px 16px' }}>
                                <span style={{ display: 'inline-block', padding: '5px 14px', borderRadius: 999, background: b.fond, color: b.texte, fontSize: 12, fontWeight: 600 }}>
                                  {b.label}
                                </span>
                              </td>
                              <td style={{ padding: '14px 16px', color: MUTED }}>{o.duree} sem.</td>
                              <td style={{ padding: '14px 16px', color: MUTED }}>{o.localisation ?? '—'}</td>
                              <td style={{ padding: '14px 16px', color: NAVY, fontWeight: 700, textAlign: 'center' }}>{o.nbCandidatures}</td>
                              <td style={{ padding: '14px 16px', color: MUTED, whiteSpace: 'nowrap' }}>{formatDate(o.createdAt)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}

          {/* ─── MON ENTREPRISE ─── */}
          {vue === 'entreprise' && (
            <>
              {/* Bannière */}
              <section style={{
                ...CARTE, padding: '28px 32px', marginBottom: 24,
                background: 'linear-gradient(120deg,#e8f0fe 0%,#dbeafe 100%)',
                display: 'flex', alignItems: 'center', gap: 20, position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 16, background: BLUE,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon name="building" size={32} sw={1.5} />
                </div>
                <div style={{ flex: 1 }}>
                  <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: NAVY }}>Mon entreprise</h1>
                  <p style={{ margin: '4px 0 0', color: MUTED, fontSize: 14 }}>Consultez et gérez les informations de votre entreprise.</p>
                </div>
                <svg viewBox="0 0 200 120" width={180} aria-hidden="true" style={{ position: 'absolute', right: 20, opacity: 0.18 }}>
                  <rect x="30" y="20" width="60" height="90" rx="4" fill={NAVY} />
                  <rect x="100" y="40" width="70" height="70" rx="4" fill={BLUE} />
                  <rect x="45" y="35" width="12" height="14" rx="2" fill="#fff" />
                  <rect x="65" y="35" width="12" height="14" rx="2" fill="#fff" />
                  <rect x="45" y="58" width="12" height="14" rx="2" fill="#fff" />
                  <rect x="65" y="58" width="12" height="14" rx="2" fill="#fff" />
                  <rect x="115" y="55" width="12" height="14" rx="2" fill="#fff" />
                  <rect x="137" y="55" width="12" height="14" rx="2" fill="#fff" />
                </svg>
              </section>

              {/* Carte identité entreprise */}
              <section style={{ ...CARTE, padding: '20px 28px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                <div style={{
                  width: 72, height: 72, borderRadius: 14, background: '#e8f0fe',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon name="building" size={36} sw={1.4} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: NAVY }}>{entreprise?.nom ?? '—'}</span>
                    <span style={{
                      fontSize: 12, fontWeight: 600, color: '#15803d',
                      background: '#d9f5e3', borderRadius: 20, padding: '3px 10px',
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>✓ Profil vérifié</span>
                  </div>
                  <p style={{ margin: '4px 0 0', color: MUTED, fontSize: 13 }}>Entreprise · Dakar, Sénégal</p>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button onClick={() => { setProfilEdit(!profilEdit); setProfilMsg('') }} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
                    background: profilEdit ? '#f1f5fb' : BLUE, color: profilEdit ? NAVY : '#fff',
                    border: profilEdit ? `1px solid #d1d9f0` : 'none', borderRadius: 10,
                    fontWeight: 600, fontSize: 14, cursor: 'pointer',
                  }}>
                    <Icon name="gear" size={16} /> {profilEdit ? 'Annuler' : 'Modifier les informations'}
                  </button>
                </div>
              </section>

              {/* Grille principale */}
              <div style={{ display: 'grid', gridTemplateColumns: bureau ? '1fr 1fr 1fr' : '1fr', gap: 20 }}>

                {/* Informations générales */}
                <section style={{ ...CARTE, padding: '22px 24px' }}>
                  <h2 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 700, color: NAVY, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon name="building" size={18} /> Informations générales
                  </h2>
                  {profilEdit ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {([
                        { key: 'nom',         label: "Nom de l'entreprise" },
                        { key: 'prenom',      label: 'Prénom / Contact'    },
                        { key: 'email',       label: 'Email professionnel' },
                        { key: 'telephone',   label: 'Téléphone'           },
                        { key: 'secteur',     label: "Secteur d'activité"  },
                        { key: 'competences', label: 'Description / Compétences' },
                      ] as { key: keyof typeof profilForm; label: string }[]).map(({ key, label }) => (
                        <div key={key}>
                          <label style={{ fontSize: 12, color: MUTED, display: 'block', marginBottom: 4 }}>{label}</label>
                          {key === 'competences' ? (
                            <textarea
                              value={profilForm[key]}
                              onChange={e => setProfilForm(f => ({ ...f, [key]: e.target.value }))}
                              rows={3}
                              style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d9f0', borderRadius: 8, fontSize: 13, color: NAVY, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                            />
                          ) : (
                            <input
                              type={key === 'email' ? 'email' : 'text'}
                              value={profilForm[key]}
                              onChange={e => setProfilForm(f => ({ ...f, [key]: e.target.value }))}
                              style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d9f0', borderRadius: 8, fontSize: 13, color: NAVY, fontFamily: 'inherit', boxSizing: 'border-box' }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    [
                      { label: "Nom de l'entreprise", valeur: profil?.nom        ?? '—' },
                      { label: "Secteur d'activité",  valeur: profil?.secteur    ?? '—' },
                      { label: 'Email professionnel', valeur: profil?.email      ?? '—' },
                      { label: 'Téléphone',           valeur: profil?.telephone  ?? '—' },
                      { label: 'Description',         valeur: profil?.competences ?? '—' },
                    ].map(({ label, valeur }) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, padding: '9px 0', borderBottom: '1px solid #f1f5fb' }}>
                        <span style={{ fontSize: 13, color: MUTED, flexShrink: 0 }}>{label}</span>
                        <span style={{ fontSize: 13, color: NAVY, fontWeight: 500, textAlign: 'right', maxWidth: '55%' }}>{valeur}</span>
                      </div>
                    ))
                  )}
                </section>

                {/* Présentation + Personne de contact */}
                <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ ...CARTE, padding: '22px 24px', flex: 1 }}>
                    <h2 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: NAVY, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icon name="doc" size={18} /> Présentation de l&apos;entreprise
                    </h2>
                    <p style={{ margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.7 }}>
                      Renseignez ici la description de votre entreprise : activités, valeurs, secteur d&apos;intervention…
                    </p>
                  </div>
                  <div style={{ ...CARTE, padding: '22px 24px' }}>
                    <h2 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: NAVY, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icon name="users" size={18} /> Personne de contact
                    </h2>
                    {[
                      { label: 'Responsable RH', valeur: '—' },
                      { label: 'Fonction',        valeur: '—' },
                      { label: 'Email',           valeur: '—' },
                      { label: 'Téléphone',       valeur: '—' },
                    ].map(({ label, valeur }) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '7px 0', borderBottom: '1px solid #f1f5fb' }}>
                        <span style={{ fontSize: 13, color: MUTED }}>{label}</span>
                        <span style={{ fontSize: 13, color: NAVY, fontWeight: 500 }}>{valeur}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Documents + Statistiques */}
                <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ ...CARTE, padding: '22px 24px' }}>
                    <h2 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: NAVY, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icon name="doc" size={18} /> Documents de l&apos;entreprise
                    </h2>
                    {[
                      { nom: 'Registre de commerce', desc: 'Document officiel de l\'entreprise' },
                      { nom: 'Document d\'identification', desc: 'Pièce d\'identité / NINEA' },
                    ].map(({ nom, desc }) => (
                      <div key={nom} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f1f5fb' }}>
                        <div style={{ width: 38, height: 38, borderRadius: 8, background: '#fde2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#b91c1c' }}>PDF</span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: NAVY }}>{nom}</p>
                          <p style={{ margin: '2px 0 0', fontSize: 11, color: MUTED }}>{desc}</p>
                        </div>
                        <button style={{ fontSize: 12, color: BLUE, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                          + Ajouter
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Statistiques */}
                  <div style={{ ...CARTE, padding: '22px 24px' }}>
                    <h2 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: NAVY, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icon name="grid" size={18} /> Statistiques de l&apos;entreprise
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                      {[
                        { label: 'Offres publiées',      valeur: stats?.offresPubliees ?? 0,        fond: '#e8f0fe', couleur: BLUE      },
                        { label: 'Candidatures reçues',  valeur: stats?.totalCandidatures ?? 0,     fond: '#d9f5e3', couleur: '#15803d' },
                        { label: 'Offres en attente',    valeur: stats?.offresEnAttente ?? 0,       fond: '#fef3c7', couleur: '#d97706' },
                      ].map(({ label, valeur, fond, couleur }) => (
                        <div key={label} style={{ background: fond, borderRadius: 10, padding: '12px 10px', textAlign: 'center' }}>
                          <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: couleur }}>{valeur}</p>
                          <p style={{ margin: '4px 0 0', fontSize: 11, color: MUTED }}>{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </div>

              {/* Boutons bas + message */}
              {profilEdit && (
                <div style={{ marginTop: 24 }}>
                  {profilMsg && (
                    <p style={{ margin: '0 0 12px', fontSize: 13, color: profilMsg.includes('✓') ? '#15803d' : '#b91c1c', fontWeight: 500 }}>{profilMsg}</p>
                  )}
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                    <button onClick={sauvegarderProfil} disabled={profilSaving} style={{
                      padding: '12px 28px', background: BLUE, color: '#fff',
                      border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: profilSaving ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: 8, opacity: profilSaving ? 0.7 : 1,
                    }}>
                      <Icon name="doc" size={16} /> {profilSaving ? 'Enregistrement…' : 'Enregistrer les modifications'}
                    </button>
                    <button onClick={() => { setProfilEdit(false); setProfilMsg('') }} style={{
                      padding: '12px 28px', background: '#fff', color: NAVY,
                      border: '1px solid #d1d9f0', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer',
                    }}>
                      Annuler
                    </button>
                  </div>
                </div>
              )}
              {profilMsg && !profilEdit && (
                <p style={{ marginTop: 16, fontSize: 13, color: '#15803d', fontWeight: 500 }}>{profilMsg}</p>
              )}
            </>
          )}

          {/* ─── MES CANDIDATURES ─── */}
          {vue === 'candidatures' && (
            <>
              <h1 style={titrePage}>Mes candidatures</h1>

              {/* Filtres */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                {(['TOUS', 'EN_ATTENTE', 'ACCEPTEE', 'REFUSEE'] as const).map(f => (
                  <button key={f} onClick={() => setFiltreStatut(f)} style={{
                    padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    border: filtreStatut === f ? 'none' : '1px solid #d1d9f0',
                    background: filtreStatut === f ? BLUE : '#fff',
                    color: filtreStatut === f ? '#fff' : MUTED,
                  }}>
                    {f === 'TOUS' ? 'Toutes' : f === 'EN_ATTENTE' ? 'En attente' : f === 'ACCEPTEE' ? 'Acceptées' : 'Refusées'}
                    <span style={{ marginLeft: 6, fontSize: 11 }}>
                      ({f === 'TOUS' ? candidatures.length : candidatures.filter(c => c.statut === f).length})
                    </span>
                  </button>
                ))}
              </div>

              {/* Détail candidature sélectionnée */}
              {candidatureSelectee && (
                <section style={{ ...CARTE, padding: '24px 28px', marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: NAVY }}>
                        {candidatureSelectee.etudiant.prenom} {candidatureSelectee.etudiant.nom}
                      </h2>
                      <p style={{ margin: '4px 0 0', fontSize: 13, color: MUTED }}>
                        {candidatureSelectee.offre.titre} · {candidatureSelectee.offre.duree}
                      </p>
                    </div>
                    <button onClick={() => setCandidatureSelectee(null)} style={{
                      padding: '6px 14px', border: '1px solid #d1d9f0', borderRadius: 8,
                      background: '#fff', color: MUTED, fontSize: 13, cursor: 'pointer',
                    }}>✕ Fermer</button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: bureau ? '1fr 1fr' : '1fr', gap: 20 }}>
                    <div>
                      <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: NAVY }}>Informations étudiant</h3>
                      {[
                        { label: 'Email',    valeur: candidatureSelectee.etudiant.email },
                        { label: 'Téléphone', valeur: candidatureSelectee.etudiant.telephone ?? '—' },
                        { label: 'Classe',   valeur: candidatureSelectee.etudiant.classe   ?? '—' },
                        { label: 'Filière',  valeur: candidatureSelectee.etudiant.filiere  ?? '—' },
                        { label: 'Candidaté le', valeur: formatDate(candidatureSelectee.createdAt) },
                      ].map(({ label, valeur }) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f1f5fb', fontSize: 13 }}>
                          <span style={{ color: MUTED }}>{label}</span>
                          <span style={{ color: NAVY, fontWeight: 500 }}>{valeur}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: NAVY }}>Documents</h3>
                      <a href={candidatureSelectee.cvUrl} target="_blank" rel="noreferrer" style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                        background: '#f4f7fc', borderRadius: 10, textDecoration: 'none', marginBottom: 10,
                      }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#b91c1c', background: '#fde2e2', padding: '4px 7px', borderRadius: 6 }}>PDF</span>
                        <span style={{ fontSize: 13, color: NAVY, fontWeight: 500 }}>CV de l&apos;étudiant</span>
                      </a>
                      {candidatureSelectee.lettreUrl && (
                        <a href={candidatureSelectee.lettreUrl} target="_blank" rel="noreferrer" style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                          background: '#f4f7fc', borderRadius: 10, textDecoration: 'none',
                        }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#b91c1c', background: '#fde2e2', padding: '4px 7px', borderRadius: 6 }}>PDF</span>
                          <span style={{ fontSize: 13, color: NAVY, fontWeight: 500 }}>Lettre de motivation</span>
                        </a>
                      )}

                      {/* Actions */}
                      {candidatureSelectee.statut === 'EN_ATTENTE' && (
                        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                          <button onClick={() => changerStatutCandidature(candidatureSelectee.id, 'ACCEPTEE')}
                            disabled={actionEnCours === candidatureSelectee.id}
                            style={{ flex: 1, padding: '11px 0', background: '#15803d', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                            ✓ Accepter
                          </button>
                          <button onClick={() => changerStatutCandidature(candidatureSelectee.id, 'REFUSEE')}
                            disabled={actionEnCours === candidatureSelectee.id}
                            style={{ flex: 1, padding: '11px 0', background: '#fde2e2', color: '#b91c1c', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                            ✕ Refuser
                          </button>
                        </div>
                      )}
                      {candidatureSelectee.statut !== 'EN_ATTENTE' && (
                        <div style={{ marginTop: 16, padding: '10px 16px', borderRadius: 10,
                          background: candidatureSelectee.statut === 'ACCEPTEE' ? '#d9f5e3' : '#fde2e2',
                          color: candidatureSelectee.statut === 'ACCEPTEE' ? '#15803d' : '#b91c1c',
                          fontWeight: 600, fontSize: 14, textAlign: 'center',
                        }}>
                          {candidatureSelectee.statut === 'ACCEPTEE' ? '✓ Candidature acceptée' : '✕ Candidature refusée'}
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {/* Tableau */}
              <section style={{ ...CARTE, overflow: 'hidden' }}>
                {candidaturesChargement ? (
                  <div style={{ padding: 48, textAlign: 'center', color: MUTED }}>Chargement…</div>
                ) : candidaturesErreur ? (
                  <div style={{ padding: 32, textAlign: 'center', color: '#b91c1c' }}>{candidaturesErreur}</div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: '#f8faff' }}>
                          {['Étudiant', 'Offre', 'Filière', 'Date', 'Statut', 'Actions'].map(h => (
                            <th key={h} style={{ padding: '13px 16px', textAlign: 'left', fontWeight: 600, color: MUTED, whiteSpace: 'nowrap', borderBottom: '1px solid #eef2fa' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(filtreStatut === 'TOUS' ? candidatures : candidatures.filter(c => c.statut === filtreStatut)).length === 0 ? (
                          <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: MUTED }}>Aucune candidature trouvée</td></tr>
                        ) : (
                          (filtreStatut === 'TOUS' ? candidatures : candidatures.filter(c => c.statut === filtreStatut)).map(c => {
                            const badge = c.statut === 'ACCEPTEE'
                              ? { label: 'Acceptée',   fond: '#d9f5e3', texte: '#15803d' }
                              : c.statut === 'REFUSEE'
                              ? { label: 'Refusée',    fond: '#fde2e2', texte: '#b91c1c' }
                              : { label: 'En attente', fond: '#fef3c7', texte: '#d97706' }
                            return (
                              <tr key={c.id} style={{ borderBottom: '1px solid #f1f5fb', cursor: 'pointer' }}
                                onClick={() => setCandidatureSelectee(c)}>
                                <td style={{ padding: '13px 16px' }}>
                                  <div style={{ fontWeight: 600, color: NAVY }}>{c.etudiant.prenom} {c.etudiant.nom}</div>
                                  <div style={{ fontSize: 11, color: MUTED }}>{c.etudiant.email}</div>
                                </td>
                                <td style={{ padding: '13px 16px', color: NAVY }}>{c.offre.titre}</td>
                                <td style={{ padding: '13px 16px', color: MUTED }}>{c.etudiant.filiere ?? '—'}</td>
                                <td style={{ padding: '13px 16px', color: MUTED, whiteSpace: 'nowrap' }}>{formatDate(c.createdAt)}</td>
                                <td style={{ padding: '13px 16px' }}>
                                  <span style={{ background: badge.fond, color: badge.texte, padding: '4px 10px', borderRadius: 20, fontWeight: 600, fontSize: 12 }}>{badge.label}</span>
                                </td>
                                <td style={{ padding: '13px 16px' }} onClick={e => e.stopPropagation()}>
                                  {c.statut === 'EN_ATTENTE' && (
                                    <div style={{ display: 'flex', gap: 6 }}>
                                      <button onClick={() => changerStatutCandidature(c.id, 'ACCEPTEE')}
                                        disabled={actionEnCours === c.id}
                                        style={{ padding: '5px 10px', background: '#d9f5e3', color: '#15803d', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                                        ✓
                                      </button>
                                      <button onClick={() => changerStatutCandidature(c.id, 'REFUSEE')}
                                        disabled={actionEnCours === c.id}
                                        style={{ padding: '5px 10px', background: '#fde2e2', color: '#b91c1c', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                                        ✕
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}

          {/* ─── MESSAGES / NOTIFICATIONS ─── */}
          {vue === 'messages' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <h1 style={{ ...titrePage, margin: 0 }}>
                  Messages
                  {notifNonLues > 0 && (
                    <span style={{
                      marginLeft: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      minWidth: 22, height: 22, borderRadius: 11, padding: '0 6px',
                      background: '#ef4444', color: '#fff', fontSize: 12, fontWeight: 700, verticalAlign: 'middle',
                    }}>{notifNonLues}</span>
                  )}
                </h1>
                {notifNonLues > 0 && (
                  <button
                    onClick={toutMarquerLu}
                    disabled={marquageEnCours}
                    style={{
                      padding: '8px 18px', borderRadius: 8, border: `1.5px solid ${BLUE}`,
                      background: '#fff', color: BLUE, fontSize: 13, fontWeight: 600,
                      cursor: marquageEnCours ? 'not-allowed' : 'pointer', opacity: marquageEnCours ? 0.6 : 1,
                    }}>
                    {marquageEnCours ? 'Marquage…' : 'Tout marquer comme lu'}
                  </button>
                )}
              </div>

              <section style={{ ...CARTE, overflow: 'hidden' }}>
                {notifChargement ? (
                  <div style={{ padding: 40, textAlign: 'center', color: MUTED }}>Chargement…</div>
                ) : notifErreur ? (
                  <div style={{ padding: 40, textAlign: 'center', color: '#dc2626' }}>{notifErreur}</div>
                ) : notifications.length === 0 ? (
                  <div style={{ padding: 60, textAlign: 'center' }}>
                    <Icon name="bell" size={48} sw={1.2} />
                    <p style={{ margin: '16px 0 0', color: MUTED, fontSize: 15 }}>Aucune notification pour le moment</p>
                  </div>
                ) : (
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    {notifications.map((notif, i) => (
                      <li
                        key={notif.id}
                        onClick={() => { if (!notif.lu) marquerUneNotifLue(notif.id) }}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: 16,
                          padding: '18px 24px',
                          borderBottom: i < notifications.length - 1 ? '1px solid #eef2fa' : 'none',
                          background: notif.lu ? '#fff' : '#f0f5ff',
                          cursor: notif.lu ? 'default' : 'pointer',
                          transition: 'background 0.15s',
                        }}>
                        {/* Icône */}
                        <div style={{
                          width: 40, height: 40, borderRadius: 20, flexShrink: 0,
                          background: notif.lu ? '#eef2fa' : '#dbeafe',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: notif.lu ? MUTED : BLUE,
                        }}>
                          <Icon name="bell" size={18} />
                        </div>

                        {/* Contenu */}
                        <div style={{ flex: 1 }}>
                          <p style={{
                            margin: 0, fontSize: 14, lineHeight: 1.5,
                            color: notif.lu ? '#374151' : NAVY,
                            fontWeight: notif.lu ? 400 : 500,
                          }}>{notif.message}</p>
                          <p style={{ margin: '4px 0 0', fontSize: 12, color: MUTED }}>
                            {formatDate(notif.date)}
                          </p>
                        </div>

                        {/* Indicateur non-lu */}
                        {!notif.lu && (
                          <div style={{
                            width: 8, height: 8, borderRadius: 4, flexShrink: 0, marginTop: 6,
                            background: BLUE,
                          }} />
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}

          {/* ─── PARAMÈTRES ─── */}
          {vue === 'parametres' && (
            <>
              <h1 style={titrePage}>Paramètres</h1>

              {/* Changer le mot de passe */}
              <section style={{ ...CARTE, marginTop: 24, padding: 32 }}>
                <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700, color: NAVY, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  Changer le mot de passe
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
                  {/* Ancien mot de passe */}
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                      Mot de passe actuel
                    </label>
                    <input
                      type="password"
                      value={mdpForm.ancien}
                      onChange={e => setMdpForm(f => ({ ...f, ancien: e.target.value }))}
                      placeholder="••••••••"
                      style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* Nouveau mot de passe */}
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                      Nouveau mot de passe <span style={{ color: '#9ca3af', fontWeight: 400 }}>(min. 8 caractères)</span>
                    </label>
                    <input
                      type="password"
                      value={mdpForm.nouveau}
                      onChange={e => setMdpForm(f => ({ ...f, nouveau: e.target.value }))}
                      placeholder="••••••••"
                      style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* Confirmation */}
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                      Confirmer le nouveau mot de passe
                    </label>
                    <input
                      type="password"
                      value={mdpForm.confirmation}
                      onChange={e => setMdpForm(f => ({ ...f, confirmation: e.target.value }))}
                      placeholder="••••••••"
                      style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* Message retour */}
                  {mdpMsg && (
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 500,
                      background: mdpMsg.type === 'ok' ? '#d1fae5' : '#fee2e2',
                      color: mdpMsg.type === 'ok' ? '#065f46' : '#991b1b',
                      border: `1px solid ${mdpMsg.type === 'ok' ? '#6ee7b7' : '#fca5a5'}`,
                    }}>
                      {mdpMsg.texte}
                    </div>
                  )}

                  <button
                    onClick={changerMotDePasse}
                    disabled={mdpEnvoi}
                    style={{
                      alignSelf: 'flex-start',
                      padding: '10px 24px',
                      background: mdpEnvoi ? '#93c5fd' : NAVY,
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: mdpEnvoi ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {mdpEnvoi ? 'Mise à jour…' : 'Mettre à jour le mot de passe'}
                  </button>
                </div>
              </section>

              {/* Zone de danger — Supprimer le compte */}
              <section style={{ ...CARTE, marginTop: 24, padding: 32, border: '1.5px solid #fca5a5' }}>
                <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: '#991b1b', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#991b1b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6"/>
                    <path d="M14 11v6"/>
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                  Zone de danger
                </h2>
                <p style={{ margin: '0 0 20px', fontSize: 14, color: '#6b7280' }}>
                  La suppression de votre compte est définitive. Toutes vos offres, candidatures et données seront effacées.
                </p>

                {!confirmSuppressionOuverte ? (
                  <button
                    onClick={() => { setConfirmSuppressionOuverte(true); setSuppressionMsg(null) }}
                    style={{ padding: '10px 24px', background: '#fee2e2', color: '#991b1b', border: '1.5px solid #fca5a5', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Supprimer mon compte
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 480 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#991b1b' }}>
                      Confirmez en saisissant votre mot de passe :
                    </p>
                    <input
                      type="password"
                      value={suppressionMdp}
                      onChange={e => setSuppressionMdp(e.target.value)}
                      placeholder="Votre mot de passe"
                      style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #fca5a5', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                    />

                    {suppressionMsg && (
                      <div style={{
                        padding: '10px 14px',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 500,
                        background: '#fee2e2',
                        color: '#991b1b',
                        border: '1px solid #fca5a5',
                      }}>
                        {suppressionMsg.texte}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 12 }}>
                      <button
                        onClick={supprimerCompte}
                        disabled={suppressionEnvoi}
                        style={{ padding: '10px 24px', background: suppressionEnvoi ? '#fca5a5' : '#dc2626', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: suppressionEnvoi ? 'not-allowed' : 'pointer' }}
                      >
                        {suppressionEnvoi ? 'Suppression…' : 'Confirmer la suppression'}
                      </button>
                      <button
                        onClick={() => { setConfirmSuppressionOuverte(false); setSuppressionMdp(''); setSuppressionMsg(null) }}
                        style={{ padding: '10px 24px', background: '#f3f4f6', color: '#374151', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  )
}