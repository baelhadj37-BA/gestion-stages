'use client'

import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const LARGEUR_MAQUETTE = 1672
const abonnerRedimension = (cb: () => void) => { window.addEventListener('resize', cb); return () => window.removeEventListener('resize', cb) }
const lireLargeur = () => window.innerWidth
const largeurServeur = () => LARGEUR_MAQUETTE

const NAVY  = '#0b2f7a'
const BLUE  = '#1d6fe8'
const MUTED = '#6b7a99'
const BG    = '#f0f4f8'
const WHITE = '#ffffff'

interface ProfilEtudiant {
  id: number; nom: string; prenom: string; email: string
  telephone?: string; classe?: string; filiere?: string
  matricule?: string; competences?: string; createdAt: string
  cvUrl?: string
  dateNaissance?: string; disponibilite?: string; dureeSouhaitee?: string
  domaineSouhaite?: string; villeSouhaitee?: string; niveauEtudes?: string
  photoUrl?: string
}
interface OffreMatching {
  id: number; titre: string; description: string; duree: string
  localisation: string; tags: string[]; score: number; recommande: boolean
  dejaPostule: boolean; candidatureStatut: string | null
  entreprise: { id: number; nom: string; prenom: string; secteur?: string }
}
interface Candidature {
  id: number; cvUrl: string; statut: 'EN_ATTENTE' | 'ACCEPTEE' | 'REFUSEE'
  score: number; createdAt: string
  offre: { id: number; titre: string; duree: string; localisation: string; entreprise: { nom: string; prenom: string } }
}
interface Notification {
  id: number; message: string; type: string; lu: boolean; createdAt: string
}
interface ConventionDetail {
  id: number
  statut: string
  pdfUrl: string | null
  motifRejet: string | null
  dateValidation: string | null
  createdAt: string
  stage?: {
    id?: number
    dateDebut?: string
    dateFin?: string
    etudiant?: { nom: string; prenom: string; email: string }
    statut?: string
    encadreur?: { id: number; nom: string; prenom: string; email: string } | null
    evaluation?: { note: number; commentaire?: string | null } | null
    evaluationEntreprise?: { note: number; commentaire?: string | null; attestation: boolean } | null
    candidature?: {
      offre?: {
        titre?: string
        duree?: string
        localisation?: string
        entreprise?: { nom?: string; prenom?: string; secteur?: string | null; email?: string | null }
      }
    }
  }
}

interface Convention {
  id: number
  statut: string
  stage?: {
    id?: number
    candidature?: {
      offre?: {
        titre?: string
        entreprise?: { nom?: string }
      }
    }
  }
}

function scoreCouleur(s: number) {
  if (s >= 70) return { color: '#15803d', bg: '#dcfce7', label: 'Excellent matching' }
  if (s >= 40) return { color: '#d97706', bg: '#fef3c7', label: 'Matching moyen' }
  return { color: '#dc2626', bg: '#fee2e2', label: 'Faible matching' }
}
function statutCouleur(s: string) {
  if (s === 'ACCEPTEE') return { color: '#15803d', bg: '#dcfce7', label: 'Acceptée' }
  if (s === 'REFUSEE')  return { color: '#dc2626', bg: '#fee2e2', label: 'Refusée' }
  return { color: '#d97706', bg: '#fef3c7', label: 'En cours' }
}
function initiales(nom: string, prenom: string) {
  return `${(prenom||'')[0]||''}${(nom||'')[0]||''}`.toUpperCase()
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}
function bonjour() {
  const h = new Date().getHours()
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bon après-midi'
  return 'Bonsoir'
}

const AVATAR_COLORS = ['#1d6fe8','#7c3aed','#ea580c','#15803d','#dc2626','#0891b2']
function avatarColor(str: string) {
  let h = 0; for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

const MENU = [
  { id: 'tableau',      label: 'Tableau de bord',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/></svg> },
  { id: 'offres',       label: 'Offres de stage',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="currentColor" strokeWidth="1.8"/></svg> },
  { id: 'candidatures', label: 'Mes candidatures',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.8"/><polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="1.8"/></svg> },
  { id: 'journal',      label: 'Journal de bord',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="1.8"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="1.8"/></svg> },
  { id: 'convention',   label: 'Convention de stage',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
  { id: 'profil',       label: 'Mon profil',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/></svg> },
]

const inputSt: React.CSSProperties = {
  width: '100%', border: '1px solid #e2e8f0', borderRadius: 8,
  padding: '9px 12px', fontSize: 13, outline: 'none', color: NAVY,
  boxSizing: 'border-box', fontFamily: 'inherit', background: WHITE,
}
const cardSt: React.CSSProperties = {
  background: WHITE, borderRadius: 14, padding: '20px 22px',
  boxShadow: '0 2px 10px rgba(30,70,150,0.07)', border: '1px solid #eef2fa',
}

export default function DashboardEtudiant() {
  const router = useRouter()
  const [vue, setVue]     = useState('tableau')
  const tokenRef = useRef('')

  const [profil,         setProfil]         = useState<ProfilEtudiant | null>(null)
  const [offres,         setOffres]         = useState<OffreMatching[]>([])
  const [candidatures,   setCandidatures]   = useState<Candidature[]>([])
  const [notifications,  setNotifications]  = useState<Notification[]>([])
  const [conventions,    setConventions]    = useState<Convention[]>([])
  const [chgtOffres,     setChgtOffres]     = useState(false)
  const [chgtCandid,     setChgtCandid]     = useState(false)
  const [chgtConvention, setChgtConvention] = useState(false)
  const [convDetail, setConvDetail] = useState<ConventionDetail | null>(null)
  const [chgtConvDetail, setChgtConvDetail] = useState(false)
  const [signerEnCours, setSignerEnCours] = useState(false)
  const [msgSigner, setMsgSigner] = useState('')

  const [filtreOffre,       setFiltreOffre]       = useState('')
  const [filtreScore,       setFiltreScore]       = useState<'tous'|'excellent'|'moyen'|'faible'>('tous')
  const [filtreCandidature, setFiltreCandidature] = useState<'tous'|'EN_ATTENTE'|'ACCEPTEE'|'REFUSEE'>('tous')

  const [offreSelect, setOffreSelect] = useState<OffreMatching | null>(null)
  const [cvFichier,   setCvFichier]   = useState<File | null>(null)
  const [lettreFich,  setLettreFich]  = useState<File | null>(null)
  const [envoi,       setEnvoi]       = useState(false)
  const [msgPost,     setMsgPost]     = useState('')

  // Upload profil
  const [cvProfilFich,    setCvProfilFich]    = useState<File | null>(null)
  const [photoProfilFich, setPhotoProfilFich] = useState<File | null>(null)
  const [uploadingProfil, setUploadingProfil] = useState(false)

  const [onglet,    setOnglet]    = useState<'infos'|'competences'|'securite'>('infos')
  const [editInfos, setEditInfos] = useState(false)
  const [formInfos, setFormInfos] = useState({ nom:'', prenom:'', email:'', telephone:'', classe:'', filiere:'', cvUrl:'', dateNaissance:'', disponibilite:'', dureeSouhaitee:'', domaineSouhaite:'', villeSouhaitee:'', niveauEtudes:'', photoUrl:'' })
  const [formComp,  setFormComp]  = useState('')
  const [editComp,  setEditComp]  = useState(false)
  const [formMdp,   setFormMdp]   = useState({ ancien:'', nouveau:'', confirmation:'' })
  const [msgProfil, setMsgProfil] = useState('')
  const [errProfil, setErrProfil] = useState('')
  const [saving,    setSaving]    = useState(false)
  const [menuOuvert, setMenuOuvert] = useState(false)

  const largeur = useSyncExternalStore(abonnerRedimension, lireLargeur, largeurServeur)
  const echelle = largeur >= 1024 ? Math.min(Math.max(largeur / LARGEUR_MAQUETTE, 0.6), 1.5) : 1
  const hauteurPage = `${100 / echelle}vh`

  const loadProfil = useCallback(async (tok: string) => {
    const r = await fetch('/api/etudiant/profil', { headers: { Authorization: `Bearer ${tok}` } })
    const d = await r.json()
    if (r.ok) {
      setProfil(d.profil)
      setFormInfos({ nom: d.profil.nom||'', prenom: d.profil.prenom||'', email: d.profil.email||'', telephone: d.profil.telephone||'', classe: d.profil.classe||'', filiere: d.profil.filiere||'', cvUrl: d.profil.cvUrl||'', dateNaissance: d.profil.dateNaissance||'', disponibilite: d.profil.disponibilite||'', dureeSouhaitee: d.profil.dureeSouhaitee||'', domaineSouhaite: d.profil.domaineSouhaite||'', villeSouhaitee: d.profil.villeSouhaitee||'', niveauEtudes: d.profil.niveauEtudes||'', photoUrl: d.profil.photoUrl||'' })
      setFormComp(d.profil.competences || '')
      const champs = [d.profil.nom, d.profil.prenom, d.profil.telephone, d.profil.classe, d.profil.filiere, d.profil.competences]
      if (champs.filter(Boolean).length < 3) setEditInfos(true)
    }
  }, [])

  const loadOffres = useCallback(async (tok: string) => {
    setChgtOffres(true)
    try {
      const r = await fetch('/api/etudiant/matching', { headers: { Authorization: `Bearer ${tok}` } })
      const d = await r.json()
      if (r.ok) setOffres(d.data || [])
    } finally { setChgtOffres(false) }
  }, [])

  const loadCandid = useCallback(async (tok: string) => {
    setChgtCandid(true)
    try {
      const r = await fetch('/api/candidatures', { headers: { Authorization: `Bearer ${tok}` } })
      const d = await r.json()
      if (r.ok) setCandidatures(d.data || [])
    } finally { setChgtCandid(false) }
  }, [])

  const loadNotifs = useCallback(async (tok: string) => {
    try {
      const r = await fetch('/api/etudiant/notifications', { headers: { Authorization: `Bearer ${tok}` } })
      const d = await r.json()
      if (r.ok) setNotifications(d.notifications || [])
    } catch { /* silencieux */ }
  }, [])

  const loadConventions = useCallback(async (tok: string) => {
    setChgtConvention(true)
    try {
      const r = await fetch('/api/conventions', { headers: { Authorization: `Bearer ${tok}` } })
      const d = await r.json()
      if (r.ok) setConventions(d.data || [])
    } finally { setChgtConvention(false) }
  }, [])

  const marquerLu = useCallback(async (id: number) => {
    const tok = tokenRef.current
    await fetch('/api/etudiant/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` },
      body: JSON.stringify({ id }),
    })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n))
  }, [])

  const toutMarquer = useCallback(async () => {
    const tok = tokenRef.current
    await fetch('/api/etudiant/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` },
      body: JSON.stringify({ toutMarquer: true }),
    })
    setNotifications(prev => prev.map(n => ({ ...n, lu: true })))
  }, [])

  useEffect(() => {
    async function init() {
      const t = localStorage.getItem('token') || ''
      if (!t) { router.push('/login'); return }
      tokenRef.current = t
      await Promise.all([loadProfil(t), loadOffres(t), loadCandid(t), loadNotifs(t), loadConventions(t)])
    }
    init().catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const deco = () => { localStorage.removeItem('token'); router.push('/login') }
  const nav  = (id: string) => {
    setVue(id)
    setMsgProfil('')
    setErrProfil('')
    if (id === 'notifications') loadNotifs(tokenRef.current)
  }

  const completion = (() => {
    if (!profil) return 0
    return Math.round([profil.nom, profil.prenom, profil.email, profil.telephone, profil.classe, profil.filiere, profil.competences, profil.cvUrl, profil.dateNaissance, profil.disponibilite, profil.dureeSouhaitee, profil.domaineSouhaite, profil.villeSouhaitee, profil.niveauEtudes].filter(Boolean).length / 14 * 100)
  })()

  const scoresMoyen = offres.length ? Math.round(offres.reduce((a, o) => a + o.score, 0) / offres.length) : 0
  const offresFiltrees = offres.filter(o => {
    const q = filtreOffre.toLowerCase()
    const txt = !q || o.titre.toLowerCase().includes(q) || o.entreprise.nom.toLowerCase().includes(q) || o.tags.some(t => t.toLowerCase().includes(q))
    const sc  = filtreScore === 'tous' || (filtreScore === 'excellent' && o.score >= 70) || (filtreScore === 'moyen' && o.score >= 40 && o.score < 70) || (filtreScore === 'faible' && o.score < 40)
    return txt && sc
  })
  const candidFiltrees = filtreCandidature === 'tous' ? candidatures : candidatures.filter(c => c.statut === filtreCandidature)

  // Nombre de notifs non lues (vraies notifs depuis la BDD)
  const nbNotifsNonLues = notifications.filter(n => !n.lu).length

  const postuler = async () => {
    if (!offreSelect || !cvFichier) { setMsgPost('Le CV est obligatoire'); return }
    setEnvoi(true); setMsgPost('')
    try {
      // 1. Upload CV
      const formCv = new FormData()
      formCv.append('fichier', cvFichier)
      formCv.append('type', 'cv')
      const rCv = await fetch('/api/upload', { method: 'POST', headers: { Authorization: `Bearer ${tokenRef.current}` }, body: formCv })
      const dCv = await rCv.json()
      if (!rCv.ok) { setMsgPost(dCv.message || 'Erreur upload CV'); return }

      // 2. Upload lettre (optionnel)
      let lettreUrl: string | null = null
      if (lettreFich) {
        const formL = new FormData()
        formL.append('fichier', lettreFich)
        formL.append('type', 'lettre')
        const rL = await fetch('/api/upload', { method: 'POST', headers: { Authorization: `Bearer ${tokenRef.current}` }, body: formL })
        const dL = await rL.json()
        if (!rL.ok) { setMsgPost(dL.message || 'Erreur upload lettre'); return }
        lettreUrl = dL.url
      }

      // 3. Envoyer candidature
      const r = await fetch('/api/candidatures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRef.current}` },
        body: JSON.stringify({ offreId: offreSelect.id, cvUrl: dCv.url, lettreUrl }),
      })
      const d = await r.json()
      if (r.ok) {
        setMsgPost('Candidature envoyée !')
        loadOffres(tokenRef.current); loadCandid(tokenRef.current)
        setTimeout(() => { setOffreSelect(null); setCvFichier(null); setLettreFich(null); setMsgPost('') }, 1500)
      } else setMsgPost(d.message || 'Erreur')
    } finally { setEnvoi(false) }
  }

  const saveInfos = async () => {
    setSaving(true); setMsgProfil(''); setErrProfil('')
    try {
      let cvUrl = formInfos.cvUrl
      let photoUrl = formInfos.photoUrl

      // Upload CV si un nouveau fichier a été sélectionné
      if (cvProfilFich) {
        setUploadingProfil(true)
        const fd = new FormData(); fd.append('fichier', cvProfilFich); fd.append('type', 'cv')
        const rU = await fetch('/api/upload', { method: 'POST', headers: { Authorization: `Bearer ${tokenRef.current}` }, body: fd })
        const dU = await rU.json()
        if (!rU.ok) { setErrProfil(dU.message || 'Erreur upload CV'); setSaving(false); setUploadingProfil(false); return }
        cvUrl = dU.url
        setCvProfilFich(null)
      }

      // Upload photo si un nouveau fichier a été sélectionné
      if (photoProfilFich) {
        setUploadingProfil(true)
        const fd = new FormData(); fd.append('fichier', photoProfilFich); fd.append('type', 'photo')
        const rU = await fetch('/api/upload', { method: 'POST', headers: { Authorization: `Bearer ${tokenRef.current}` }, body: fd })
        const dU = await rU.json()
        if (!rU.ok) { setErrProfil(dU.message || 'Erreur upload photo'); setSaving(false); setUploadingProfil(false); return }
        photoUrl = dU.url
        setPhotoProfilFich(null)
      }

      setUploadingProfil(false)
      const r = await fetch('/api/etudiant/profil', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRef.current}` }, body: JSON.stringify({ ...formInfos, cvUrl, photoUrl }) })
      const d = await r.json()
      if (r.ok) { setMsgProfil('Profil mis à jour'); setProfil(d.profil); setEditInfos(false) }
      else setErrProfil(d.message || 'Erreur')
    } finally { setSaving(false); setUploadingProfil(false) }
  }

  const saveComp = async () => {
    setSaving(true); setMsgProfil(''); setErrProfil('')
    try {
      const r = await fetch('/api/etudiant/profil', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRef.current}` }, body: JSON.stringify({ ...formInfos, competences: formComp }) })
      const d = await r.json()
      if (r.ok) { setMsgProfil('Compétences mises à jour'); setProfil(p => p ? { ...p, competences: d.profil.competences } : p); setEditComp(false); loadOffres(tokenRef.current) }
      else setErrProfil(d.message || 'Erreur')
    } finally { setSaving(false) }
  }

  const saveMdp = async () => {
    setMsgProfil(''); setErrProfil('')
    if (!formMdp.ancien || !formMdp.nouveau) { setErrProfil('Tous les champs sont requis'); return }
    if (formMdp.nouveau !== formMdp.confirmation) { setErrProfil('Les mots de passe ne correspondent pas'); return }
    if (formMdp.nouveau.length < 8) { setErrProfil('Minimum 8 caractères'); return }
    setSaving(true)
    try {
      const r = await fetch('/api/etudiant/profil', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRef.current}` }, body: JSON.stringify({ ancienMotDePasse: formMdp.ancien, nouveauMotDePasse: formMdp.nouveau }) })
      const d = await r.json()
      if (r.ok) { setMsgProfil('Mot de passe mis à jour'); setFormMdp({ ancien:'', nouveau:'', confirmation:'' }) }
      else setErrProfil(d.message || 'Erreur')
    } finally { setSaving(false) }
  }

  // ── SIDEBAR ───────────────────────────────────────────────
  const sidebar = (
    <aside style={{
      position: 'sticky', top: 0, alignSelf: 'flex-start',
      display: 'flex', flexDirection: 'column',
      width: 315, flexShrink: 0, height: hauteurPage, overflow: 'hidden',
      color: WHITE,
      background: 'linear-gradient(180deg, #0b3590 0%, #0a2c7e 60%, #0a3a9a 100%)',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '19px 22px 0' }}>
        <div style={{ position: 'relative', width: 68, height: 68, flexShrink: 0, overflow: 'hidden', borderRadius: '50%', background: WHITE }}>
          <Image src="/logo-ipd.png" alt="Logo IPD" fill sizes="68px" priority style={{ objectFit: 'contain' }} />
        </div>
        <div style={{ lineHeight: 1.3 }}>
          <p style={{ margin: 0, fontSize: 13.5, fontWeight: 800 }}>INSTITUT POLYTECHNIQUE<br />DE DAKAR</p>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: '#dbe7ff' }}>Plateforme de gestion des stages</p>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '24px 14px 0' }}>
        {MENU.map(item => {
          const a = vue === item.id
          return (
            <button key={item.id} onClick={() => nav(item.id)} style={{
              display: 'flex', alignItems: 'center', gap: 20,
              width: '100%', height: 44, padding: '0 16px', marginBottom: 6,
              borderRadius: 8, border: 'none', textAlign: 'left', cursor: 'pointer',
              color: WHITE, fontSize: 14.5, fontWeight: 500,
              background: a ? '#1565e8' : 'transparent',
              boxShadow: a ? '0 6px 16px rgba(0,0,0,0.25)' : 'none',
            }}>
              <span style={{ flexShrink: 0, opacity: a ? 1 : 0.7 }}>{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Bas décoratif */}
      <div style={{ marginTop: 'auto', position: 'relative', height: 260, flexShrink: 0 }}>
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
        <svg viewBox="0 0 200 40" aria-hidden="true"
          style={{ position: 'absolute', left: 88, top: 182, width: 165 }}>
          <path d="M5 35 Q80 5 195 12" stroke="white" fill="none" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
    </aside>
  )

  // ── TOPBAR ────────────────────────────────────────────────
  const topbar = (
    <header style={{ height: 64, background: WHITE, borderBottom: '1px solid #eef2fa', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 6px rgba(30,70,150,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f4f7fc', borderRadius: 10, padding: '9px 16px', width: 380, border: '1px solid #eef2fa' }}>
        <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" stroke={MUTED} strokeWidth="2"/><path d="M21 21l-4.35-4.35" stroke={MUTED} strokeWidth="2" strokeLinecap="round"/></svg>
        <input placeholder="Rechercher une offre, une entreprise, un domaine..." style={{ border: 'none', background: 'none', outline: 'none', fontSize: 13, color: NAVY, width: '100%', fontFamily: 'inherit' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Cloche — utilise les vraies notifications non lues */}
        <button
          onClick={() => nav('notifications')}
          aria-label="Notifications"
          style={{ position: 'relative', color: NAVY, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: 4 }}
        >
          <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {nbNotifsNonLues > 0 && (
            <span style={{ position: 'absolute', top: -4, right: -5, minWidth: 18, height: 18, padding: '0 4px', borderRadius: 9, background: '#ef4444', color: WHITE, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {nbNotifsNonLues > 99 ? '99+' : nbNotifsNonLues}
            </span>
          )}
        </button>
        {/* Avatar profil + dropdown */}
        {profil && (
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '6px 10px', borderRadius: 10, border: '1px solid #eef2fa' }} onClick={() => setMenuOuvert(o => !o)}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', color: WHITE, fontWeight: 700, fontSize: 13 }}>
                {initiales(profil.nom, profil.prenom)}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, lineHeight: 1.2 }}>{profil.prenom} {profil.nom}</div>
                <div style={{ fontSize: 11, color: MUTED }}>Étudiant</div>
              </div>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" style={{ color: MUTED, marginLeft: 2 }}><polyline points="6,9 12,15 18,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </div>
            {menuOuvert && (
              <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 10px)', width: 190, padding: 8, borderRadius: 12, background: '#fff', border: '1px solid #eef2fa', boxShadow: '0 10px 30px rgba(30,70,150,0.15)', zIndex: 100 }}>
                <button onClick={() => { setMenuOuvert(false); nav('profil') }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: NAVY }}>
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/></svg>
                  Mon profil
                </button>
                <div style={{ height: 1, background: '#eef2fa', margin: '4px 0' }} />
                <button onClick={() => { setMenuOuvert(false); deco() }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#dc2626' }}>
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><polyline points="16,17 21,12 16,7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )

  // ── BANDEAU HERO ──────────────────────────────────────────
  const hero = profil && (
    <div style={{ margin: '24px 24px 20px', borderRadius: 16, background: 'linear-gradient(135deg, #e8f0fe 0%, #dce8fd 60%, #c7d8fb 100%)', padding: '24px 28px', display: 'flex', alignItems: 'center', gap: 20, position: 'relative', overflow: 'hidden', minHeight: 110 }}>
      <div style={{ width: 60, height: 60, borderRadius: '50%', background: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z" stroke={WHITE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 12v5c3 3 9 3 12 0v-5" stroke={WHITE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <div style={{ flex: 1 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: NAVY }}>{bonjour()}, {profil.prenom} ! 👋</h2>
        <p style={{ margin: 0, fontSize: 13, color: MUTED }}>Voici un aperçu de votre parcours et des opportunités qui vous correspondent.</p>
      </div>
      <div style={{ position: 'absolute', right: 200, top: 18, fontFamily: "'Segoe Script','Brush Script MT',cursive", fontSize: 16, color: NAVY, opacity: 0.5, transform: 'rotate(-8deg)' }}>
        Votre avenir<br />se construit maintenant !
      </div>
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 180, background: 'linear-gradient(135deg, #1d6fe820, #0b2f7a30)', borderRadius: '0 16px 16px 0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="80" height="80" fill="none" viewBox="0 0 100 100" style={{ opacity: 0.15 }}>
          <rect x="10" y="40" width="80" height="55" fill={NAVY}/>
          <rect x="20" y="20" width="60" height="25" fill={NAVY}/>
          <rect x="35" y="60" width="12" height="35" fill={WHITE}/>
          <rect x="53" y="60" width="12" height="35" fill={WHITE}/>
          <rect x="25" y="45" width="10" height="10" fill={WHITE}/>
          <rect x="65" y="45" width="10" height="10" fill={WHITE}/>
        </svg>
      </div>
    </div>
  )

  // ── VUE TABLEAU ───────────────────────────────────────────
  const renderTableau = () => (
    <>
      {topbar}
      {hero}
      <div style={{ padding: '0 24px 40px' }}>
        {/* 4 stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
          {[
            { label: 'Offres disponibles', val: offres.length, sub: `+${Math.min(offres.length,3)} cette semaine`, color: BLUE, bg: '#e8f0fe',
              icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" stroke={BLUE} strokeWidth="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke={BLUE} strokeWidth="2"/></svg> },
            { label: 'Candidatures envoyées', val: candidatures.length, sub: `+${Math.min(candidatures.length,2)} cette semaine`, color: '#7c3aed', bg: '#f3e8ff',
              icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#7c3aed" strokeWidth="2"/><polyline points="14,2 14,8 20,8" stroke="#7c3aed" strokeWidth="2"/></svg> },
            { label: 'Taux de matching moyen', val: `${scoresMoyen}%`, sub: '+5% cette semaine', color: '#15803d', bg: '#dcfce7',
              icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#15803d" strokeWidth="2"/><path d="M9 12l2 2 4-4" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
            { label: 'Évaluations en attente', val: candidatures.filter(c => c.statut === 'EN_ATTENTE').length, sub: '+1 cette semaine', color: '#d97706', bg: '#fef3c7',
              icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" stroke="#d97706" strokeWidth="2" strokeLinejoin="round"/></svg> },
          ].map(s => (
            <div key={s.label} style={{ ...cardSt, padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {s.icon}
                </div>
              </div>
              <div style={{ fontSize: 11, color: MUTED, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: NAVY, lineHeight: 1, marginBottom: 8 }}>{s.val}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#15803d' }}>
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24"><polyline points="23,6 13.5,15.5 8.5,10.5 1,18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
                {s.sub}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
          {/* Colonne gauche */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Offres recommandées */}
            <div style={cardSt}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="18" height="18" fill="#d97706" viewBox="0 0 24 24"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: NAVY }}>Offres de stage recommandées</div>
                    <div style={{ fontSize: 11, color: MUTED }}>Basées sur votre profil et vos compétences.</div>
                  </div>
                </div>
                <button onClick={() => nav('offres')} style={{ border: 'none', background: 'none', color: BLUE, fontSize: 12, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  Voir toutes les offres <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                </button>
              </div>
              {chgtOffres
                ? <div style={{ color: MUTED, fontSize: 13, padding: '20px 0', textAlign: 'center' }}>Chargement...</div>
                : offres.length === 0
                  ? <div style={{ color: MUTED, fontSize: 13, padding: '20px 0', textAlign: 'center' }}>Aucune offre disponible</div>
                  : offres.slice(0, 4).map(o => {
                      const sc  = scoreCouleur(o.score)
                      const col = avatarColor(o.entreprise.nom)
                      return (
                        <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid #f4f7fc' }}>
                          <div style={{ width: 42, height: 42, borderRadius: 10, background: col, display: 'flex', alignItems: 'center', justifyContent: 'center', color: WHITE, fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
                            {initiales(o.entreprise.nom, o.entreprise.prenom)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: NAVY }}>{o.titre}</div>
                            <div style={{ fontSize: 11, color: MUTED }}>{o.entreprise.nom}</div>
                            <div style={{ display: 'flex', gap: 10, marginTop: 3 }}>
                              <span style={{ fontSize: 11, color: MUTED, display: 'flex', alignItems: 'center', gap: 3 }}>
                                <svg width="11" height="11" fill="none" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/></svg>
                                {o.localisation}
                              </span>
                              <span style={{ fontSize: 11, color: MUTED, display: 'flex', alignItems: 'center', gap: 3 }}>
                                <svg width="11" height="11" fill="none" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                                {o.duree}
                              </span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 16, fontWeight: 800, color: sc.color }}>{o.score}%</span>
                              <span style={{ fontSize: 11, color: sc.color }}>{sc.label}</span>
                            </div>
                            {!o.dejaPostule && (
                              <button onClick={() => setOffreSelect(o)} style={{ background: 'none', border: `1px solid #eef2fa`, color: NAVY, borderRadius: 7, padding: '4px 10px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                Voir <svg width="12" height="12" fill="none" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
            </div>

            {/* Mes dernières candidatures */}
            <div style={cardSt}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: '#e8f0fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={BLUE} strokeWidth="2"/><polyline points="14,2 14,8 20,8" stroke={BLUE} strokeWidth="2"/></svg>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 14, color: NAVY }}>Mes dernières candidatures</span>
                </div>
                <button onClick={() => nav('candidatures')} style={{ border: 'none', background: 'none', color: BLUE, fontSize: 12, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  Voir toutes <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                </button>
              </div>
              {candidatures.length === 0
                ? <div style={{ color: MUTED, fontSize: 13, padding: '16px 0', textAlign: 'center' }}>Aucune candidature pour le moment</div>
                : <>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr', padding: '8px 0', borderBottom: '1px solid #f4f7fc', marginBottom: 4 }}>
                      {['Offre de stage','Entreprise','Date','Statut'].map(h => <div key={h} style={{ fontSize: 12, fontWeight: 600, color: MUTED }}>{h}</div>)}
                    </div>
                    {candidatures.slice(0, 5).map(c => {
                      const s = statutCouleur(c.statut)
                      return (
                        <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr', padding: '10px 0', borderBottom: '1px solid #f9fafb', alignItems: 'center' }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: NAVY }}>{c.offre.titre}</div>
                          <div style={{ fontSize: 12, color: MUTED }}>{c.offre.entreprise.nom}</div>
                          <div style={{ fontSize: 12, color: MUTED }}>{fmtDate(c.createdAt)}</div>
                          <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, display: 'inline-block' }}>{s.label}</span>
                        </div>
                      )
                    })}
                  </>}
            </div>
          </div>

          {/* Colonne droite */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Carte profil */}
            <div style={{ ...cardSt, padding: '20px' }}>
              {profil && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#dce8fd', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={BLUE} strokeWidth="2"/><circle cx="12" cy="7" r="4" stroke={BLUE} strokeWidth="2"/></svg>
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 15, color: NAVY }}>{profil.prenom} {profil.nom}</div>
                      <div style={{ fontSize: 12, color: MUTED }}>Étudiant</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 14, fontSize: 12, color: MUTED }}>
                    {profil.filiere && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z" stroke={BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      {profil.filiere}
                    </div>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={BLUE} strokeWidth="2"/></svg>
                      IPD Thomas Sankara
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" stroke={BLUE} strokeWidth="2"/><circle cx="12" cy="10" r="3" stroke={BLUE} strokeWidth="2"/></svg>
                      Dakar, Sénégal
                    </div>
                  </div>
                  <button onClick={() => nav('profil')} style={{ width: '100%', border: `1.5px solid ${BLUE}`, background: 'none', color: BLUE, borderRadius: 9, padding: '8px 0', fontSize: 13, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 14 }}>
                    Voir mon profil <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  </button>
                  <div style={{ borderTop: '1px solid #eef2fa', paddingTop: 12 }}>
                    <div style={{ fontWeight: 600, fontSize: 12, color: NAVY, marginBottom: 8 }}>Mon profil</div>
                    <div style={{ height: 6, background: '#eef2fa', borderRadius: 3, marginBottom: 6 }}>
                      <div style={{ height: '100%', width: `${completion}%`, background: BLUE, borderRadius: 3 }} />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: BLUE, marginBottom: 4 }}>{completion}%</div>
                    <div style={{ fontSize: 11, color: MUTED }}>Complétez votre profil pour améliorer votre matching.</div>
                  </div>
                </>
              )}
            </div>

            {/* Notifications récentes — vraies données BDD */}
            <div style={cardSt}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#d97706" strokeWidth="2"/><path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#d97706" strokeWidth="2"/></svg>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 13, color: NAVY }}>Notifications récentes</span>
                </div>
                {nbNotifsNonLues > 0 && (
                  <button onClick={toutMarquer} style={{ border: 'none', background: 'none', color: BLUE, fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                    Tout marquer lu
                  </button>
                )}
              </div>
              {notifications.length === 0
                ? <div style={{ color: MUTED, fontSize: 12, textAlign: 'center', padding: '10px 0' }}>Aucune notification</div>
                : notifications.slice(0, 5).map(n => {
                    const isAccept = n.type === 'CANDIDATURE_ACCEPTEE'
                    const isRefus  = n.type === 'CANDIDATURE_REFUSEE'
                    const iconColor = isAccept ? '#15803d' : isRefus ? '#dc2626' : BLUE
                    const iconBg    = isAccept ? '#dcfce7' : isRefus ? '#fee2e2' : '#e8f0fe'
                    return (
                      <div
                        key={n.id}
                        onClick={() => !n.lu && marquerLu(n.id)}
                        style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: '1px solid #f9fafb', cursor: n.lu ? 'default' : 'pointer', opacity: n.lu ? 0.7 : 1 }}
                      >
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {isAccept
                            ? <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke={iconColor} strokeWidth="2" strokeLinecap="round"/><polyline points="22,4 12,14.01 9,11.01" stroke={iconColor} strokeWidth="2" strokeLinecap="round"/></svg>
                            : isRefus
                              ? <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke={iconColor} strokeWidth="2"/><line x1="15" y1="9" x2="9" y2="15" stroke={iconColor} strokeWidth="2" strokeLinecap="round"/><line x1="9" y1="9" x2="15" y2="15" stroke={iconColor} strokeWidth="2" strokeLinecap="round"/></svg>
                              : <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={iconColor} strokeWidth="2"/></svg>
                          }
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: n.lu ? 400 : 700, color: NAVY }}>{n.message}</div>
                          <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>{fmtDate(n.createdAt)}</div>
                        </div>
                        {!n.lu && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', flexShrink: 0, marginTop: 4 }} />}
                      </div>
                    )
                  })}
              {notifications.length > 5 && (
                <button onClick={() => nav('notifications')} style={{ width: '100%', border: 'none', background: 'none', color: BLUE, fontSize: 12, cursor: 'pointer', fontWeight: 600, paddingTop: 10, textAlign: 'center' }}>
                  Voir toutes les notifications →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )

  // ── NOTIFICATIONS (vue complète) ─────────────────────────
  const renderNotifications = () => (
    <>
      {topbar}
      <div style={{ padding: '24px 24px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: NAVY }}>Notifications</h2>
            <p style={{ margin: 0, fontSize: 13, color: MUTED }}>{nbNotifsNonLues} non lue{nbNotifsNonLues > 1 ? 's' : ''}</p>
          </div>
          {nbNotifsNonLues > 0 && (
            <button onClick={toutMarquer} style={{ background: NAVY, color: WHITE, border: 'none', borderRadius: 9, padding: '9px 20px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
              Tout marquer comme lu
            </button>
          )}
        </div>
        {notifications.length === 0
          ? <div style={{ ...cardSt, textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
              <div style={{ fontWeight: 700, color: NAVY, marginBottom: 6 }}>Aucune notification</div>
              <div style={{ fontSize: 13, color: MUTED }}>Vous serez notifié ici lors de réponses à vos candidatures.</div>
            </div>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {notifications.map(n => {
                const isAccept = n.type === 'CANDIDATURE_ACCEPTEE'
                const isRefus  = n.type === 'CANDIDATURE_REFUSEE'
                const iconColor = isAccept ? '#15803d' : isRefus ? '#dc2626' : BLUE
                const iconBg    = isAccept ? '#dcfce7' : isRefus ? '#fee2e2' : '#e8f0fe'
                return (
                  <div
                    key={n.id}
                    onClick={() => !n.lu && marquerLu(n.id)}
                    style={{ ...cardSt, display: 'flex', gap: 14, alignItems: 'flex-start', cursor: n.lu ? 'default' : 'pointer', borderLeft: n.lu ? '3px solid transparent' : `3px solid ${iconColor}` }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {isAccept
                        ? <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke={iconColor} strokeWidth="2" strokeLinecap="round"/><polyline points="22,4 12,14.01 9,11.01" stroke={iconColor} strokeWidth="2" strokeLinecap="round"/></svg>
                        : isRefus
                          ? <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke={iconColor} strokeWidth="2"/><line x1="15" y1="9" x2="9" y2="15" stroke={iconColor} strokeWidth="2" strokeLinecap="round"/><line x1="9" y1="9" x2="15" y2="15" stroke={iconColor} strokeWidth="2" strokeLinecap="round"/></svg>
                          : <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={iconColor} strokeWidth="2"/></svg>
                      }
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: n.lu ? 400 : 700, color: NAVY, marginBottom: 4 }}>{n.message}</div>
                      <div style={{ fontSize: 12, color: MUTED }}>{fmtDate(n.createdAt)}</div>
                    </div>
                    {!n.lu && (
                      <span style={{ background: '#ef4444', color: WHITE, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, flexShrink: 0 }}>Nouveau</span>
                    )}
                  </div>
                )
              })}
            </div>}
      </div>
    </>
  )

  // ── OFFRES ────────────────────────────────────────────────
  const renderOffres = () => (
    <>
      {topbar}
      <div style={{ padding: '24px 24px 40px' }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: NAVY }}>Offres de stage</h2>
        <p style={{ margin: '0 0 18px', fontSize: 13, color: MUTED }}>{offres.length} offre{offres.length > 1 ? 's' : ''} disponible{offres.length > 1 ? 's' : ''}</p>
        <div style={{ ...cardSt, marginBottom: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: '#f4f7fc', borderRadius: 9, padding: '8px 14px', border: '1px solid #eef2fa' }}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" stroke={MUTED} strokeWidth="2"/><path d="M21 21l-4.35-4.35" stroke={MUTED} strokeWidth="2" strokeLinecap="round"/></svg>
            <input value={filtreOffre} onChange={e => setFiltreOffre(e.target.value)} placeholder="Rechercher..." style={{ border: 'none', background: 'none', outline: 'none', fontSize: 13, color: NAVY, width: '100%', fontFamily: 'inherit' }} />
          </div>
          <select value={filtreScore} onChange={e => setFiltreScore(e.target.value as 'tous'|'excellent'|'moyen'|'faible')}
            style={{ ...inputSt, width: 'auto', padding: '8px 12px', cursor: 'pointer' }}>
            <option value="tous">Tous les scores</option>
            <option value="excellent">Excellent (≥70%)</option>
            <option value="moyen">Moyen (40–69%)</option>
            <option value="faible">Faible (&lt;40%)</option>
          </select>
        </div>
        {chgtOffres
          ? <div style={{ ...cardSt, textAlign: 'center', padding: 40, color: MUTED }}>Chargement...</div>
          : offresFiltrees.length === 0
            ? <div style={{ ...cardSt, textAlign: 'center', padding: 40, color: MUTED }}>Aucune offre trouvée</div>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {offresFiltrees.map(o => {
                  const sc  = scoreCouleur(o.score)
                  const col = avatarColor(o.entreprise.nom)
                  return (
                    <div key={o.id} style={{ ...cardSt, display: 'flex', gap: 14, alignItems: 'center' }}>
                      <div style={{ width: 46, height: 46, borderRadius: 12, background: col, display: 'flex', alignItems: 'center', justifyContent: 'center', color: WHITE, fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                        {initiales(o.entreprise.nom, o.entreprise.prenom)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: NAVY }}>{o.titre}</span>
                          {o.recommande && <span style={{ background: '#fef3c7', color: '#d97706', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20 }}>⭐ Recommandé</span>}
                        </div>
                        <div style={{ fontSize: 12, color: MUTED }}>{o.entreprise.nom} · {o.localisation} · {o.duree}</div>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 6 }}>
                          {o.tags.map(t => <span key={t} style={{ fontSize: 11, background: '#f4f7fc', color: MUTED, padding: '2px 8px', borderRadius: 20 }}>{t}</span>)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 18, fontWeight: 800, color: sc.color }}>{o.score}%</span>
                          <span style={{ fontSize: 12, color: sc.color }}>{sc.label}</span>
                        </div>
                        {o.dejaPostule
                          ? <span style={{ background: '#dcfce7', color: '#15803d', fontSize: 11, padding: '5px 12px', borderRadius: 7, fontWeight: 700 }}>✓ Postulé</span>
                          : <button onClick={() => setOffreSelect(o)} style={{ background: BLUE, color: WHITE, border: 'none', borderRadius: 8, padding: '7px 18px', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}>Postuler</button>}
                      </div>
                    </div>
                  )
                })}
              </div>}
      </div>
    </>
  )

  // ── CANDIDATURES ─────────────────────────────────────────
  const renderCandidatures = () => (
    <>
      {topbar}
      <div style={{ padding: '24px 24px 40px' }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 800, color: NAVY }}>Mes candidatures</h2>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {([['tous',`Toutes (${candidatures.length})`],['EN_ATTENTE',`En cours (${candidatures.filter(c=>c.statut==='EN_ATTENTE').length})`],['ACCEPTEE',`Acceptées (${candidatures.filter(c=>c.statut==='ACCEPTEE').length})`],['REFUSEE',`Refusées (${candidatures.filter(c=>c.statut==='REFUSEE').length})`]] as [string,string][]).map(([v,l]) => (
            <button key={v} onClick={() => setFiltreCandidature(v as 'tous'|'EN_ATTENTE'|'ACCEPTEE'|'REFUSEE')}
              style={{ padding: '7px 18px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: filtreCandidature === v ? 700 : 400, background: filtreCandidature === v ? NAVY : WHITE, color: filtreCandidature === v ? WHITE : MUTED, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
              {l}
            </button>
          ))}
        </div>
        {chgtCandid
          ? <div style={{ ...cardSt, textAlign: 'center', padding: 40, color: MUTED }}>Chargement...</div>
          : candidFiltrees.length === 0
            ? <div style={{ ...cardSt, textAlign: 'center', padding: 50 }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>📋</div>
                <div style={{ fontWeight: 700, color: NAVY, marginBottom: 10 }}>Aucune candidature</div>
                <button onClick={() => nav('offres')} style={{ background: BLUE, color: WHITE, border: 'none', borderRadius: 9, padding: '9px 22px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>Voir les offres</button>
              </div>
            : <div style={{ background: WHITE, borderRadius: 14, border: '1px solid #eef2fa', overflow: 'hidden', boxShadow: '0 2px 10px rgba(30,70,150,0.07)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr', padding: '11px 20px', background: '#f8fafd', borderBottom: '1px solid #eef2fa' }}>
                  {['Offre','Entreprise','Date','Statut'].map(h => <div key={h} style={{ fontSize: 12, fontWeight: 600, color: MUTED }}>{h}</div>)}
                </div>
                {candidFiltrees.map(c => {
                  const s = statutCouleur(c.statut)
                  return (
                    <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr', padding: '13px 20px', borderBottom: '1px solid #f9fafb', alignItems: 'center' }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: NAVY }}>{c.offre.titre}</div>
                      <div style={{ fontSize: 12, color: MUTED }}>{c.offre.entreprise.nom}</div>
                      <div style={{ fontSize: 12, color: MUTED }}>{fmtDate(c.createdAt)}</div>
                      <span style={{ background: s.bg, color: s.color, padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, display: 'inline-block' }}>{s.label}</span>
                    </div>
                  )
                })}
              </div>}
      </div>
    </>
  )

  // ── JOURNAL DE BORD ──────────────────────────────────────
  const renderJournal = () => {
    const convValidee = conventions.find(c => c.statut === 'VALIDEE')
    const stageId = convValidee?.stage?.id
    return (
      <>
        {topbar}
        <div style={{ padding: '24px' }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 800, color: NAVY }}>Journal de bord</h2>
          {!stageId
            ? <div style={{ ...cardSt, textAlign: 'center', padding: 60, color: MUTED }}>📓 Ce module s&apos;active une fois votre stage démarré.</div>
            : <JournalVue stageId={stageId} token={localStorage.getItem('token') ?? ''} />
          }
        </div>
      </>
    )
  }

  // ── CONVENTION DE STAGE ───────────────────────────────────
  const chargerConvDetail = async (id: number) => {
    setChgtConvDetail(true)
    setMsgSigner('')
    try {
      const tok = tokenRef.current
      const r = await fetch(`/api/conventions/${id}`, { headers: { Authorization: `Bearer ${tok}` } })
      const d = await r.json()
      if (r.ok) {
        const conv = d.data
        setConvDetail(conv)
        } 
    } finally { setChgtConvDetail(false) }
  }

  const signerConvention = async () => {
    if (!convDetail) return
    setSignerEnCours(true); setMsgSigner('')
    try {
      const tok = tokenRef.current
      const r = await fetch(`/api/conventions/${convDetail.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` },
        body: JSON.stringify({ action: 'SIGNER' }),
      })
      const d = await r.json()
      if (r.ok) {
        setMsgSigner('Convention signée avec succès !')
        await chargerConvDetail(convDetail.id)
        await loadConventions(tok)
      } else {
        setMsgSigner(d.message || 'Erreur lors de la signature')
      }
    } finally { setSignerEnCours(false) }
  }

  const renderConvention = () => {
    const ETAPES = [
      { key: 'ETAPE_ETUDIANT',   label: 'Signature étudiant',   sub: 'Votre signature en cours' },
      { key: 'ETAPE_ENTREPRISE', label: 'Signature entreprise',  sub: "En attente de l'entreprise" },
      { key: 'ETAPE_ADMIN',      label: 'Validation admin',      sub: "Validation par l'établissement" },
      { key: 'VALIDEE',          label: 'Convention active',     sub: 'Téléchargement du document' },
    ]
    const ORDRE = ['ETAPE_ETUDIANT','ETAPE_ENTREPRISE','ETAPE_ADMIN','VALIDEE']
    const statutColors: Record<string, { color: string; bg: string; label: string }> = {
      ETAPE_ETUDIANT:   { color: '#d97706', bg: '#fef3c7', label: 'En attente de votre signature' },
      ETAPE_ENTREPRISE: { color: '#7c3aed', bg: '#f3e8ff', label: 'En attente entreprise' },
      ETAPE_ADMIN:      { color: '#1d6fe8', bg: '#e8f0fe', label: 'En attente admin' },
      VALIDEE:          { color: '#15803d', bg: '#dcfce7', label: 'Convention validée' },
      REJETEE:          { color: '#dc2626', bg: '#fee2e2', label: 'Convention rejetée' },
    }

    // Vue détail convention
    if (convDetail) {
      const st = statutColors[convDetail.statut] ?? { color: MUTED, bg: '#f4f7fc', label: convDetail.statut }
      const _etapeIdx = ORDRE.indexOf(convDetail.statut === 'REJETEE' ? 'REJETEE' : convDetail.statut)
      const avancement = convDetail.statut === 'VALIDEE' ? 100 : convDetail.statut === 'ETAPE_ADMIN' ? 75 : convDetail.statut === 'ETAPE_ENTREPRISE' ? 50 : convDetail.statut === 'REJETEE' ? 0 : 25
      const offre = convDetail.stage?.candidature?.offre
      const entreprise = offre?.entreprise
      const encadreur = convDetail.stage?.encadreur

      return (
        <>
          {topbar}
          {/* Bandeau hero convention */}
          <div style={{ margin: '0', background: 'linear-gradient(135deg, #0b2f7a 0%, #1d6fe8 100%)', padding: '22px 28px', display: 'flex', alignItems: 'center', gap: 18, position: 'relative', overflow: 'hidden' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="26" height="26" fill="none" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={WHITE} strokeWidth="2"/><polyline points="14,2 14,8 20,8" stroke={WHITE} strokeWidth="2"/><path d="M9 14l2 2 4-4" stroke={WHITE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <button onClick={() => { setConvDetail(null); setMsgSigner('') }} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: WHITE, borderRadius: 7, padding: '4px 12px', fontSize: 12, cursor: 'pointer', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                Retour
              </button>
              <div style={{ fontSize: 20, fontWeight: 800, color: WHITE }}>{offre?.titre ?? 'Convention de stage'}</div>
            </div>
            <span style={{ marginLeft: 'auto', background: st.bg, color: st.color, padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{st.label}</span>
            {/* Décoratif */}
            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 200, background: 'rgba(255,255,255,0.04)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontFamily: "'Segoe Script','Brush Script MT',cursive", fontSize: 15, color: 'rgba(255,255,255,0.25)', transform: 'rotate(-8deg)', textAlign: 'center', lineHeight: 1.6 }}>Une étape importante<br />vers votre avenir professionnel !</div>
            </div>
          </div>

          <div style={{ padding: '24px 24px 40px' }}>
            {chgtConvDetail
              ? <div style={{ ...cardSt, textAlign: 'center', padding: 60, color: MUTED }}>Chargement...</div>
              : (
              <>
                {/* Progression */}
                <div style={{ ...cardSt, marginBottom: 20, padding: '20px 28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                    {/* Ligne de fond */}
                    <div style={{ position: 'absolute', top: 16, left: 20, right: 20, height: 3, background: '#eef2fa', zIndex: 0 }} />
                    <div style={{ position: 'absolute', top: 16, left: 20, height: 3, width: `${avancement}%`, background: '#1d6fe8', zIndex: 1, transition: 'width 0.5s ease', borderRadius: 2 }} />
                    {ETAPES.map((e, i) => {
                      const done = ORDRE.indexOf(convDetail.statut) > i || convDetail.statut === 'VALIDEE'
                      const active = ORDRE.indexOf(convDetail.statut) === i
                      return (
                        <div key={e.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 2, flex: 1 }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: done || active ? BLUE : '#eef2fa', border: `3px solid ${done || active ? BLUE : '#d1dae8'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: done || active ? WHITE : MUTED, fontWeight: 700, fontSize: 13, transition: 'all 0.3s' }}>
                            {done ? <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg> : i + 1}
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 12, fontWeight: done || active ? 700 : 400, color: done || active ? NAVY : MUTED }}>{e.label}</div>
                            {active && <div style={{ fontSize: 11, color: BLUE, marginTop: 2 }}>{e.sub}</div>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Corps principal : 3 colonnes */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 300px', gap: 18 }}>
                  {/* Col 1 : Document PDF */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ ...cardSt }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#e8f0fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={BLUE} strokeWidth="2"/><polyline points="14,2 14,8 20,8" stroke={BLUE} strokeWidth="2"/></svg>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 14, color: NAVY }}>Document de convention</span>
                      </div>
                      {/* Preview PDF simulé */}
                      <div style={{ background: '#f8fafd', border: '1px solid #eef2fa', borderRadius: 12, padding: '30px 20px', textAlign: 'center', minHeight: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
                        <div style={{ width: 60, height: 70, background: WHITE, border: '2px solid #eef2fa', borderRadius: 6, boxShadow: '0 4px 16px rgba(30,70,150,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                          <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#dc2626" strokeWidth="2"/><polyline points="14,2 14,8 20,8" stroke="#dc2626" strokeWidth="2"/><line x1="8" y1="13" x2="16" y2="13" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round"/><line x1="8" y1="17" x2="12" y2="17" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round"/></svg>
                          <span style={{ position: 'absolute', bottom: -1, right: -1, background: '#dc2626', color: WHITE, fontSize: 7, fontWeight: 800, padding: '1px 4px', borderRadius: 3 }}>PDF</span>
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: NAVY, marginBottom: 4 }}>Convention de stage</div>
                          <div style={{ fontSize: 12, color: MUTED }}>Entre l&apos;entreprise et l&apos;étudiant</div>
                        </div>
                        {convDetail.pdfUrl
                          ? (
                            <a href={convDetail.pdfUrl} target="_blank" rel="noreferrer"
                              style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#e8f0fe', color: BLUE, borderRadius: 9, padding: '8px 16px', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                              <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              Télécharger le PDF
                            </a>
                          )
                          : convDetail.statut === 'VALIDEE'
                            ? (
                              <a
                                href={`/api/pdf/convention/${convDetail.id}?token=${typeof window !== 'undefined' ? localStorage.getItem('token') ?? '' : ''}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#dcfce7', color: '#15803d', borderRadius: 9, padding: '8px 16px', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
                              >
                                <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                Télécharger le PDF
                              </a>
                            )
                            : (
                              <div style={{ fontSize: 12, color: MUTED, background: '#f4f7fc', borderRadius: 8, padding: '6px 14px' }}>
                                PDF non encore généré
                              </div>
                            )
                        }
                      </div>
                    </div>

                    {/* Signer la convention */}
                    {convDetail.statut === 'ETAPE_ETUDIANT' && (
                      <div style={{ ...cardSt, border: '2px solid #1d6fe8', padding: '20px 22px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                          <span style={{ fontSize: 20 }}>✍️</span>
                          <span style={{ fontWeight: 700, fontSize: 15, color: NAVY }}>Signer votre convention de stage</span>
                        </div>
                        <p style={{ margin: '0 0 16px', fontSize: 13, color: MUTED, lineHeight: 1.6 }}>
                          En cliquant sur « Signer », vous confirmez avoir pris connaissance des termes de votre convention et vous engagez à respecter les conditions définies. Elle sera ensuite transmise à l&apos;entreprise pour signature.
                        </p>
                        {msgSigner && (
                          <div style={{ padding: '9px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13, fontWeight: 600, background: msgSigner.includes('succès') ? '#dcfce7' : '#fee2e2', color: msgSigner.includes('succès') ? '#15803d' : '#dc2626' }}>
                            {msgSigner}
                          </div>
                        )}
                        <button onClick={signerConvention} disabled={signerEnCours} style={{ width: '100%', background: BLUE, color: WHITE, border: 'none', borderRadius: 10, padding: '13px 0', fontSize: 14, fontWeight: 700, cursor: signerEnCours ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: signerEnCours ? 0.7 : 1 }}>
                          <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                          {signerEnCours ? 'Signature en cours...' : 'Signer la convention'}
                        </button>
                      </div>
                    )}

                    {convDetail.statut === 'REJETEE' && convDetail.motifRejet && (
                      <div style={{ ...cardSt, background: '#fff5f5', border: '1px solid #fecaca' }}>
                        <div style={{ fontWeight: 700, color: '#dc2626', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2"/><line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2"/></svg>
                          Motif de rejet
                        </div>
                        <p style={{ margin: 0, fontSize: 13, color: '#7f1d1d' }}>{convDetail.motifRejet}</p>
                      </div>
                    )}

                    {/* Attestation de stage — visible quand l'entreprise a accordé l'attestation */}
                    {convDetail.stage?.evaluationEntreprise?.attestation && (
                      <div style={{ ...cardSt, border: '2px solid #15803d', background: '#f0fdf4', padding: '20px 22px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                          <span style={{ fontSize: 22 }}>🎓</span>
                          <span style={{ fontWeight: 700, fontSize: 15, color: '#15803d' }}>Attestation de stage</span>
                        </div>
                        <p style={{ margin: '0 0 16px', fontSize: 13, color: MUTED, lineHeight: 1.6 }}>
                          Votre stage est terminé et validé. Vous pouvez télécharger votre attestation officielle de stage.
                        </p>
                        <a
                          href={`/api/pdf/attestation/${convDetail.stage.id}?token=${typeof window !== 'undefined' ? localStorage.getItem('token') ?? '' : ''}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#15803d', color: WHITE, borderRadius: 10, padding: '12px 0', fontSize: 14, fontWeight: 700, textDecoration: 'none', width: '100%' }}
                        >
                          <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          Télécharger l&apos;attestation
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Col 2 : Détails */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ ...cardSt }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#e8f0fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke={BLUE} strokeWidth="2"/><line x1="12" y1="8" x2="12" y2="12" stroke={BLUE} strokeWidth="2"/><line x1="12" y1="16" x2="12.01" y2="16" stroke={BLUE} strokeWidth="2.5" strokeLinecap="round"/></svg>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 14, color: NAVY }}>Détails de la convention</span>
                      </div>
                      {[
                        { icon: '🏢', label: 'Entreprise', val: entreprise?.nom ?? '—' },
                        { icon: '💼', label: 'Offre de stage', val: offre?.titre ?? '—' },
                        { icon: '📍', label: 'Localisation', val: offre?.localisation ?? '—' },
                        { icon: '⏱️', label: 'Durée', val: offre?.duree ?? '—' },
                        { icon: '📅', label: 'Début', val: convDetail.stage?.dateDebut ? new Date(convDetail.stage.dateDebut).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—' },
                        { icon: '📅', label: 'Fin', val: convDetail.stage?.dateFin ? new Date(convDetail.stage.dateFin).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—' },
                        { icon: '✉️', label: 'Email entreprise', val: entreprise?.email ?? '—' },
                        { icon: '🏭', label: 'Secteur', val: entreprise?.secteur ?? '—' },
                      ].map(row => (
                        <div key={row.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: '1px solid #f4f7fc' }}>
                          <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>{row.icon}</span>
                          <span style={{ fontSize: 12, color: MUTED, width: 120, flexShrink: 0, paddingTop: 1 }}>{row.label}</span>
                          <span style={{ fontSize: 13, color: NAVY, fontWeight: 600, flex: 1 }}>{row.val}</span>
                        </div>
                      ))}
                    </div>

                    {/* Évaluation de l'encadreur */}
                    {convDetail.stage?.evaluation && (
                      <div style={{ ...cardSt, border: '1px solid #dcfce7', background: '#f0fdf4' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="#15803d" strokeWidth="2" strokeLinejoin="round"/></svg>
                          </div>
                          <span style={{ fontWeight: 700, fontSize: 14, color: '#15803d' }}>Évaluation de l&apos;encadreur</span>
                        </div>
                        {/* Note */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                          <span style={{ fontSize: 12, color: MUTED, width: 60, flexShrink: 0 }}>Note</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 28, fontWeight: 900, color: '#15803d' }}>{convDetail.stage.evaluation.note}</span>
                            <span style={{ fontSize: 14, color: MUTED, fontWeight: 600 }}>/20</span>
                          </div>
                          <div style={{ flex: 1, background: '#e2e8f0', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                            <div style={{ width: `${(convDetail.stage.evaluation.note / 20) * 100}%`, background: convDetail.stage.evaluation.note >= 14 ? '#15803d' : convDetail.stage.evaluation.note >= 10 ? '#d97706' : '#dc2626', height: '100%', borderRadius: 4 }} />
                          </div>
                        </div>
                        {/* Commentaire */}
                        {convDetail.stage.evaluation.commentaire && (
                          <div style={{ background: WHITE, border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px' }}>
                            <div style={{ fontSize: 11, color: '#15803d', fontWeight: 700, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Commentaire</div>
                            <p style={{ margin: 0, fontSize: 13, color: NAVY, lineHeight: 1.6 }}>{convDetail.stage.evaluation.commentaire}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Évaluation de l'entreprise */}
                    {convDetail.stage?.evaluationEntreprise && (
                      <div style={{ ...cardSt, border: '1px solid #e9d5ff', background: '#faf5ff' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#e9d5ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" stroke="#7c3aed" strokeWidth="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="#7c3aed" strokeWidth="2"/></svg>
                          </div>
                          <span style={{ fontWeight: 700, fontSize: 14, color: '#7c3aed' }}>Évaluation de l&apos;entreprise</span>
                        </div>
                        {/* Note */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                          <span style={{ fontSize: 12, color: MUTED, width: 60, flexShrink: 0 }}>Note</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 28, fontWeight: 900, color: '#7c3aed' }}>{convDetail.stage.evaluationEntreprise.note}</span>
                            <span style={{ fontSize: 14, color: MUTED, fontWeight: 600 }}>/20</span>
                          </div>
                          <div style={{ flex: 1, background: '#e2e8f0', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                            <div style={{ width: `${(convDetail.stage.evaluationEntreprise.note / 20) * 100}%`, background: convDetail.stage.evaluationEntreprise.note >= 14 ? '#7c3aed' : convDetail.stage.evaluationEntreprise.note >= 10 ? '#d97706' : '#dc2626', height: '100%', borderRadius: 4 }} />
                          </div>
                        </div>
                        {/* Commentaire */}
                        {convDetail.stage.evaluationEntreprise.commentaire && (
                          <div style={{ background: '#fff', border: '1px solid #ddd6fe', borderRadius: 8, padding: '10px 14px', marginBottom: 10 }}>
                            <div style={{ fontSize: 11, color: '#7c3aed', fontWeight: 700, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Commentaire</div>
                            <p style={{ margin: 0, fontSize: 13, color: NAVY, lineHeight: 1.6 }}>{convDetail.stage.evaluationEntreprise.commentaire}</p>
                          </div>
                        )}
                        {/* Attestation */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: convDetail.stage.evaluationEntreprise.attestation ? '#f0fdf4' : '#fef9c3', border: `1px solid ${convDetail.stage.evaluationEntreprise.attestation ? '#bbf7d0' : '#fde68a'}` }}>
                          <span style={{ fontSize: 16 }}>{convDetail.stage.evaluationEntreprise.attestation ? '✅' : '⏳'}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: convDetail.stage.evaluationEntreprise.attestation ? '#15803d' : '#92400e' }}>
                            {convDetail.stage.evaluationEntreprise.attestation ? 'Attestation de fin de stage accordée' : 'Attestation en attente'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Col 3 : Avancement + Documents */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* Avancement */}
                    <div style={{ ...cardSt }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#e8f0fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke={BLUE} strokeWidth="2"/><path d="M12 6v6l4 2" stroke={BLUE} strokeWidth="2" strokeLinecap="round"/></svg>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 14, color: NAVY }}>Avancement</span>
                      </div>
                      {/* Cercle avancement */}
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
                        <div style={{ position: 'relative', width: 90, height: 90 }}>
                          <svg width="90" height="90" viewBox="0 0 90 90">
                            <circle cx="45" cy="45" r="38" fill="none" stroke="#eef2fa" strokeWidth="8"/>
                            <circle cx="45" cy="45" r="38" fill="none" stroke={BLUE} strokeWidth="8"
                              strokeDasharray={`${2 * Math.PI * 38}`}
                              strokeDashoffset={`${2 * Math.PI * 38 * (1 - avancement / 100)}`}
                              strokeLinecap="round"
                              transform="rotate(-90 45 45)"
                            />
                          </svg>
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: 20, fontWeight: 800, color: NAVY }}>{avancement}%</span>
                          </div>
                        </div>
                      </div>
                      {/* Étapes */}
                      {[
                        { label: 'Convention générée', done: true },
                        { label: 'Signature étudiant', done: ['ETAPE_ENTREPRISE','ETAPE_ADMIN','VALIDEE'].includes(convDetail.statut), active: convDetail.statut === 'ETAPE_ETUDIANT' },
                        { label: 'Signature entreprise', done: ['ETAPE_ADMIN','VALIDEE'].includes(convDetail.statut), active: convDetail.statut === 'ETAPE_ENTREPRISE' },
                        { label: 'Validation admin', done: convDetail.statut === 'VALIDEE', active: convDetail.statut === 'ETAPE_ADMIN' },
                        { label: 'Convention active', done: convDetail.statut === 'VALIDEE' },
                      ].map(step => (
                        <div key={step.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0' }}>
                          <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, background: step.done ? '#dcfce7' : step.active ? '#e8f0fe' : '#f4f7fc', border: `2px solid ${step.done ? '#15803d' : step.active ? BLUE : '#d1dae8'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {step.done
                              ? <svg width="11" height="11" fill="none" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round"/></svg>
                              : step.active
                                ? <div style={{ width: 8, height: 8, borderRadius: '50%', background: BLUE }} />
                                : null
                            }
                          </div>
                          <span style={{ fontSize: 12, color: step.done ? '#15803d' : step.active ? NAVY : MUTED, fontWeight: step.active || step.done ? 600 : 400 }}>{step.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Encadreur */}
                    <div style={{ ...cardSt }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#e8f0fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={BLUE} strokeWidth="2"/><circle cx="12" cy="7" r="4" stroke={BLUE} strokeWidth="2"/></svg>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 14, color: NAVY }}>Encadreur pédagogique</span>
                      </div>
                      {encadreur
                        ? <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', color: WHITE, fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                              {initiales(encadreur.nom, encadreur.prenom)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 13, color: NAVY }}>{encadreur.prenom} {encadreur.nom}</div>
                              <div style={{ fontSize: 12, color: MUTED }}>{encadreur.email}</div>
                            </div>
                          </div>
                        : <div style={{ fontSize: 13, color: MUTED, fontStyle: 'italic' }}>Aucun encadreur assigné pour l&apos;instant</div>
                      }
                    </div>

                    {/* Besoin d'aide */}
                    <div style={{ ...cardSt, background: '#f8fafd', border: '1px solid #e8f0fe' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ color: WHITE, fontSize: 13, fontWeight: 800 }}>i</span>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 13, color: NAVY }}>Besoin d&apos;aide ?</span>
                      </div>
                      <p style={{ margin: '0 0 12px', fontSize: 12, color: MUTED, lineHeight: 1.5 }}>En cas de problème, contactez votre encadreur ou le service des stages de l&apos;IPD.</p>
                      <button onClick={() => nav('profil')} style={{ width: '100%', background: 'none', border: `1px solid ${BLUE}`, color: BLUE, borderRadius: 8, padding: '8px 0', fontSize: 12, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2"/><polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2"/></svg>
                        Contacter le service des stages
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
        </div>
        </>
      )
    }

    // Vue liste conventions
    return (
      <>
        {topbar}
        {/* Hero banner */}
        <div style={{ margin: '0', background: 'linear-gradient(135deg, #0b2f7a 0%, #1d6fe8 100%)', padding: '22px 28px', display: 'flex', alignItems: 'center', gap: 18, position: 'relative', overflow: 'hidden' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="26" height="26" fill="none" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4" stroke={WHITE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke={WHITE} strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: WHITE }}>Convention de stage</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 3 }}>Consultez, validez et signez votre convention de stage en ligne.</div>
          </div>
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontFamily: "'Segoe Script','Brush Script MT',cursive", fontSize: 15, color: 'rgba(255,255,255,0.25)', transform: 'rotate(-8deg)', textAlign: 'center', lineHeight: 1.6 }}>Une étape importante<br />vers votre avenir professionnel !</div>
          </div>
        </div>

        <div style={{ padding: '24px 24px 40px' }}>
          {chgtConvention
            ? <div style={{ ...cardSt, textAlign: 'center', padding: 60, color: MUTED }}>Chargement...</div>
            : conventions.length === 0
              ? <div style={{ ...cardSt, textAlign: 'center', padding: 60, color: MUTED }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
                  <div style={{ fontWeight: 700, color: NAVY, marginBottom: 6 }}>Aucune convention disponible</div>
                  <div style={{ fontSize: 13 }}>Votre convention apparaîtra ici une fois votre candidature acceptée par l&apos;entreprise.</div>
                </div>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {conventions.map((conv: Convention) => {
                    const st = statutColors[conv.statut] ?? { color: MUTED, bg: '#f4f7fc', label: conv.statut }
                    return (
                      <div key={conv.id} style={{ ...cardSt, display: 'flex', alignItems: 'center', gap: 18 }}>
                        <div style={{ width: 46, height: 46, borderRadius: 12, background: '#e8f0fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={BLUE} strokeWidth="2"/><polyline points="14,2 14,8 20,8" stroke={BLUE} strokeWidth="2"/></svg>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 15, color: NAVY, marginBottom: 4 }}>
                            {conv.stage?.candidature?.offre?.titre ?? 'Convention de stage'}
                          </div>
                          <div style={{ fontSize: 12, color: MUTED }}>
                            {conv.stage?.candidature?.offre?.entreprise?.nom ?? ''}
                          </div>
                        </div>
                        <span style={{ background: st.bg, color: st.color, padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                          {st.label}
                        </span>
                        <button
                          onClick={() => { chargerConvDetail(conv.id) }}
                          style={{ background: conv.statut === 'ETAPE_ETUDIANT' ? NAVY : 'none', border: conv.statut === 'ETAPE_ETUDIANT' ? 'none' : '1px solid #eef2fa', color: conv.statut === 'ETAPE_ETUDIANT' ? WHITE : NAVY, borderRadius: 9, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                          {conv.statut === 'ETAPE_ETUDIANT' ? 'Signer' : 'Voir'}
                        </button>
                      </div>
                    )
                  })}
                </div>}
        </div>
      </>
    )
  }

  // ── PROFIL ────────────────────────────────────────────────
  const compListe = profil?.competences ? profil.competences.split(',').map(c => c.trim()).filter(Boolean) : []
  const renderProfil = () => (
    <>
      {topbar}
      <div style={{ padding: '24px 24px 40px' }}>
        <h2 style={{ margin: '0 0 18px', fontSize: 22, fontWeight: 800, color: NAVY }}>Mon profil</h2>
        {msgProfil && <div style={{ background: '#dcfce7', color: '#15803d', borderRadius: 9, padding: '10px 16px', marginBottom: 14, fontSize: 13, fontWeight: 600 }}>✓ {msgProfil}</div>}
        {errProfil && <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 9, padding: '10px 16px', marginBottom: 14, fontSize: 13, fontWeight: 600 }}>✗ {errProfil}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
          <div style={{ ...cardSt, textAlign: 'center', padding: '32px 24px' }}>
            <div style={{ width: 86, height: 86, borderRadius: '50%', background: 'linear-gradient(135deg, #dce8fd, #c7d8fb)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 4px 16px rgba(29,111,232,0.15)' }}>
              <svg width="40" height="40" fill="none" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={BLUE} strokeWidth="1.8"/><circle cx="12" cy="7" r="4" stroke={BLUE} strokeWidth="1.8"/></svg>
            </div>
            <div style={{ fontWeight: 800, fontSize: 17, color: NAVY, marginBottom: 3 }}>{profil?.prenom} {profil?.nom}</div>
            <div style={{ fontSize: 12, color: MUTED, marginBottom: 18, background: '#f4f7fc', display: 'inline-block', padding: '3px 12px', borderRadius: 20 }}>Étudiant</div>
            <div style={{ textAlign: 'left', fontSize: 13, color: MUTED, marginBottom: 4 }}>
              {profil?.filiere   && <div style={{ marginBottom: 9, display: 'flex', alignItems: 'center', gap: 8 }}>🎓 <span style={{ color: NAVY, fontWeight: 500 }}>{profil.filiere}</span></div>}
              {profil?.classe    && <div style={{ marginBottom: 9, display: 'flex', alignItems: 'center', gap: 8 }}>📚 <span style={{ color: NAVY, fontWeight: 500 }}>{profil.classe}</span></div>}
              {profil?.email     && <div style={{ marginBottom: 9, display: 'flex', alignItems: 'center', gap: 8 }}>✉️ <span style={{ color: NAVY, fontWeight: 500 }}>{profil.email}</span></div>}
              {profil?.telephone && <div style={{ marginBottom: 9, display: 'flex', alignItems: 'center', gap: 8 }}>📞 <span style={{ color: NAVY, fontWeight: 500 }}>{profil.telephone}</span></div>}
            </div>
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #eef2fa' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                <span style={{ fontSize: 12, color: MUTED, fontWeight: 500 }}>Profil complété</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: BLUE }}>{completion}%</span>
              </div>
              <div style={{ height: 7, background: '#eef2fa', borderRadius: 4 }}>
                <div style={{ height: '100%', width: `${completion}%`, background: `linear-gradient(90deg, ${BLUE}, #5b9bff)`, borderRadius: 4, transition: 'width 0.5s ease' }} />
              </div>
              {completion < 100 && <div style={{ fontSize: 11, color: MUTED, marginTop: 7 }}>Complétez votre profil pour améliorer votre matching</div>}
            </div>
          </div>
          <div style={{ ...cardSt, padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid #eef2fa' }}>
              {([['infos','Informations'],['competences','Compétences'],['securite','Sécurité']] as [string,string][]).map(([id, l]) => (
                <button key={id} onClick={() => { setOnglet(id as 'infos'|'competences'|'securite'); setMsgProfil(''); setErrProfil('') }}
                  style={{ padding: '16px 28px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: onglet === id ? 700 : 400, color: onglet === id ? BLUE : MUTED, borderBottom: onglet === id ? `2px solid ${BLUE}` : '2px solid transparent', marginBottom: -1 }}>
                  {l}
                </button>
              ))}
            </div>
            <div style={{ padding: 32 }}>
              {onglet === 'infos' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: NAVY }}>Informations personnelles</div>
                    {!editInfos
                      ? <button onClick={() => setEditInfos(true)} style={{ border: `1px solid ${BLUE}`, background: 'none', color: BLUE, borderRadius: 8, padding: '5px 14px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>✏️ Modifier</button>
                      : <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => { setEditInfos(false); setErrProfil('') }} style={{ border: '1px solid #eef2fa', background: 'none', color: MUTED, borderRadius: 8, padding: '5px 12px', fontSize: 12, cursor: 'pointer' }}>Annuler</button>
                          <button onClick={saveInfos} disabled={saving} style={{ background: BLUE, color: WHITE, border: 'none', borderRadius: 8, padding: '5px 14px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>{saving ? '...' : '💾 Enregistrer'}</button>
                        </div>}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    {([['prenom','Prénom','text'],['nom','Nom','text'],['email','Email','email'],['telephone','Téléphone','tel'],['classe','Classe','text'],['filiere','Filière','text']] as [keyof typeof formInfos, string, string][]).map(([f, l, t]) => (
                      <div key={f}>
                        <label style={{ display: 'block', fontSize: 12, color: MUTED, marginBottom: 6, fontWeight: 600, letterSpacing: '0.02em' }}>{l}</label>
                        {editInfos
                          ? <input type={t} value={formInfos[f]} onChange={e => setFormInfos(p => ({ ...p, [f]: e.target.value }))} style={{ ...inputSt, padding: '11px 14px', fontSize: 14 }} />
                          : <div style={{ fontSize: 14, color: formInfos[f] ? NAVY : MUTED, padding: '10px 0', borderBottom: '1px solid #f4f7fc', fontWeight: formInfos[f] ? 500 : 400 }}>{formInfos[f] || '—'}</div>}
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #eef2fa' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: NAVY, marginBottom: 16 }}>Informations de stage</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                      {([
                        ['niveauEtudes','Niveau d\'études','text','Ex: Licence 3, DTS...'],
                        ['dateNaissance','Date de naissance','date',''],
                        ['disponibilite','Disponible à partir du','date',''],
                        ['dureeSouhaitee','Durée souhaitée','text','Ex: 2 mois, 3 mois...'],
                        ['domaineSouhaite','Domaine souhaité','text','Ex: Développement web, Data...'],
                        ['villeSouhaitee','Ville souhaitée','text','Ex: Dakar, Thiès...'],
                      ] as [keyof typeof formInfos, string, string, string][]).map(([f, l, t, ph]) => (
                        <div key={f}>
                          <label style={{ display: 'block', fontSize: 12, color: MUTED, marginBottom: 6, fontWeight: 600, letterSpacing: '0.02em' }}>{l}</label>
                          {editInfos
                            ? <input type={t} value={formInfos[f]} onChange={e => setFormInfos(p => ({ ...p, [f]: e.target.value }))} placeholder={ph} style={{ ...inputSt, padding: '11px 14px', fontSize: 14 }} />
                            : <div style={{ fontSize: 14, color: formInfos[f] ? NAVY : MUTED, padding: '10px 0', borderBottom: '1px solid #f4f7fc', fontWeight: formInfos[f] ? 500 : 400 }}>{formInfos[f] || '—'}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ marginTop: 20 }}>
                    <label style={{ display: 'block', fontSize: 12, color: MUTED, marginBottom: 6, fontWeight: 600 }}>
                      📄 Mon CV
                    </label>
                    {editInfos
                      ? <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: `2px dashed ${cvProfilFich ? '#22c55e' : '#cbd5e1'}`, borderRadius: 9, cursor: 'pointer', background: cvProfilFich ? '#f0fdf4' : '#f8fafc' }}>
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" style={{ color: cvProfilFich ? '#22c55e' : BLUE, flexShrink: 0 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.8"/><polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="1.8"/><line x1="12" y1="18" x2="12" y2="12" stroke="currentColor" strokeWidth="1.8"/><polyline points="9,15 12,12 15,15" stroke="currentColor" strokeWidth="1.8"/></svg>
                          <span style={{ fontSize: 12, color: cvProfilFich ? '#15803d' : MUTED }}>{cvProfilFich ? cvProfilFich.name : 'Sélectionner votre CV (PDF ou Word, max 5 Mo)'}</span>
                          <input type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={e => setCvProfilFich(e.target.files?.[0] || null)} />
                        </label>
                      : formInfos.cvUrl
                        ? <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <a href={formInfos.cvUrl} target="_blank" rel="noreferrer"
                              style={{ color: BLUE, fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#e8f0fe', borderRadius: 8 }}>
                              <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/><polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2"/></svg>
                              Voir mon CV
                            </a>
                          </div>
                        : <div style={{ fontSize: 14, color: MUTED, padding: '10px 0', borderBottom: '1px solid #f4f7fc' }}>— Aucun CV renseigné</div>}
                  </div>
                  <div style={{ marginTop: 20 }}>
                    <label style={{ display: 'block', fontSize: 12, color: MUTED, marginBottom: 6, fontWeight: 600 }}>
                      🖼️ Photo de profil
                    </label>
                    {editInfos
                      ? <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: `2px dashed ${photoProfilFich ? '#22c55e' : '#cbd5e1'}`, borderRadius: 9, cursor: 'pointer', background: photoProfilFich ? '#f0fdf4' : '#f8fafc' }}>
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" style={{ color: photoProfilFich ? '#22c55e' : BLUE, flexShrink: 0 }}><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.8"/><polyline points="21,15 16,10 5,21" stroke="currentColor" strokeWidth="1.8"/></svg>
                          <span style={{ fontSize: 12, color: photoProfilFich ? '#15803d' : MUTED }}>{photoProfilFich ? photoProfilFich.name : 'Sélectionner une photo (JPG, PNG, max 5 Mo)'}</span>
                          <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={e => setPhotoProfilFich(e.target.files?.[0] || null)} />
                        </label>
                      : formInfos.photoUrl
                        ? <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={formInfos.photoUrl} alt="Photo profil" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${BLUE}` }} />
                            <span style={{ fontSize: 13, color: MUTED }}>Photo enregistrée</span>
                          </div>
                        : <div style={{ fontSize: 14, color: MUTED, padding: '10px 0', borderBottom: '1px solid #f4f7fc' }}>— Aucune photo renseignée</div>}
                  </div>
                </div>
              )}
              {onglet === 'competences' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: NAVY }}>Mes compétences</div>
                    {!editComp
                      ? <button onClick={() => setEditComp(true)} style={{ border: `1px solid ${BLUE}`, background: 'none', color: BLUE, borderRadius: 8, padding: '5px 14px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>✏️ Modifier</button>
                      : <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => { setEditComp(false); setFormComp(profil?.competences || '') }} style={{ border: '1px solid #eef2fa', background: 'none', color: MUTED, borderRadius: 8, padding: '5px 12px', fontSize: 12, cursor: 'pointer' }}>Annuler</button>
                          <button onClick={saveComp} disabled={saving} style={{ background: BLUE, color: WHITE, border: 'none', borderRadius: 8, padding: '5px 14px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>{saving ? '...' : '💾 Enregistrer'}</button>
                        </div>}
                  </div>
                  {editComp
                    ? <textarea value={formComp} onChange={e => setFormComp(e.target.value)} placeholder="Ex: JavaScript, React, Python..." rows={4} style={{ ...inputSt, resize: 'vertical' }} />
                    : compListe.length === 0
                      ? <div style={{ textAlign: 'center', padding: 24, color: MUTED }}>🛠 Aucune compétence renseignée</div>
                      : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                          {compListe.map(c => <span key={c} style={{ background: '#e8f0fe', color: BLUE, padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>{c}</span>)}
                        </div>}
                </div>
              )}
              {onglet === 'securite' && (
                <div style={{ maxWidth: 400 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: NAVY, marginBottom: 18 }}>Changer le mot de passe</div>
                  {[['ancien','Mot de passe actuel'],['nouveau','Nouveau mot de passe'],['confirmation','Confirmer le nouveau']].map(([f, l]) => (
                    <div key={f} style={{ marginBottom: 14 }}>
                      <label style={{ display: 'block', fontSize: 12, color: MUTED, marginBottom: 4, fontWeight: 600 }}>{l}</label>
                      <input type="password" value={formMdp[f as keyof typeof formMdp]} onChange={e => setFormMdp(p => ({ ...p, [f]: e.target.value }))} style={inputSt} />
                    </div>
                  ))}
                  <button onClick={saveMdp} disabled={saving} style={{ background: NAVY, color: WHITE, border: 'none', borderRadius: 9, padding: '10px 24px', fontSize: 13, cursor: 'pointer', fontWeight: 700 }}>
                    {saving ? 'Enregistrement...' : 'Mettre à jour'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )

  // ── MODAL POSTULER ────────────────────────────────────────
  const modal = offreSelect && (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,47,122,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: WHITE, borderRadius: 16, padding: 28, width: 500, maxWidth: '92vw', boxShadow: '0 24px 60px rgba(11,47,122,0.18)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: NAVY }}>Postuler à l&apos;offre</div>
          <button onClick={() => { setOffreSelect(null); setMsgPost('') }} style={{ background: '#f4f7fc', border: 'none', width: 30, height: 30, borderRadius: '50%', fontSize: 14, cursor: 'pointer', color: MUTED, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        <div style={{ background: '#f8fafd', borderRadius: 10, padding: '12px 16px', marginBottom: 20, border: '1px solid #eef2fa' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: NAVY }}>{offreSelect.titre}</div>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 3 }}>{offreSelect.entreprise.nom} · {offreSelect.localisation} · {offreSelect.duree}</div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12, color: MUTED, marginBottom: 5, fontWeight: 600 }}>CV (PDF ou Word) *</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: `2px dashed ${cvFichier ? '#22c55e' : '#cbd5e1'}`, borderRadius: 9, cursor: 'pointer', background: cvFichier ? '#f0fdf4' : '#f8fafc' }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" style={{ color: cvFichier ? '#22c55e' : BLUE, flexShrink: 0 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.8"/><polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="1.8"/><line x1="12" y1="18" x2="12" y2="12" stroke="currentColor" strokeWidth="1.8"/><polyline points="9,15 12,12 15,15" stroke="currentColor" strokeWidth="1.8"/></svg>
            <span style={{ fontSize: 12, color: cvFichier ? '#15803d' : MUTED }}>{cvFichier ? cvFichier.name : 'Sélectionner votre CV (max 5 Mo)'}</span>
            <input type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={e => setCvFichier(e.target.files?.[0] || null)} />
          </label>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, color: MUTED, marginBottom: 5, fontWeight: 600 }}>Lettre de motivation (optionnel)</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: `2px dashed ${lettreFich ? '#22c55e' : '#cbd5e1'}`, borderRadius: 9, cursor: 'pointer', background: lettreFich ? '#f0fdf4' : '#f8fafc' }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" style={{ color: lettreFich ? '#22c55e' : BLUE, flexShrink: 0 }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.8"/></svg>
            <span style={{ fontSize: 12, color: lettreFich ? '#15803d' : MUTED }}>{lettreFich ? lettreFich.name : 'Sélectionner votre lettre (max 5 Mo)'}</span>
            <input type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={e => setLettreFich(e.target.files?.[0] || null)} />
          </label>
        </div>
        {msgPost && <div style={{ padding: '9px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13, fontWeight: 600, background: msgPost.includes('!') ? '#dcfce7' : '#fee2e2', color: msgPost.includes('!') ? '#15803d' : '#dc2626' }}>{msgPost}</div>}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => { setOffreSelect(null); setMsgPost('') }} style={{ flex: 1, background: 'none', border: '1px solid #eef2fa', color: MUTED, borderRadius: 9, padding: '10px 0', fontSize: 13, cursor: 'pointer' }}>Annuler</button>
          <button onClick={postuler} disabled={envoi} style={{ flex: 2, background: BLUE, color: WHITE, border: 'none', borderRadius: 9, padding: '10px 0', fontSize: 13, cursor: 'pointer', fontWeight: 700 }}>
            {envoi ? 'Envoi...' : 'Envoyer ma candidature'}
          </button>
        </div>
      </div>
    </div>
  )

  // ── RENDU ─────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', minHeight: hauteurPage, fontFamily: "'Inter', system-ui, sans-serif", background: BG, zoom: echelle } as React.CSSProperties & { zoom?: number }}>
      {sidebar}
      <main style={{ flex: 1, minHeight: hauteurPage, overflow: 'auto' }}>
        {vue === 'tableau'         && renderTableau()}
        {vue === 'offres'          && renderOffres()}
        {vue === 'candidatures'    && renderCandidatures()}
        {vue === 'notifications'   && renderNotifications()}
        {vue === 'journal'         && renderJournal()}
        {vue === 'convention'      && renderConvention()}
        {vue === 'profil'          && renderProfil()}
      </main>
      {modal}
    </div>
  )
}
function JournalVue({ stageId, token }: { stageId: number; token: string }) {
  const [journaux, setJournaux] = useState<{ id: number; semaine: number; contenu: string; statut: string; commentaire: string | null; dateDepot: string; alerte: boolean }[]>([])
  const [semaine, setSemaine] = useState(1)
  const [contenu, setContenu] = useState('')
  const [alerte, setAlerte] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [msg, setMsg] = useState('')

  const recharger = () => {
    fetch(`/api/journal?stageId=${stageId}`, { headers: { authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(d => setJournaux(d))
  }

  useEffect(() => { recharger() }, [stageId, token]) // eslint-disable-line react-hooks/exhaustive-deps

  const soumettre = async () => {
    if (!contenu.trim()) { setMsg('Le contenu est requis'); return }
    setEnvoi(true); setMsg('')
    try {
      const r = await fetch('/api/journal', {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ stageId, semaine, contenu, alerte }),
      })
      if (r.ok) {
        setMsg('✔ Rapport soumis !')
        setContenu('')
        setAlerte(false)
        fetch(`/api/journal?stageId=${stageId}`, { headers: { authorization: `Bearer ${token}` } })
          .then(res => res.ok ? res.json() : [])
          .then(d => setJournaux(d))
      } else { const d = await r.json(); setMsg(d.error || 'Erreur') }
    } finally { setEnvoi(false) }
  }

  const badge = (s: string) => {
    if (s === 'VALIDE') return { label: 'Validé',     bg: '#dcfce7', color: '#15803d' }
    if (s === 'REJETE') return { label: 'Rejeté',     bg: '#fee2e2', color: '#b91c1c' }
    if (s === 'SOUMIS') return { label: 'Soumis',     bg: '#dbeafe', color: '#1d4ed8' }
    return              { label: 'En attente', bg: '#fef9c3', color: '#a16207' }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #eef2fa', padding: 24 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#0b2f7a' }}>Soumettre un rapport</h3>
        <div style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'center' }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#6b7a99' }}>Semaine :</label>
          <input type="number" min={1} max={52} value={semaine}
            onChange={e => setSemaine(Number(e.target.value))}
            style={{ width: 70, padding: '8px 10px', border: '1px solid #d1d9f0', borderRadius: 8, fontSize: 13, outline: 'none' }} />
        </div>
        <textarea value={contenu} onChange={e => setContenu(e.target.value)}
          placeholder="Décrivez vos activités de la semaine…"
          rows={5}
          style={{ width: '100%', padding: '12px 14px', border: '1px solid #d1d9f0', borderRadius: 10, fontSize: 13, resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: alerte ? '#b91c1c' : '#6b7a99' }}>
          <input type="checkbox" checked={alerte} onChange={e => setAlerte(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: '#b91c1c', cursor: 'pointer' }} />
          🚨 Signaler une alerte (problème en entreprise, absence, incident…)
        </label>
        {msg && <p style={{ margin: '8px 0 0', fontSize: 13, fontWeight: 600, color: msg.startsWith('✔') ? '#15803d' : '#b91c1c' }}>{msg}</p>}
        <button onClick={soumettre} disabled={envoi}
          style={{ marginTop: 14, padding: '10px 28px', background: '#1d6fe8', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: envoi ? 'not-allowed' : 'pointer', opacity: envoi ? 0.7 : 1 }}>
          {envoi ? 'Envoi…' : 'Soumettre le rapport'}
        </button>
      </div>
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #eef2fa', overflow: 'hidden' }}>
        <div style={{ padding: '16px 22px', borderBottom: '1px solid #f0f4fb' }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0b2f7a' }}>Historique des rapports</h3>
        </div>
        {journaux.length === 0
          ? <p style={{ textAlign: 'center', padding: 40, color: '#6b7a99' }}>Aucun rapport soumis.</p>
          : journaux.map(j => {
            const b = badge(j.statut)
            return (
              <div key={j.id} style={{ padding: '16px 22px', borderBottom: '1px solid #f0f4fb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, color: '#0b2f7a' }}>Semaine {j.semaine}</span>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: b.bg, color: b.color }}>{b.label}</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{j.contenu}</p>
                {j.commentaire && (
                  <div style={{ marginTop: 10, padding: '10px 14px', background: '#f8faff', borderRadius: 8, fontSize: 12, color: '#6b7a99' }}>
                    💬 <strong>Commentaire encadreur :</strong> {j.commentaire}
                  </div>
                )}
                <p style={{ margin: '8px 0 0', fontSize: 11, color: '#9ca3af' }}>
                  Déposé le {new Date(j.dateDepot).toLocaleDateString('fr-FR')}
                </p>
              </div>
            )
          })
        }
      </div>
    </div>
  )
}