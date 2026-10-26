'use client'

import {
  useState, useEffect, useRef, useSyncExternalStore,
  type ReactNode, type CSSProperties,
} from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

type Vue = 'tableau' | 'etudiants' | 'suivi' | 'evaluations' | 'messages' | 'parametres'

interface Stagiaire {
  id: number; nom: string; prenom: string; email: string;
  telephone: string | null; classe: string | null; filiere: string | null;
  convention: {
    id: number; statut: string;
    entreprise: { nom: string } | null;
    offre: { titre: string; duree: string } | null;
    debutStage: string | null; finStage: string | null;
  } | null
}

interface Journal {
  id: number; semaine: number; contenu: string; statut: string;
  commentaire: string | null; createdAt: string;
  etudiant: { nom: string; prenom: string; email: string }
}

interface Stats {
  totalStagiaires: number; journauxEnAttente: number;
  journauxValides: number; journauxRejetes: number;
}

interface Evaluation {
  id: number; stageId: number; note: number; commentaire: string;
  createdAt: string; updatedAt: string;
}

interface Message {
  id: number; expediteurId: number; destinataireId: number;
  contenu: string; lu: boolean; createdAt: string;
  expediteur: { nom: string; prenom: string; role: string };
}

const LARGEUR_MAQUETTE = 1672
const abonnerRedimension = (rappel: () => void) => {
  window.addEventListener('resize', rappel)
  return () => window.removeEventListener('resize', rappel)
}
const lireLargeur = () => window.innerWidth
const largeurServeur = () => LARGEUR_MAQUETTE

const ICONS = {
  home: <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/>,
  users: (<><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14c2.8 0 4.5 2 4.5 5"/></>),
  monitor: (<><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></>),
  star: <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>,
  message: (<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>),
  settings: (<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>),
  logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>,
  search: (<><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></>),
  bell: (<><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>),
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6"/>,
  chevronRight: <path d="M9 18l6-6-6-6"/>,
  eye: (<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>),
  mapPin: (<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>),
  school: (<><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></>),
  calendar: (<><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>),
  user: (<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>),
  doc: (<><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></>),
  clock: (<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></>),
  check: (<><circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/></>),
  x: (<><circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/></>),
  list: (<><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>),
} satisfies Record<string, ReactNode>

type IconName = keyof typeof ICONS

function Icon({ name, size = 22, sw = 1.8 }: { name: IconName; size?: number; sw?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none"
      stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" style={{ flexShrink: 0 }}>
      {ICONS[name]}
    </svg>
  )
}

const NAVY = '#0b2f7a'
const BLUE = '#1d6fe8'
const MUTED = '#6b7a99'

const CARTE: CSSProperties = {
  background: '#fff', borderRadius: 14,
  border: '1px solid #eef2fa', boxShadow: '0 2px 10px rgba(30, 70, 150, 0.06)',
}

const NAV: { id: Vue; label: string; icon: IconName }[] = [
  { id: 'tableau',     label: 'Tableau de bord',  icon: 'home'     },
  { id: 'etudiants',  label: 'Mes étudiants',    icon: 'users'    },
  { id: 'suivi',      label: 'Suivi des stages',  icon: 'monitor'  },
  { id: 'evaluations',label: 'Évaluations',       icon: 'star'     },
  { id: 'messages',   label: 'Messages',          icon: 'message'  },
  { id: 'parametres', label: 'Paramètres',        icon: 'settings' },
]

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

function avatarInitiales(prenom: string, nom: string) {
  return `${prenom[0]??''}${nom[0]??''}`.toUpperCase()
}

const COULEURS_AVATAR = ['#3b82f6','#8b5cf6','#f59e0b','#ef4444','#10b981','#f97316','#06b6d4','#ec4899']
function couleurAvatar(nom: string) {
  let h = 0; for (let i=0; i<nom.length; i++) h = (h*31 + nom.charCodeAt(i)) & 0xffffffff
  return COULEURS_AVATAR[Math.abs(h) % COULEURS_AVATAR.length]
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function statutStageBadge(statut: string): { label: string; fond: string; texte: string } {
  if (statut === 'EN_COURS')  return { label: 'En cours',  fond: '#dbeafe', texte: '#1d4ed8' }
  if (statut === 'TERMINE')   return { label: 'Terminé',   fond: '#f1f5f9', texte: '#64748b' }
  if (statut === 'A_EVALUER') return { label: 'À évaluer', fond: '#fef9c3', texte: '#a16207' }
  return { label: statut, fond: '#f1f5f9', texte: MUTED }
}

function etoiles(note: number, max=5) {
  return Array.from({ length: max }, (_, i) => (
    <svg key={i} viewBox="0 0 24 24" width={16} height={16} fill={i < note ? '#f59e0b' : 'none'}
      stroke="#f59e0b" strokeWidth={1.8} style={{ flexShrink:0 }}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  ))
}

// ══════════════════════════════════════════════════════
// COMPOSANT : Carte d'évaluation d'un stagiaire
// ══════════════════════════════════════════════════════
function EvaluationCard({ stagiaire, token }: { stagiaire: Stagiaire; token: string }) {
  const NAVY = '#0b2f7a', BLUE = '#1d6fe8', MUTED = '#6b7a99'
  const CARTE: CSSProperties = { background:'#fff', borderRadius:14, border:'1px solid #eef2fa', boxShadow:'0 2px 10px rgba(30,70,150,0.06)' }

  const [note, setNote] = useState(0)
  const [survol, setSurvol] = useState(0)
  const [commentaire, setCommentaire] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [message, setMessage] = useState('')
  const [evalExistante, setEvalExistante] = useState<Evaluation | null>(null)

  useEffect(() => {
    // Charger évaluation existante
    fetch(`/api/encadreur/evaluations?stagiaireId=${stagiaire.id}`, {
      headers: { authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(d => {
      if (d.evaluation) {
        setEvalExistante(d.evaluation)
        setNote(d.evaluation.note)
        setCommentaire(d.evaluation.commentaire || '')
      }
    }).catch(() => {})
  }, [stagiaire.id, token])

  const sauvegarder = async () => {
    if (note === 0) { setMessage('⚠ Veuillez sélectionner une note'); return }
    setEnCours(true); setMessage('')
    try {
      const res = await fetch('/api/encadreur/evaluations', {
        method: evalExistante ? 'PUT' : 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ stagiaireId: stagiaire.id, note, commentaire }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage(`✓ Évaluation ${evalExistante ? 'mise à jour' : 'enregistrée'}`)
        setEvalExistante(data.evaluation)
      } else {
        setMessage(data.message || 'Erreur lors de la sauvegarde')
      }
    } catch { setMessage('Erreur serveur') }
    finally { setEnCours(false) }
  }

  const couleur = couleurAvatar(stagiaire.nom)
  const labels = ['','Insuffisant','Passable','Bien','Très bien','Excellent']

  return (
    <div style={{ ...CARTE, padding:'24px 28px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20 }}>
        <div style={{ width:48, height:48, borderRadius:'50%', background:couleur, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:16, flexShrink:0 }}>
          {avatarInitiales(stagiaire.prenom, stagiaire.nom)}
        </div>
        <div style={{ flex:1 }}>
          <p style={{ margin:0, fontWeight:700, fontSize:15, color:NAVY }}>{stagiaire.prenom} {stagiaire.nom}</p>
          <p style={{ margin:'2px 0 0', fontSize:12, color:MUTED }}>{stagiaire.filiere} · {stagiaire.classe} · {stagiaire.convention?.offre?.titre ?? 'Stage'}</p>
        </div>
        {evalExistante && (
          <span style={{ padding:'4px 12px', borderRadius:20, background:'#dcfce7', color:'#15803d', fontSize:12, fontWeight:600 }}>Évalué</span>
        )}
      </div>

      {/* Étoiles */}
      <div style={{ marginBottom:16 }}>
        <p style={{ margin:'0 0 10px', fontSize:13, fontWeight:600, color:NAVY }}>Note globale</p>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {[1,2,3,4,5].map(i => (
            <svg key={i} viewBox="0 0 24 24" width={32} height={32}
              fill={(survol || note) >= i ? '#f59e0b' : 'none'}
              stroke="#f59e0b" strokeWidth={1.5}
              style={{ cursor:'pointer', transition:'transform .15s', transform:(survol||note)>=i?'scale(1.15)':'scale(1)' }}
              onMouseEnter={()=>setSurvol(i)} onMouseLeave={()=>setSurvol(0)}
              onClick={()=>setNote(i)}>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          ))}
          {(survol || note) > 0 && (
            <span style={{ fontSize:13, color:MUTED, marginLeft:8 }}>{labels[survol || note]}</span>
          )}
        </div>
      </div>

      {/* Critères rapides */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
        {['Ponctualité','Travail en équipe','Compétences techniques'].map(critere => (
          <div key={critere} style={{ background:'#f8faff', borderRadius:8, padding:'10px 12px', textAlign:'center' }}>
            <p style={{ margin:'0 0 6px', fontSize:11, color:MUTED }}>{critere}</p>
            <div style={{ display:'flex', justifyContent:'center', gap:3 }}>
              {[1,2,3,4,5].map(i => (
                <svg key={i} viewBox="0 0 24 24" width={14} height={14}
                  fill={i<=note?'#f59e0b':'none'} stroke="#f59e0b" strokeWidth={2}>
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Commentaire */}
      <div style={{ marginBottom:16 }}>
        <label style={{ display:'block', fontSize:12, fontWeight:600, color:MUTED, marginBottom:6 }}>Commentaire / Appréciation</label>
        <textarea value={commentaire} onChange={e=>setCommentaire(e.target.value)}
          placeholder="Décrivez les points forts et axes d'amélioration du stagiaire…"
          rows={3}
          style={{ width:'100%', padding:'10px 12px', border:'1px solid #d1d9f0', borderRadius:8, fontSize:13, color:NAVY, resize:'vertical', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }}/>
      </div>

      {message && <p style={{ margin:'0 0 10px', fontSize:13, fontWeight:600, color: message.startsWith('✓')?'#15803d':'#b45309' }}>{message}</p>}

      <button onClick={sauvegarder} disabled={enCours}
        style={{ padding:'10px 24px', background:BLUE, color:'#fff', border:'none', borderRadius:10, fontWeight:600, fontSize:14, cursor:enCours?'not-allowed':'pointer', opacity:enCours?0.7:1 }}>
        {enCours ? 'Sauvegarde…' : evalExistante ? 'Mettre à jour' : 'Enregistrer l\'évaluation'}
      </button>
    </div>
  )
}

// ══════════════════════════════════════════════════════
// COMPOSANT : Vue Messages
// ══════════════════════════════════════════════════════
function MessagesVue({ stagiaires, token }: {
  stagiaires: Stagiaire[]
  token: string
}) {
  const NAVY = '#0b2f7a', BLUE = '#1d6fe8', MUTED = '#6b7a99'
  const CARTE: CSSProperties = { background:'#fff', borderRadius:14, border:'1px solid #eef2fa', boxShadow:'0 2px 10px rgba(30,70,150,0.06)' }

  const [destinataireId, setDestinataireId] = useState<number | null>(
    stagiaires.length > 0 ? stagiaires[0].id : null
  )
  const [messages, setMessages] = useState<Message[]>([])
  const [nouveauMsg, setNouveauMsg] = useState('')
  const [chargement, setChargement] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const destinataire = stagiaires.find(s => s.id === destinataireId)

  const chargerMessages = async () => {
    if (!destinataireId) return
    setChargement(true)
    try {
      const res = await fetch(`/api/encadreur/messages?avecId=${destinataireId}`, {
        headers: { authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages ?? [])
      }
    } catch { /* silencieux */ }
    finally { setChargement(false) }
  }

  useEffect(() => {
    if (!destinataireId) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void chargerMessages()
    const interval = setInterval(() => { void chargerMessages() }, 10000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destinataireId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [messages])

  const envoyer = async () => {
    if (!nouveauMsg.trim() || !destinataireId) return
    setEnvoi(true)
    try {
      const res = await fetch('/api/encadreur/messages', {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ destinataireId, contenu: nouveauMsg.trim() }),
      })
      if (res.ok) {
        setNouveauMsg('')
        chargerMessages()
      }
    } catch { /* silencieux */ }
    finally { setEnvoi(false) }
  }

  if (stagiaires.length === 0) {
    return (
      <div style={{ ...CARTE, padding:'60px 40px', textAlign:'center', color:MUTED }}>
        <Icon name="message" size={48}/>
        <p style={{ margin:'16px 0 0' }}>Aucun stagiaire disponible pour la messagerie</p>
      </div>
    )
  }

  return (
    <>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ margin:0, fontSize:22, fontWeight:800, color:NAVY }}>Messages</h1>
        <p style={{ margin:'4px 0 0', fontSize:15, color:'#2f55b0' }}>Échangez directement avec vos stagiaires</p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:16, height:560 }}>

        {/* Liste des contacts */}
        <div style={{ ...CARTE, overflow:'auto' }}>
          <p style={{ margin:0, padding:'14px 16px', fontSize:12, fontWeight:700, color:MUTED, borderBottom:'1px solid #eef2fa', textTransform:'uppercase', letterSpacing:.5 }}>Étudiants</p>
          {stagiaires.map(s => {
            const actif = s.id === destinataireId
            const couleur = couleurAvatar(s.nom)
            return (
              <div key={s.id} onClick={()=>setDestinataireId(s.id)}
                style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', cursor:'pointer', background:actif?'#eff6ff':'transparent', borderLeft:actif?`3px solid ${BLUE}`:'3px solid transparent', transition:'background .15s' }}>
                <div style={{ width:38, height:38, borderRadius:'50%', background:couleur, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:14, flexShrink:0 }}>
                  {avatarInitiales(s.prenom, s.nom)}
                </div>
                <div style={{ overflow:'hidden' }}>
                  <p style={{ margin:0, fontSize:13, fontWeight:actif?700:500, color:NAVY, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{s.prenom} {s.nom}</p>
                  <p style={{ margin:0, fontSize:11, color:MUTED }}>{s.filiere}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Zone de conversation */}
        <div style={{ ...CARTE, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          {/* Header */}
          {destinataire && (
            <div style={{ padding:'14px 20px', borderBottom:'1px solid #eef2fa', display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
              <div style={{ width:36, height:36, borderRadius:'50%', background:couleurAvatar(destinataire.nom), display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:13 }}>
                {avatarInitiales(destinataire.prenom, destinataire.nom)}
              </div>
              <div>
                <p style={{ margin:0, fontSize:14, fontWeight:700, color:NAVY }}>{destinataire.prenom} {destinataire.nom}</p>
                <p style={{ margin:0, fontSize:11, color:MUTED }}>{destinataire.convention?.offre?.titre ?? 'Stagiaire'} · {destinataire.convention?.entreprise?.nom}</p>
              </div>
            </div>
          )}

          {/* Messages */}
          <div style={{ flex:1, overflow:'auto', padding:'16px 20px', display:'flex', flexDirection:'column', gap:10 }}>
            {chargement && messages.length === 0 && (
              <p style={{ textAlign:'center', color:MUTED, fontSize:13 }}>Chargement…</p>
            )}
            {!chargement && messages.length === 0 && (
              <p style={{ textAlign:'center', color:MUTED, fontSize:13, margin:'auto' }}>Aucun message. Démarrez la conversation !</p>
            )}
            {messages.map(msg => {
              const estMoi = msg.expediteur.role === 'ENCADREUR'
              return (
                <div key={msg.id} style={{ display:'flex', justifyContent:estMoi?'flex-end':'flex-start' }}>
                  <div style={{
                    maxWidth:'70%', padding:'10px 14px', borderRadius: estMoi?'16px 16px 4px 16px':'16px 16px 16px 4px',
                    background: estMoi ? BLUE : '#f1f5f9',
                    color: estMoi ? '#fff' : NAVY,
                    fontSize:13, lineHeight:1.5,
                  }}>
                    <p style={{ margin:'0 0 4px' }}>{msg.contenu}</p>
                    <p style={{ margin:0, fontSize:10, opacity:0.7, textAlign:'right' }}>
                      {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })}
                      {estMoi && (msg.lu ? ' ✓✓' : ' ✓')}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef}/>
          </div>

          {/* Saisie */}
          <div style={{ padding:'12px 16px', borderTop:'1px solid #eef2fa', display:'flex', gap:10, flexShrink:0 }}>
            <input value={nouveauMsg} onChange={e=>setNouveauMsg(e.target.value)}
              onKeyDown={e=>{ if(e.key==='Enter' && !e.shiftKey) { e.preventDefault(); envoyer() } }}
              placeholder="Écrire un message… (Entrée pour envoyer)"
              style={{ flex:1, padding:'10px 14px', border:'1px solid #d1d9f0', borderRadius:10, fontSize:13, color:NAVY, outline:'none', fontFamily:'inherit' }}/>
            <button onClick={envoyer} disabled={envoi || !nouveauMsg.trim()}
              style={{ padding:'10px 20px', background:BLUE, color:'#fff', border:'none', borderRadius:10, fontWeight:600, fontSize:13, cursor: envoi||!nouveauMsg.trim()?'not-allowed':'pointer', opacity: envoi||!nouveauMsg.trim()?0.6:1 }}>
              {envoi ? '…' : 'Envoyer'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default function EncadreurDashboard() {
  const router = useRouter()
  const [encadreur, setEncadreur] = useState<{ nom: string; prenom: string } | null>(null)
  const [vue, setVue] = useState<Vue>('tableau')
  const [stats, setStats] = useState<Stats | null>(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [stagiaires, setStagiaires] = useState<Stagiaire[]>([])
  const [stagiairesChargement, setStagiairesChargement] = useState(false)
  const [stagiaireSelectionne, setStagiaireSelectionne] = useState<Stagiaire | null>(null)
  const [journaux, setJournaux] = useState<Journal[]>([])
  const [journauxChargement, setJournauxChargement] = useState(false)
  const [journauxErreur, setJournauxErreur] = useState('')
  const [filtreJournal, setFiltreJournal] = useState<string>('TOUS')
  const [journalSelectionne, setJournalSelectionne] = useState<Journal | null>(null)
  const [actionEnCours, setActionEnCours] = useState<number | null>(null)
  const [commentaireTexte, setCommentaireTexte] = useState('')
  const [journauxRecents, setJournauxRecents] = useState<Journal[]>([])

  // ── Paramètres ──
  const [profilForm, setProfilForm] = useState({ nom:'', prenom:'', email:'', telephone:'', filiere:'', secteur:'' })
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFichier, setAvatarFichier] = useState<File | null>(null)
  const [mdpForm, setMdpForm] = useState({ ancien:'', nouveau:'', confirmation:'' })
  const [notifJournal, setNotifJournal] = useState(true)
  const [notifRappel, setNotifRappel] = useState(true)
  const [profilSauvegarde, setProfilSauvegarde] = useState('')
  const [mdpSauvegarde, setMdpSauvegarde] = useState('')
  const [profilEnCours, setProfilEnCours] = useState(false)
  const [mdpEnCours, setMdpEnCours] = useState(false)
  const [avatarEnCours, setAvatarEnCours] = useState(false)

  const largeur = useSyncExternalStore(abonnerRedimension, lireLargeur, largeurServeur)

  const chargerStagiaires = async () => {
    const token = localStorage.getItem('token')
    setStagiairesChargement(true)
    try {
      const res = await fetch('/api/encadreur/stagiaires', { headers: { authorization: `Bearer ${token}` } })
      if (!res.ok) return
      const data = await res.json()
      setStagiaires(data.stagiaires ?? [])
    } catch { /* silencieux */ }
    finally { setStagiairesChargement(false) }
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    const brut  = localStorage.getItem('user')
    if (!token || !brut) { router.push('/login'); return }
    let utilisateur: { nom: string; prenom: string; role: string }
    try { utilisateur = JSON.parse(brut) }
    catch { router.push('/login'); return }
    if (utilisateur.role !== 'ENCADREUR') { router.push('/login'); return }
    const sessionExpiree = () => {
      localStorage.removeItem('token'); localStorage.removeItem('user'); router.push('/login')
    }
    const charger = async () => {
      setTimeout(() => setEncadreur(utilisateur), 0)
      try {
        const res = await fetch('/api/dashboard/encadreur', { headers: { authorization: `Bearer ${token}` } })
        if (res.status === 401 || res.status === 403) { sessionExpiree(); return }
        if (!res.ok) { setErreur(`Impossible de charger le tableau de bord (erreur ${res.status})`); return }
        const data = await res.json()
        setStats(data.stats)
        setJournauxRecents(data.journauxRecents ?? [])
        setErreur('')
      } catch { setErreur('Impossible de contacter le serveur.') }
      finally { setChargement(false) }
    }
    charger()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void chargerStagiaires()
  }, [router])

  const chargerJournaux = async () => {
    const token = localStorage.getItem('token')
    setJournauxChargement(true); setJournauxErreur('')
    try {
      const res = await fetch('/api/encadreur/journal', { headers: { authorization: `Bearer ${token}` } })
      if (!res.ok) { setJournauxErreur('Impossible de charger les journaux'); return }
      const data = await res.json()
      setJournaux(data.journaux ?? [])
    } catch { setJournauxErreur('Impossible de contacter le serveur.') }
    finally { setJournauxChargement(false) }
  }

  // Charger le profil pour la vue Paramètres
  const chargerProfil = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch('/api/profil', { headers: { authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (data.user) {
        setProfilForm({
          nom: data.user.nom || '',
          prenom: data.user.prenom || '',
          email: data.user.email || '',
          telephone: data.user.telephone || '',
          filiere: data.user.filiere || '',
          secteur: data.user.secteur || '',
        })
        // Récupérer l'avatar depuis les compétences (champ JSON)
        try {
          const meta = JSON.parse(data.user.competences || '{}')
          if (meta.avatarUrl) setAvatarUrl(meta.avatarUrl)
        } catch { /* pas de meta */ }
      }
    } catch { /* silencieux */ }
  }

  // Sauvegarder le profil
  const sauvegarderProfil = async () => {
    const token = localStorage.getItem('token')
    setProfilEnCours(true)
    setProfilSauvegarde('')
    try {
      // Upload avatar si sélectionné
      if (avatarFichier) {
        setAvatarEnCours(true)
        const fd = new FormData()
        fd.append('avatar', avatarFichier)
        const resAvatar = await fetch('/api/profil', {
          method: 'PATCH',
          headers: { authorization: `Bearer ${token}` },
          body: fd,
        })
        const dataAvatar = await resAvatar.json()
        if (resAvatar.ok && dataAvatar.avatarUrl) {
          setAvatarUrl(dataAvatar.avatarUrl)
          setAvatarFichier(null)
        }
        setAvatarEnCours(false)
      }
      // Mettre à jour les infos textuelles
      const res = await fetch('/api/profil', {
        method: 'PATCH',
        headers: { authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(profilForm),
      })
      const data = await res.json()
      if (res.ok) {
        setProfilSauvegarde('✓ Profil mis à jour avec succès')
        // Mettre à jour le localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        localStorage.setItem('user', JSON.stringify({ ...user, nom: profilForm.nom, prenom: profilForm.prenom }))
        setEncadreur({ nom: profilForm.nom, prenom: profilForm.prenom })
      } else {
        setProfilSauvegarde('✗ ' + (data.message || 'Erreur'))
      }
    } catch { setProfilSauvegarde('✗ Erreur de connexion') }
    finally { setProfilEnCours(false) }
  }

  // Changer le mot de passe
  const changerMotDePasse = async () => {
    if (mdpForm.nouveau !== mdpForm.confirmation) {
      setMdpSauvegarde('✗ Les mots de passe ne correspondent pas')
      return
    }
    const token = localStorage.getItem('token')
    setMdpEnCours(true)
    setMdpSauvegarde('')
    try {
      const res = await fetch('/api/profil', {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ancienMotDePasse: mdpForm.ancien, nouveauMotDePasse: mdpForm.nouveau }),
      })
      const data = await res.json()
      if (res.ok) {
        setMdpSauvegarde('✓ Mot de passe changé avec succès')
        setMdpForm({ ancien:'', nouveau:'', confirmation:'' })
      } else {
        setMdpSauvegarde('✗ ' + (data.message || 'Erreur'))
      }
    } catch { setMdpSauvegarde('✗ Erreur de connexion') }
    finally { setMdpEnCours(false) }
  }

  const validerJournal = async (journalId: number, statut: 'VALIDE' | 'REJETE') => {
    const token = localStorage.getItem('token')
    setActionEnCours(journalId)
    try {
      const res = await fetch(`/api/encadreur/journal/${journalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ statut, commentaire: commentaireTexte || null }),
      })
      if (!res.ok) return
      setJournaux(prev => prev.map(j => j.id === journalId ? { ...j, statut, commentaire: commentaireTexte || null } : j))
      setJournauxRecents(prev => prev.map(j => j.id === journalId ? { ...j, statut } : j))
      setStats(prev => {
        if (!prev) return prev
        const wasEnAttente = journaux.find(j => j.id === journalId)?.statut === 'EN_ATTENTE'
        return {
          ...prev,
          journauxEnAttente: wasEnAttente ? Math.max(0, prev.journauxEnAttente - 1) : prev.journauxEnAttente,
          journauxValides: statut === 'VALIDE' ? prev.journauxValides + 1 : prev.journauxValides,
          journauxRejetes: statut === 'REJETE' ? prev.journauxRejetes + 1 : prev.journauxRejetes,
        }
      })
      if (journalSelectionne?.id === journalId)
        setJournalSelectionne(prev => prev ? { ...prev, statut, commentaire: commentaireTexte || null } : null)
      setCommentaireTexte('')
    } finally { setActionEnCours(null) }
  }

  const seDeconnecter = () => {
    localStorage.removeItem('token'); localStorage.removeItem('user')
    document.cookie = 'token=; path=/; max-age=0'
    router.push('/login')
  }

  if (chargement) {
    return (
      <div style={{ display:'flex', minHeight:'100vh', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#0b2f7a 0%,#1d6fe8 100%)' }}>
        <div style={{ fontSize:20, color:'#fff' }}>Chargement...</div>
      </div>
    )
  }

  const bureau = largeur >= 1024
  const echelle = bureau ? Math.min(Math.max(largeur / LARGEUR_MAQUETTE, 0.6), 1.5) : 1
  const hauteurPage = `${100 / echelle}vh`
  const nomEncadreur = encadreur ? `${encadreur.prenom} ${encadreur.nom}`.trim() : ''
  const initialesEnc = encadreur ? `${encadreur.prenom[0]??''}${encadreur.nom[0]??''}`.toUpperCase() : 'E'

  const cartes = [
    { label:'Mes étudiants',      valeur:stats?.totalStagiaires??0,   fond:'#dbe8fd', couleurIcn:'#3b82f6', icon:<svg viewBox="0 0 24 24" width={32} height={32} fill="none" stroke="#3b82f6" strokeWidth={1.7}><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14c2.8 0 4.5 2 4.5 5"/></svg>, delta:'+2 cette semaine', positif:true },
    { label:'Stages en cours',    valeur:stats?.totalStagiaires??0,   fond:'#ede9fe', couleurIcn:'#7c3aed', icon:<svg viewBox="0 0 24 24" width={32} height={32} fill="none" stroke="#7c3aed" strokeWidth={1.7}><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>, delta:'+1 cette semaine', positif:true },
    { label:'Évaluations à faire',valeur:stats?.journauxEnAttente??0, fond:'#dcfce7', couleurIcn:'#16a34a', icon:<svg viewBox="0 0 24 24" width={32} height={32} fill="none" stroke="#16a34a" strokeWidth={1.7}><polyline points="9,11 12,14 22,4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>, delta:'-1 cette semaine', positif:false },
    { label:'Taux de suivi moyen',valeur:'78%',                        fond:'#fef9c3', couleurIcn:'#d97706', icon:<svg viewBox="0 0 24 24" width={32} height={32} fill="#f59e0b" stroke="#d97706" strokeWidth={1.2}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>, delta:'+6% cette semaine', positif:true },
  ]

  const th: CSSProperties = { padding:'11px 16px', fontWeight:600, color:MUTED, fontSize:12.5, whiteSpace:'nowrap', borderBottom:'1px solid #f0f4fb' }
  const titrePage: CSSProperties = { margin:0, fontSize:28, fontWeight:800, color:NAVY, lineHeight:1.2 }
  const journauxFiltres = filtreJournal === 'TOUS' ? journaux : journaux.filter(j => j.statut === filtreJournal)

  // données maquette pour évaluations (en attente de vraies données)
  const evaluationsMock = journauxRecents.slice(0,3).map((j,i) => ({
    nom: `${j.etudiant.prenom} ${j.etudiant.nom}`,
    entreprise: 'Entreprise',
    note: 4-i,
    date: formatDate(j.createdAt),
  }))

  return (
    <div style={{ display:'flex', minHeight:hauteurPage, background:'#f4f7fc', zoom:echelle }}>
      {/* ═══════ SIDEBAR ═══════ */}
      {bureau && (
        <aside style={{ position:'sticky', top:0, alignSelf:'flex-start', display:'flex', flexDirection:'column', width:260, flexShrink:0, height:hauteurPage, overflow:'hidden', color:'#fff', background:'linear-gradient(180deg,#0b2d6e 0%,#0d3585 55%,#0a2860 100%)' }}>
          {/* Logo + titre */}
          <div style={{ display:'flex', alignItems:'center', gap:12, padding:'20px 20px 0' }}>
            <div style={{ position:'relative', width:52, height:52, flexShrink:0, overflow:'hidden', borderRadius:'50%', background:'#fff' }}>
              <Image src="/logo-ipd.png" alt="Logo IPD" fill sizes="52px" priority style={{ objectFit:'contain' }} />
            </div>
            <div style={{ lineHeight:1.3 }}>
              <p style={{ margin:0, fontSize:11.5, fontWeight:800, lineHeight:1.4 }}>INSTITUT POLYTECHNIQUE<br/>DE DAKAR</p>
              <p style={{ margin:'2px 0 0', fontSize:10, color:'#c5d5f5' }}>Plateforme de gestion des stages</p>
            </div>
          </div>
          {/* Nav items */}
          <nav style={{ padding:'28px 12px 0', flex:1 }}>
            {NAV.map((n) => {
              const actif = vue === n.id
              const onClick = () => {
                setVue(n.id)
                if (n.id === 'etudiants') chargerStagiaires()
                if (n.id === 'suivi') chargerJournaux()
              }
              return (
                <button key={n.id} onClick={onClick}
                  style={{ display:'flex', alignItems:'center', gap:14, width:'100%', height:46, padding:'0 14px', marginBottom:4, borderRadius:10, border:'none', textAlign:'left', cursor:'pointer', color:'#fff', fontSize:14, fontWeight:500, transition:'background 0.15s', ...(actif ? { background:'rgba(255,255,255,0.18)', fontWeight:700 } : { background:'transparent' }) }}>
                  <Icon name={n.icon} size={20} sw={actif ? 2.2 : 1.7}/>{n.label}
                  {n.id === 'messages' && (stats?.journauxEnAttente ?? 0) > 0 && (
                    <span style={{ marginLeft:'auto', minWidth:20, height:20, padding:'0 5px', borderRadius:10, background:'#ef4444', color:'#fff', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {stats!.journauxEnAttente}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
          {/* Bas : texte cursif */}
          <div style={{ flexShrink:0, padding:'0 20px 20px' }}>
            <p style={{ margin:0, fontFamily:"'Segoe Script','Brush Script MT',cursive", fontSize:15, lineHeight:'24px', color:'#fff', opacity:0.9 }}>
              Ensemble pour<br/>l&apos;avenir des talents
            </p>
          </div>
        </aside>
      )}

      {/* ═══════ MAIN COLUMN ═══════ */}
      <div style={{ display:'flex', flexDirection:'column', flex:1, minWidth:0 }}>
        {/* HEADER */}
        <header style={{ position:'sticky', top:0, zIndex:20, display:'flex', alignItems:'center', gap:18, height:72, padding:'0 28px', background:'#fff', borderBottom:'1px solid #eef2fa' }}>
          <label style={{ display:'flex', alignItems:'center', gap:12, flex:1, maxWidth:520, height:42, padding:'0 18px', borderRadius:10, background:'#f1f5fb', color:'#7b88a3' }}>
            <Icon name="search" size={19}/>
            <input placeholder="Rechercher un étudiant, une offre, un stage..." style={{ flex:1, background:'transparent', border:'none', outline:'none', fontSize:14, color:'#2d3b5a' }}/>
          </label>
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:20 }}>
            {/* Cloche */}
            <button aria-label="Notifications"
              onClick={() => { setVue('suivi'); chargerJournaux() }}
              style={{ position:'relative', color:NAVY, background:'transparent', border:'none', cursor:'pointer', display:'flex' }}>
              <Icon name="bell" size={26}/>
              {(stats?.journauxEnAttente ?? 0) > 0 && (
                <span style={{ position:'absolute', top:-5, right:-6, minWidth:18, height:18, padding:'0 4px', borderRadius:9, background:'#ef4444', color:'#fff', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {stats!.journauxEnAttente}
                </span>
              )}
            </button>
            <span style={{ width:1, height:44, background:'#e6ecf5' }}/>
            {/* Profil + déconnexion dropdown */}
            <div style={{ position:'relative' }} className="profile-menu">
              <button
                onClick={() => { const m = document.getElementById('profile-dropdown'); if(m) m.style.display = m.style.display==='flex'?'none':'flex' }}
                style={{ display:'flex', alignItems:'center', gap:10, background:'transparent', border:'none', cursor:'pointer', padding:'4px 8px', borderRadius:10 }}>
                <span style={{ display:'flex', alignItems:'center', justifyContent:'center', width:42, height:42, borderRadius:'50%', background:BLUE, color:'#fff', fontSize:14, fontWeight:700, flexShrink:0 }}>{initialesEnc}</span>
                <span style={{ textAlign:'left', lineHeight:1.3 }}>
                  <span style={{ display:'block', fontSize:14, fontWeight:700, color:NAVY }}>{nomEncadreur}</span>
                  <span style={{ display:'block', fontSize:12, color:MUTED }}>Encadreur</span>
                </span>
                <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke={MUTED} strokeWidth={2}><path d="M6 9l6 6 6-6"/></svg>
              </button>
              {/* Dropdown */}
              <div id="profile-dropdown" style={{ display:'none', flexDirection:'column', position:'absolute', top:'calc(100% + 8px)', right:0, minWidth:200, background:'#fff', borderRadius:12, border:'1px solid #eef2fa', boxShadow:'0 8px 32px rgba(30,70,150,0.13)', zIndex:100, overflow:'hidden' }}>
                <button onClick={() => setVue('parametres')}
                  style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 18px', background:'transparent', border:'none', cursor:'pointer', color:NAVY, fontSize:14, fontWeight:500, textAlign:'left', borderBottom:'1px solid #f0f4fb' }}>
                  <Icon name="user" size={17} sw={1.7}/>Mon profil
                </button>
                <button onClick={() => setVue('parametres')}
                  style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 18px', background:'transparent', border:'none', cursor:'pointer', color:NAVY, fontSize:14, fontWeight:500, textAlign:'left', borderBottom:'1px solid #f0f4fb' }}>
                  <Icon name="settings" size={17} sw={1.7}/>Paramètres
                </button>
                <button onClick={seDeconnecter}
                  style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 18px', background:'transparent', border:'none', cursor:'pointer', color:'#dc2626', fontSize:14, fontWeight:600, textAlign:'left' }}>
                  <Icon name="logout" size={17} sw={1.7}/>Se déconnecter
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* MOBILE NAV */}
        {!bureau && (
          <nav style={{ display:'flex', gap:8, overflowX:'auto', background:'#fff', padding:'8px 16px' }}>
            {NAV.map(n => (
              <button key={n.id}
                onClick={() => { setVue(n.id); if(n.id==='etudiants') chargerStagiaires(); if(n.id==='suivi') chargerJournaux() }}
                style={{ flexShrink:0, borderRadius:8, padding:'8px 12px', fontSize:13, fontWeight:500, border:'none', cursor:'pointer', ...(vue===n.id ? { background:BLUE, color:'#fff' } : { color:NAVY, background:'#f1f5fb' }) }}>
                {n.label}
              </button>
            ))}
          </nav>
        )}

        <main style={{ flex:1, padding:bureau ? '24px 28px 40px' : '20px 16px 32px' }}>
          {erreur && (
            <div role="alert" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, marginBottom:20, padding:'12px 20px', borderRadius:10, background:'#fef2f2', border:'1px solid #fecaca', color:'#b91c1c', fontSize:14 }}>
              <span>{erreur}</span>
              <button onClick={() => window.location.reload()} style={{ fontWeight:600, textDecoration:'underline', background:'transparent', border:'none', color:'inherit', cursor:'pointer', flexShrink:0 }}>Réessayer</button>
            </div>
          )}

          {/* ═══ VUE TABLEAU DE BORD ═══ */}
          {vue === 'tableau' && (
            <>
              {/* HERO BANNER */}
              <div style={{ position:'relative', borderRadius:16, overflow:'hidden', marginBottom:24, minHeight:130, background:'linear-gradient(90deg,#1a3a8f 0%,#1d6fe8 60%,#2196f3 100%)', display:'flex', alignItems:'center' }}>
                <div style={{ padding:'28px 32px', zIndex:2, position:'relative', flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:6 }}>
                    <div style={{ width:54, height:54, borderRadius:'50%', background:'rgba(255,255,255,0.18)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <svg viewBox="0 0 24 24" width={30} height={30} fill="none" stroke="#fff" strokeWidth={1.8}><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                    </div>
                    <div>
                      <h1 style={{ margin:0, fontSize:26, fontWeight:800, color:'#fff', lineHeight:1.2 }}>Bonjour, {encadreur?.prenom||'…'} !</h1>
                      <p style={{ margin:'4px 0 0', fontSize:14, color:'rgba(255,255,255,0.82)' }}>Vous accompagnez les étudiants dans leur parcours de formation.</p>
                    </div>
                  </div>
                </div>
                {/* Texte cursif décoratif */}
                <div style={{ position:'absolute', right:180, top:'50%', transform:'translateY(-50%)', zIndex:2, textAlign:'center', pointerEvents:'none' }}>
                  <p style={{ margin:0, fontFamily:"'Segoe Script','Brush Script MT',cursive", fontSize:17, color:'rgba(255,255,255,0.85)', lineHeight:1.6 }}>
                    Former aujourd&apos;hui<br/>les talents de demain
                  </p>
                </div>
                {/* Décoration droite */}
                <div style={{ position:'absolute', right:0, top:0, bottom:0, width:160, zIndex:1, background:'linear-gradient(135deg,transparent 0%,rgba(255,255,255,0.05) 100%)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <svg viewBox="0 0 100 100" width={120} height={120} fill="none" opacity={0.15}>
                    <circle cx="50" cy="50" r="45" stroke="#fff" strokeWidth="2"/>
                    <circle cx="50" cy="50" r="30" stroke="#fff" strokeWidth="2"/>
                    <circle cx="50" cy="50" r="15" stroke="#fff" strokeWidth="2"/>
                  </svg>
                </div>
              </div>

              {/* 4 CARTES STATS */}
              <div style={{ display:'grid', gridTemplateColumns:bureau ? 'repeat(4,1fr)' : 'repeat(auto-fit,minmax(220px,1fr))', gap:18, marginBottom:24 }}>
                {cartes.map(c => (
                  <div key={c.label} style={{ ...CARTE, padding:'22px 22px 18px' }}>
                    <div style={{ display:'flex', alignItems:'flex-start', gap:16, marginBottom:12 }}>
                      <div style={{ width:50, height:50, borderRadius:'50%', background:c.fond, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        {c.icon}
                      </div>
                      <div>
                        <p style={{ margin:0, fontSize:13, color:MUTED, fontWeight:500 }}>{c.label}</p>
                        <p style={{ margin:'4px 0 0', fontSize:32, fontWeight:800, color:NAVY, lineHeight:1 }}>{c.valeur}</p>
                      </div>
                    </div>
                    <p style={{ margin:0, fontSize:12, color:c.positif?'#16a34a':'#dc2626', display:'flex', alignItems:'center', gap:4 }}>
                      <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2.5}><path d={c.positif?'M5 15l7-7 7 7':'M19 9l-7 7-7-7'}/></svg>
                      {c.delta}
                    </p>
                  </div>
                ))}
              </div>

              {/* TABLEAU PRINCIPAL + PANNEAU DROIT */}
              <div style={{ display:'grid', gridTemplateColumns:bureau ? '1fr 340px' : '1fr', gap:20 }}>
                {/* COLONNE GAUCHE */}
                <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                  {/* Tableau étudiants en stage */}
                  <section style={{ ...CARTE, overflow:'hidden' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 22px 14px' }}>
                      <h2 style={{ display:'flex', alignItems:'center', gap:10, margin:0, fontSize:16, fontWeight:700, color:NAVY }}>
                        <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke={BLUE} strokeWidth={1.8}><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14c2.8 0 4.5 2 4.5 5"/></svg>
                        Mes étudiants en stage
                      </h2>
                      <button onClick={() => setVue('etudiants')} style={{ display:'flex', alignItems:'center', gap:6, background:'transparent', border:'none', color:BLUE, fontSize:13, fontWeight:600, cursor:'pointer' }}>
                        Voir tous <Icon name="arrowRight" size={16}/>
                      </button>
                    </div>
                    <div style={{ overflowX:'auto' }}>
                      <table style={{ width:'100%', minWidth:560, borderCollapse:'collapse', fontSize:13 }}>
                        <thead>
                          <tr style={{ background:'#f8faff' }}>
                            {['Étudiant','Entreprise','Poste de stage','Durée','Statut','Actions'].map(h => (
                              <th key={h} style={th}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {stagiairesChargement ? (
                            <tr><td colSpan={6} style={{ padding:40, textAlign:'center', color:MUTED }}>Chargement…</td></tr>
                          ) : stagiaires.length === 0 ? (
                            <tr><td colSpan={6} style={{ padding:40, textAlign:'center', color:MUTED }}>Aucun étudiant en stage pour le moment</td></tr>
                          ) : stagiaires.slice(0,5).map(s => {
                            const sc = s.convention?.statut ?? 'SANS'
                            const badge = sc==='VALIDEE'?{label:'En cours',fond:'#dbeafe',texte:'#1d4ed8'}:sc==='EN_ATTENTE'?{label:'À évaluer',fond:'#fef9c3',texte:'#a16207'}:sc==='REJETEE'?{label:'Terminé',fond:'#f1f5f9',texte:MUTED}:{label:'—',fond:'#f1f5f9',texte:MUTED}
                            const initiales = avatarInitiales(s.prenom, s.nom)
                            const cAvatar = couleurAvatar(s.nom)
                            return (
                              <tr key={s.id} style={{ borderTop:'1px solid #f0f4fb' }}>
                                <td style={{ padding:'13px 16px' }}>
                                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                    <div style={{ width:36, height:36, borderRadius:'50%', background:cAvatar, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:'#fff', fontWeight:700, fontSize:13 }}>{initiales}</div>
                                    <div>
                                      <div style={{ fontWeight:600, color:NAVY }}>{s.prenom} {s.nom}</div>
                                      <div style={{ fontSize:11, color:MUTED }}>{s.filiere??'—'}</div>
                                    </div>
                                  </div>
                                </td>
                                <td style={{ padding:'13px 16px', color:NAVY, fontSize:13 }}>{s.convention?.entreprise?.nom??'—'}</td>
                                <td style={{ padding:'13px 16px', color:MUTED }}>{s.convention?.offre?.titre??'—'}</td>
                                <td style={{ padding:'13px 16px', color:MUTED, whiteSpace:'nowrap' }}>{s.convention?.offre?.duree ? `${s.convention.offre.duree} sem.` : '—'}</td>
                                <td style={{ padding:'13px 16px' }}>
                                  <span style={{ display:'inline-block', padding:'4px 12px', borderRadius:20, background:badge.fond, color:badge.texte, fontSize:12, fontWeight:600, whiteSpace:'nowrap' }}>{badge.label}</span>
                                </td>
                                <td style={{ padding:'13px 16px' }}>
                                  <button onClick={() => { setStagiaireSelectionne(s); setVue('etudiants') }}
                                    style={{ display:'flex', alignItems:'center', justifyContent:'center', width:32, height:32, borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', color:MUTED }}>
                                    <Icon name="eye" size={16} sw={1.8}/>
                                  </button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  {/* Tableau évaluations */}
                  <section style={{ ...CARTE, overflow:'hidden' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 22px 14px' }}>
                      <h2 style={{ display:'flex', alignItems:'center', gap:10, margin:0, fontSize:16, fontWeight:700, color:NAVY }}>
                        <svg viewBox="0 0 24 24" width={22} height={22} fill="#f59e0b" stroke="#d97706" strokeWidth={1.2}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        Dernières évaluations
                      </h2>
                      <button onClick={() => setVue('evaluations')} style={{ display:'flex', alignItems:'center', gap:6, background:'transparent', border:'none', color:BLUE, fontSize:13, fontWeight:600, cursor:'pointer' }}>
                        Voir toutes <Icon name="arrowRight" size={16}/>
                      </button>
                    </div>
                    <div style={{ overflowX:'auto' }}>
                      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                        <thead>
                          <tr style={{ background:'#f8faff' }}>
                            {['Étudiant','Entreprise','Évaluation','Date'].map(h => (
                              <th key={h} style={th}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {evaluationsMock.length === 0 ? (
                            <tr><td colSpan={4} style={{ padding:40, textAlign:'center', color:MUTED }}>Aucune évaluation pour le moment</td></tr>
                          ) : evaluationsMock.map((ev, i) => (
                            <tr key={i} style={{ borderTop:'1px solid #f0f4fb' }}>
                              <td style={{ padding:'13px 16px', fontWeight:600, color:NAVY }}>{ev.nom}</td>
                              <td style={{ padding:'13px 16px', color:MUTED }}>{ev.entreprise}</td>
                              <td style={{ padding:'13px 16px' }}>
                                <div style={{ display:'flex', gap:2 }}>{etoiles(ev.note)}</div>
                              </td>
                              <td style={{ padding:'13px 16px', color:MUTED, whiteSpace:'nowrap' }}>{ev.date}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </div>

                {/* PANNEAU DROIT */}
                <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                  {/* Mon profil encadreur */}
                  <section style={{ ...CARTE, padding:'22px 22px 18px' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                      <h2 style={{ display:'flex', alignItems:'center', gap:10, margin:0, fontSize:15, fontWeight:700, color:NAVY }}>
                        <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke={BLUE} strokeWidth={1.8}><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14c2.8 0 4.5 2 4.5 5"/></svg>
                        Mon profil encadreur
                      </h2>
                      <button onClick={() => setVue('parametres')} style={{ background:'transparent', border:'none', color:BLUE, fontSize:13, fontWeight:600, cursor:'pointer' }}>Voir profil</button>
                    </div>
                    {/* Avatar + nom */}
                    <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20 }}>
                      <div style={{ width:52, height:52, borderRadius:'50%', background:'#dbe8fd', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <svg viewBox="0 0 24 24" width={28} height={28} fill="none" stroke={BLUE} strokeWidth={1.7}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      </div>
                      <div>
                        <p style={{ margin:0, fontSize:15, fontWeight:700, color:NAVY }}>{nomEncadreur || 'Encadreur'}</p>
                        <p style={{ margin:'2px 0 0', fontSize:12.5, color:MUTED }}>Encadreur</p>
                      </div>
                    </div>
                    {/* Infos profil */}
                    {[
                      { icon:'school',  texte:'Licence 3 – Génie logiciel' },
                      { icon:'school',  texte:'IPD Thomas Sankara' },
                      { icon:'mapPin', texte:'Dakar, Sénégal' },
                    ].map((item, i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderTop: i===0 ? 'none' : '1px solid #f0f4fb', color:MUTED, fontSize:13 }}>
                        <Icon name={item.icon as IconName} size={16} sw={1.6}/>{item.texte}
                      </div>
                    ))}
                    <button onClick={() => setVue('parametres')}
                      style={{ width:'100%', marginTop:16, padding:'10px 0', borderRadius:10, border:'1px solid #d1d9f0', background:'#fff', color:NAVY, fontSize:13.5, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                      Gérer mon profil <Icon name="arrowRight" size={16}/>
                    </button>
                  </section>

                  {/* Prochaines actions */}
                  <section style={{ ...CARTE, padding:'22px 22px 18px' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                      <h2 style={{ display:'flex', alignItems:'center', gap:10, margin:0, fontSize:15, fontWeight:700, color:NAVY }}>
                        <Icon name="calendar" size={20} sw={1.7}/>Prochaines actions
                      </h2>
                      <button style={{ background:'transparent', border:'none', color:BLUE, fontSize:13, fontWeight:600, cursor:'pointer' }}>Voir tout</button>
                    </div>
                    {journauxRecents.slice(0,3).length === 0 ? (
                      <p style={{ color:MUTED, fontSize:13, textAlign:'center', padding:'16px 0' }}>Aucune action à venir</p>
                    ) : journauxRecents.slice(0,3).map((j, i) => {
                      const d = new Date(j.createdAt)
                      return (
                        <button key={j.id}
                          onClick={() => { setVue('suivi'); chargerJournaux() }}
                          style={{ display:'flex', alignItems:'center', gap:12, width:'100%', padding:'12px 0', borderTop: i===0?'none':'1px solid #f0f4fb', background:'transparent', border:'none', cursor:'pointer', textAlign:'left' as const }}>
                          <div style={{ width:42, flexShrink:0, textAlign:'center' }}>
                            <p style={{ margin:0, fontSize:17, fontWeight:800, color:NAVY, lineHeight:1 }}>{d.getDate()}</p>
                            <p style={{ margin:'2px 0 0', fontSize:10.5, color:MUTED, textTransform:'uppercase' }}>{d.toLocaleDateString('fr-FR',{month:'short'}).replace('.','')}</p>
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <p style={{ margin:0, fontSize:13, fontWeight:600, color:NAVY }}>Valider le journal — Sem. {j.semaine}</p>
                            <p style={{ margin:'2px 0 0', fontSize:12, color:MUTED }}>{j.etudiant.prenom} {j.etudiant.nom}</p>
                          </div>
                          <Icon name="chevronRight" size={16} sw={2}/>
                        </button>
                      )
                    })}
                    {/* Carte bleue bas */}
                    <div style={{ marginTop:16, padding:'14px 16px', borderRadius:12, background:'linear-gradient(135deg,#dbe8fd 0%,#eff6ff 100%)', display:'flex', alignItems:'flex-start', gap:12 }}>
                      <div style={{ width:36, height:36, borderRadius:10, background:BLUE, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <Icon name="doc" size={18}/>
                      </div>
                      <div style={{ flex:1 }}>
                        <p style={{ margin:0, fontSize:13, fontWeight:700, color:NAVY }}>Un accompagnement de qualité</p>
                        <p style={{ margin:'4px 0 8px', fontSize:12, color:MUTED, lineHeight:1.5 }}>Suivez les progrès de vos étudiants et contribuez à leur réussite professionnelle.</p>
                        <button onClick={() => setVue('etudiants')} style={{ display:'flex', alignItems:'center', gap:4, background:'transparent', border:'none', color:BLUE, fontSize:12, fontWeight:600, cursor:'pointer' }}>
                          Voir mes étudiants <Icon name="arrowRight" size={14}/>
                        </button>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </>
          )}

          {/* ═══ VUE MES ÉTUDIANTS ═══ */}
          {vue === 'etudiants' && (
            <>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
                <div>
                  <h1 style={titrePage}>Mes étudiants</h1>
                  <p style={{ margin:'4px 0 0', fontSize:15, color:'#2f55b0' }}>{stagiaires.length} étudiant(s) encadré(s)</p>
                </div>
              </div>
              {stagiaireSelectionne && (
                <section style={{ ...CARTE, padding:'24px 28px', marginBottom:20 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20, flexWrap:'wrap', gap:12 }}>
                    <div>
                      <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:NAVY }}>{stagiaireSelectionne.prenom} {stagiaireSelectionne.nom}</h2>
                      <p style={{ margin:'4px 0 0', fontSize:13, color:MUTED }}>{stagiaireSelectionne.filiere??'—'} · {stagiaireSelectionne.classe??'—'}</p>
                    </div>
                    <button onClick={() => setStagiaireSelectionne(null)} style={{ padding:'6px 14px', border:'1px solid #d1d9f0', borderRadius:8, background:'#fff', color:MUTED, fontSize:13, cursor:'pointer' }}>✕ Fermer</button>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:bureau ? '1fr 1fr' : '1fr', gap:20 }}>
                    <div>
                      <h3 style={{ margin:'0 0 10px', fontSize:14, fontWeight:700, color:NAVY }}>Informations étudiant</h3>
                      {[
                        { label:'Email',    valeur:stagiaireSelectionne.email },
                        { label:'Téléphone',valeur:stagiaireSelectionne.telephone??'—' },
                        { label:'Classe',   valeur:stagiaireSelectionne.classe??'—' },
                        { label:'Filière',  valeur:stagiaireSelectionne.filiere??'—' },
                      ].map(({label,valeur}) => (
                        <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid #f1f5fb', fontSize:13 }}>
                          <span style={{ color:MUTED }}>{label}</span><span style={{ color:NAVY, fontWeight:500 }}>{valeur}</span>
                        </div>
                      ))}
                    </div>
                    {stagiaireSelectionne.convention && (
                      <div>
                        <h3 style={{ margin:'0 0 10px', fontSize:14, fontWeight:700, color:NAVY }}>Convention de stage</h3>
                        {[
                          { label:'Entreprise',valeur:stagiaireSelectionne.convention.entreprise?.nom??'—' },
                          { label:'Poste',     valeur:stagiaireSelectionne.convention.offre?.titre??'—' },
                          { label:'Durée',     valeur:stagiaireSelectionne.convention.offre?.duree?`${stagiaireSelectionne.convention.offre.duree} sem.`:'—' },
                          { label:'Début',     valeur:stagiaireSelectionne.convention.debutStage?formatDate(stagiaireSelectionne.convention.debutStage):'—' },
                          { label:'Fin',       valeur:stagiaireSelectionne.convention.finStage?formatDate(stagiaireSelectionne.convention.finStage):'—' },
                        ].map(({label,valeur}) => (
                          <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid #f1f5fb', fontSize:13 }}>
                            <span style={{ color:MUTED }}>{label}</span><span style={{ color:NAVY, fontWeight:500 }}>{valeur}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              )}
              <section style={{ ...CARTE, overflow:'hidden' }}>
                {stagiairesChargement ? <div style={{ padding:48, textAlign:'center', color:MUTED }}>Chargement…</div>
                : (
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                      <thead><tr style={{ background:'#f8faff' }}>{['Étudiant','Filière','Classe','Entreprise','Poste','Statut','Actions'].map(h=><th key={h} style={{ padding:'12px 16px', textAlign:'left', fontWeight:600, color:MUTED, whiteSpace:'nowrap', borderBottom:'1px solid #eef2fa' }}>{h}</th>)}</tr></thead>
                      <tbody>
                        {stagiaires.length===0 ? <tr><td colSpan={7} style={{ padding:40, textAlign:'center', color:MUTED }}>Aucun étudiant encadré pour le moment</td></tr>
                        : stagiaires.map(s => {
                          const sc = s.convention?.statut
                          const badge = sc==='VALIDEE'?{label:'En cours',fond:'#dbeafe',texte:'#1d4ed8'}:sc==='EN_ATTENTE'?{label:'En attente',fond:'#fef3c7',texte:'#d97706'}:sc==='REJETEE'?{label:'Rejeté',fond:'#fde2e2',texte:'#b91c1c'}:{label:'Sans convention',fond:'#f1f5f9',texte:MUTED}
                          const initiales = avatarInitiales(s.prenom, s.nom)
                          const cAvatar = couleurAvatar(s.nom)
                          return (
                            <tr key={s.id} style={{ borderBottom:'1px solid #f1f5fb', cursor:'pointer' }} onClick={()=>setStagiaireSelectionne(s)}>
                              <td style={{ padding:'12px 16px' }}>
                                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                  <div style={{ width:34, height:34, borderRadius:'50%', background:cAvatar, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:'#fff', fontWeight:700, fontSize:12 }}>{initiales}</div>
                                  <div>
                                    <div style={{ fontWeight:600, color:NAVY }}>{s.prenom} {s.nom}</div>
                                    <div style={{ fontSize:11, color:MUTED }}>{s.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding:'12px 16px', color:MUTED }}>{s.filiere??'—'}</td>
                              <td style={{ padding:'12px 16px', color:MUTED }}>{s.classe??'—'}</td>
                              <td style={{ padding:'12px 16px', color:NAVY }}>{s.convention?.entreprise?.nom??'—'}</td>
                              <td style={{ padding:'12px 16px', color:MUTED }}>{s.convention?.offre?.titre??'—'}</td>
                              <td style={{ padding:'12px 16px' }}><span style={{ background:badge.fond, color:badge.texte, padding:'4px 10px', borderRadius:20, fontWeight:600, fontSize:12 }}>{badge.label}</span></td>
                              <td style={{ padding:'12px 16px' }} onClick={e=>e.stopPropagation()}><button onClick={()=>setStagiaireSelectionne(s)} style={{ padding:'5px 12px', background:'#dbe8fd', color:BLUE, border:'none', borderRadius:6, fontWeight:600, fontSize:12, cursor:'pointer' }}>Voir</button></td>
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

          {/* ═══ VUE SUIVI DES STAGES (journaux) ═══ */}
          {vue === 'suivi' && (
            <>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
                <div>
                  <h1 style={titrePage}>Suivi des stages</h1>
                  <p style={{ margin:'4px 0 0', fontSize:15, color:'#2f55b0' }}>{journaux.length} journal(aux) soumis</p>
                </div>
                <button
                  onClick={async () => {
                    const token = localStorage.getItem('token')
                    try {
                      const res = await fetch(`/api/cron/alertes?key=${process.env.NEXT_PUBLIC_CRON_SECRET || 'cron-secret-ipd-2024'}`, {
                        headers: { authorization: `Bearer ${token}` }
                      })
                      const data = await res.json()
                      alert(`✅ Vérification terminée\n${data.stagesEnRetard} stage(s) en retard\n${data.alertesCrees} alerte(s) créée(s)`)
                    } catch {
                      alert('Erreur lors de la vérification')
                    }
                  }}
                  style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 18px', background:NAVY, color:'#fff', border:'none', borderRadius:10, fontWeight:600, fontSize:13, cursor:'pointer' }}
                >
                  <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  Vérifier alertes
                </button>
              </div>
              <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
                {(['TOUS','EN_ATTENTE','VALIDE','REJETE'] as const).map(f=>(
                  <button key={f} onClick={()=>setFiltreJournal(f)} style={{ padding:'7px 16px', borderRadius:20, fontSize:13, fontWeight:600, cursor:'pointer', border:filtreJournal===f?'none':'1px solid #d1d9f0', background:filtreJournal===f?BLUE:'#fff', color:filtreJournal===f?'#fff':MUTED }}>
                    {f==='TOUS'?'Tous':f==='EN_ATTENTE'?'En attente':f==='VALIDE'?'Validés':'Rejetés'}
                    <span style={{ marginLeft:6, fontSize:11 }}>({f==='TOUS'?journaux.length:journaux.filter(j=>j.statut===f).length})</span>
                  </button>
                ))}
              </div>
              {journalSelectionne && (
                <section style={{ ...CARTE, padding:'24px 28px', marginBottom:20 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20, flexWrap:'wrap', gap:12 }}>
                    <div>
                      <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:NAVY }}>Journal — Semaine {journalSelectionne.semaine}</h2>
                      <p style={{ margin:'4px 0 0', fontSize:13, color:MUTED }}>{journalSelectionne.etudiant.prenom} {journalSelectionne.etudiant.nom} · {formatDate(journalSelectionne.createdAt)}</p>
                    </div>
                    <button onClick={()=>{ setJournalSelectionne(null); setCommentaireTexte('') }} style={{ padding:'6px 14px', border:'1px solid #d1d9f0', borderRadius:8, background:'#fff', color:MUTED, fontSize:13, cursor:'pointer' }}>✕ Fermer</button>
                  </div>
                  <div style={{ background:'#f8faff', borderRadius:10, padding:'16px 20px', marginBottom:20, fontSize:14, color:NAVY, lineHeight:1.7 }}>{journalSelectionne.contenu}</div>
                  {journalSelectionne.commentaire && (
                    <div style={{ background:'#fef3c7', borderRadius:10, padding:'12px 16px', marginBottom:16, fontSize:13, color:'#92400e' }}><strong>Commentaire :</strong> {journalSelectionne.commentaire}</div>
                  )}
                  {journalSelectionne.statut==='EN_ATTENTE' && (
                    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                      <textarea value={commentaireTexte} onChange={e=>setCommentaireTexte(e.target.value)} placeholder="Ajouter un commentaire (optionnel)..." rows={3}
                        style={{ width:'100%', padding:'10px 14px', border:'1px solid #d1d9f0', borderRadius:8, fontSize:13, color:NAVY, resize:'vertical', fontFamily:'inherit', boxSizing:'border-box', outline:'none' }}/>
                      <div style={{ display:'flex', gap:10 }}>
                        <button onClick={()=>validerJournal(journalSelectionne.id,'VALIDE')} disabled={actionEnCours===journalSelectionne.id}
                          style={{ flex:1, padding:'11px 0', background:'#15803d', color:'#fff', border:'none', borderRadius:10, fontWeight:600, fontSize:14, cursor:actionEnCours===journalSelectionne.id?'not-allowed':'pointer', opacity:actionEnCours===journalSelectionne.id?0.7:1 }}>✓ Valider le journal</button>
                        <button onClick={()=>validerJournal(journalSelectionne.id,'REJETE')} disabled={actionEnCours===journalSelectionne.id}
                          style={{ flex:1, padding:'11px 0', background:'#fde2e2', color:'#b91c1c', border:'none', borderRadius:10, fontWeight:600, fontSize:14, cursor:actionEnCours===journalSelectionne.id?'not-allowed':'pointer', opacity:actionEnCours===journalSelectionne.id?0.7:1 }}>✕ Rejeter</button>
                      </div>
                    </div>
                  )}
                  {journalSelectionne.statut!=='EN_ATTENTE' && (
                    <div style={{ padding:'10px 16px', borderRadius:10, fontWeight:600, fontSize:14, textAlign:'center', background:journalSelectionne.statut==='VALIDE'?'#d9f5e3':'#fde2e2', color:journalSelectionne.statut==='VALIDE'?'#15803d':'#b91c1c' }}>
                      {journalSelectionne.statut==='VALIDE'?'✓ Journal validé':'✕ Journal rejeté'}
                    </div>
                  )}
                </section>
              )}
              <section style={{ ...CARTE, overflow:'hidden' }}>
                {journauxChargement?<div style={{ padding:48, textAlign:'center', color:MUTED }}>Chargement…</div>
                :journauxErreur?<div style={{ padding:32, textAlign:'center', color:'#b91c1c' }}>{journauxErreur}</div>
                :(
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                      <thead><tr style={{ background:'#f8faff' }}>{['Étudiant','Semaine','Date','Statut','Actions'].map(h=><th key={h} style={{ padding:'12px 16px', textAlign:'left', fontWeight:600, color:MUTED, whiteSpace:'nowrap', borderBottom:'1px solid #eef2fa' }}>{h}</th>)}</tr></thead>
                      <tbody>
                        {journauxFiltres.length===0?<tr><td colSpan={5} style={{ padding:40, textAlign:'center', color:MUTED }}>Aucun journal trouvé</td></tr>
                        :journauxFiltres.map(j=>{ const b={label:j.statut==='VALIDE'?'Validé':j.statut==='EN_ATTENTE'?'En attente':'Rejeté', fond:j.statut==='VALIDE'?'#d9f5e3':j.statut==='EN_ATTENTE'?'#fef3c7':'#fde2e2', texte:j.statut==='VALIDE'?'#15803d':j.statut==='EN_ATTENTE'?'#d97706':'#b91c1c' }; return(
                          <tr key={j.id} style={{ borderBottom:'1px solid #f1f5fb', cursor:'pointer' }} onClick={()=>{ setJournalSelectionne(j); setCommentaireTexte('') }}>
                            <td style={{ padding:'12px 16px' }}><div style={{ fontWeight:600, color:NAVY }}>{j.etudiant.prenom} {j.etudiant.nom}</div><div style={{ fontSize:11, color:MUTED }}>{j.etudiant.email}</div></td>
                            <td style={{ padding:'12px 16px', color:NAVY, fontWeight:600 }}>Semaine {j.semaine}</td>
                            <td style={{ padding:'12px 16px', color:MUTED, whiteSpace:'nowrap' }}>{formatDate(j.createdAt)}</td>
                            <td style={{ padding:'12px 16px' }}><span style={{ background:b.fond, color:b.texte, padding:'4px 10px', borderRadius:20, fontWeight:600, fontSize:12 }}>{b.label}</span></td>
                            <td style={{ padding:'12px 16px' }} onClick={e=>e.stopPropagation()}>
                              {j.statut==='EN_ATTENTE'?(
                                <div style={{ display:'flex', gap:6 }}>
                                  <button onClick={()=>validerJournal(j.id,'VALIDE')} disabled={actionEnCours===j.id} style={{ padding:'5px 10px', background:'#d9f5e3', color:'#15803d', border:'none', borderRadius:6, fontWeight:600, fontSize:12, cursor:'pointer' }}>✓</button>
                                  <button onClick={()=>validerJournal(j.id,'REJETE')} disabled={actionEnCours===j.id} style={{ padding:'5px 10px', background:'#fde2e2', color:'#b91c1c', border:'none', borderRadius:6, fontWeight:600, fontSize:12, cursor:'pointer' }}>✕</button>
                                </div>
                              ):(
                                <button onClick={()=>{ setJournalSelectionne(j); setCommentaireTexte('') }} style={{ padding:'5px 12px', background:'#f1f5fb', color:NAVY, border:'none', borderRadius:6, fontWeight:600, fontSize:12, cursor:'pointer' }}>Voir</button>
                              )}
                            </td>
                          </tr>
                        )})}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}

          {/* ═══ ÉVALUATIONS ═══ */}
          {vue === 'evaluations' && (
            <>
              <div style={{ marginBottom:24 }}>
                <h1 style={titrePage}>Évaluations</h1>
                <p style={{ margin:'4px 0 0', fontSize:15, color:'#2f55b0' }}>Notez et commentez la progression de vos stagiaires</p>
              </div>

              {stagiaires.length === 0 ? (
                <div style={{ ...CARTE, padding:'60px 40px', textAlign:'center', color:MUTED }}>
                  <svg viewBox="0 0 24 24" width={48} height={48} fill="none" stroke={MUTED} strokeWidth={1.4} style={{ marginBottom:16 }}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  <p style={{ margin:0 }}>Aucun stagiaire à évaluer pour le moment</p>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                  {stagiaires.map(s => (
                    <EvaluationCard key={s.id} stagiaire={s} token={localStorage.getItem('token') || ''} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* ═══ MESSAGES ═══ */}
          {vue === 'messages' && (
            <MessagesVue stagiaires={stagiaires} token={localStorage.getItem('token') || ''} />
          )}
          {vue === 'parametres' && (
            <>
              <div style={{ marginBottom:24 }}>
                <h1 style={titrePage}>Paramètres</h1>
                <p style={{ margin:'4px 0 0', fontSize:15, color:'#2f55b0' }}>Gérez votre profil et vos préférences</p>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

                {/* ── Photo de profil ── */}
                <section style={{ ...CARTE, padding:'28px 32px', gridColumn:'1/-1' }}>
                  <h2 style={{ margin:'0 0 20px', fontSize:16, fontWeight:700, color:NAVY }}>Photo de profil</h2>
                  <div style={{ display:'flex', alignItems:'center', gap:24 }}>
                    {/* Avatar */}
                    <div style={{ position:'relative', width:96, height:96, borderRadius:'50%', overflow:'hidden', background:'linear-gradient(135deg,#1d6fe8,#0b2f7a)', flexShrink:0, cursor:'pointer' }}
                      onClick={()=>document.getElementById('avatar-input')?.click()}>
                      {(avatarPreview || avatarUrl) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarPreview || avatarUrl!} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                      ) : (
                        <span style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, fontWeight:700, color:'#fff' }}>
                          {encadreur?.prenom?.[0]?.toUpperCase()}{encadreur?.nom?.[0]?.toUpperCase()}
                        </span>
                      )}
                      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.3)', display:'flex', alignItems:'center', justifyContent:'center', opacity:0, transition:'opacity .2s' }}
                        onMouseEnter={e=>(e.currentTarget.style.opacity='1')} onMouseLeave={e=>(e.currentTarget.style.opacity='0')}>
                        <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="#fff" strokeWidth={2}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                      </div>
                    </div>
                    <input id="avatar-input" type="file" accept="image/jpeg,image/png,image/webp" style={{ display:'none' }}
                      onChange={e=>{
                        const f = e.target.files?.[0]
                        if(!f) return
                        setAvatarFichier(f)
                        const reader = new FileReader()
                        reader.onload = ev => setAvatarPreview(ev.target?.result as string)
                        reader.readAsDataURL(f)
                      }}/>
                    <div>
                      <p style={{ margin:'0 0 8px', fontSize:14, color:NAVY, fontWeight:600 }}>
                        {avatarFichier ? avatarFichier.name : 'Cliquez sur l\'avatar pour changer la photo'}
                      </p>
                      <p style={{ margin:0, fontSize:12, color:MUTED }}>JPG, PNG ou WEBP · Max 2MB</p>
                      {avatarFichier && (
                        <button onClick={()=>{ setAvatarFichier(null); setAvatarPreview(null) }}
                          style={{ marginTop:8, padding:'4px 10px', border:'1px solid #d1d9f0', borderRadius:6, background:'#fff', color:MUTED, fontSize:12, cursor:'pointer' }}>
                          Annuler
                        </button>
                      )}
                    </div>
                  </div>
                </section>

                {/* ── Informations personnelles ── */}
                <section style={{ ...CARTE, padding:'28px 32px' }}
                  onClick={()=>{ if(!profilForm.nom) chargerProfil() }}>
                  <h2 style={{ margin:'0 0 20px', fontSize:16, fontWeight:700, color:NAVY }}>Informations personnelles</h2>
                  <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                    {[
                      { label:'Prénom', key:'prenom', placeholder:'Votre prénom' },
                      { label:'Nom', key:'nom', placeholder:'Votre nom' },
                      { label:'Email', key:'email', placeholder:'votre@email.com', type:'email' },
                      { label:'Téléphone', key:'telephone', placeholder:'+221 7X XXX XX XX' },
                      { label:'Filière enseignée', key:'filiere', placeholder:'ex: Génie Logiciel' },
                      { label:'Département / Bureau', key:'secteur', placeholder:'ex: Bureau B204' },
                    ].map(({ label, key, placeholder, type }) => (
                      <div key={key}>
                        <label style={{ display:'block', fontSize:12, fontWeight:600, color:MUTED, marginBottom:5 }}>{label}</label>
                        <input
                          type={type || 'text'}
                          value={profilForm[key as keyof typeof profilForm]}
                          onChange={e => setProfilForm(prev => ({ ...prev, [key]: e.target.value }))}
                          onFocus={()=>{ if(!profilForm.nom) chargerProfil() }}
                          placeholder={placeholder}
                          style={{ width:'100%', padding:'9px 12px', border:'1px solid #d1d9f0', borderRadius:8, fontSize:13, color:NAVY, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }}
                        />
                      </div>
                    ))}
                    {profilSauvegarde && (
                      <p style={{ margin:0, fontSize:13, fontWeight:600, color: profilSauvegarde.startsWith('✓') ? '#15803d' : '#b91c1c' }}>{profilSauvegarde}</p>
                    )}
                    <button onClick={sauvegarderProfil} disabled={profilEnCours || avatarEnCours}
                      style={{ padding:'11px 0', background:BLUE, color:'#fff', border:'none', borderRadius:10, fontWeight:600, fontSize:14, cursor: profilEnCours ? 'not-allowed' : 'pointer', opacity: profilEnCours ? 0.7 : 1, marginTop:4 }}>
                      {profilEnCours ? 'Sauvegarde…' : avatarEnCours ? 'Upload photo…' : 'Sauvegarder les modifications'}
                    </button>
                  </div>
                </section>

                {/* ── Sécurité ── */}
                <section style={{ ...CARTE, padding:'28px 32px' }}>
                  <h2 style={{ margin:'0 0 20px', fontSize:16, fontWeight:700, color:NAVY }}>Sécurité</h2>
                  <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                    {[
                      { label:'Ancien mot de passe', key:'ancien', placeholder:'••••••••' },
                      { label:'Nouveau mot de passe', key:'nouveau', placeholder:'Min. 6 caractères' },
                      { label:'Confirmer le nouveau mot de passe', key:'confirmation', placeholder:'••••••••' },
                    ].map(({ label, key, placeholder }) => (
                      <div key={key}>
                        <label style={{ display:'block', fontSize:12, fontWeight:600, color:MUTED, marginBottom:5 }}>{label}</label>
                        <input type="password" value={mdpForm[key as keyof typeof mdpForm]}
                          onChange={e => setMdpForm(prev => ({ ...prev, [key]: e.target.value }))}
                          placeholder={placeholder}
                          style={{ width:'100%', padding:'9px 12px', border:'1px solid #d1d9f0', borderRadius:8, fontSize:13, color:NAVY, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }}/>
                      </div>
                    ))}
                    {mdpSauvegarde && (
                      <p style={{ margin:0, fontSize:13, fontWeight:600, color: mdpSauvegarde.startsWith('✓') ? '#15803d' : '#b91c1c' }}>{mdpSauvegarde}</p>
                    )}
                    <button onClick={changerMotDePasse} disabled={mdpEnCours || !mdpForm.ancien || !mdpForm.nouveau}
                      style={{ padding:'11px 0', background:NAVY, color:'#fff', border:'none', borderRadius:10, fontWeight:600, fontSize:14, cursor: mdpEnCours ? 'not-allowed' : 'pointer', opacity: mdpEnCours ? 0.7 : 1, marginTop:4 }}>
                      {mdpEnCours ? 'Changement…' : 'Changer le mot de passe'}
                    </button>
                  </div>
                </section>

                {/* ── Notifications ── */}
                <section style={{ ...CARTE, padding:'28px 32px', gridColumn:'1/-1' }}>
                  <h2 style={{ margin:'0 0 20px', fontSize:16, fontWeight:700, color:NAVY }}>Préférences de notifications</h2>
                  <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                    {[
                      { label:'Alertes journal de bord', desc:'Recevoir une alerte quand un étudiant est en retard', val:notifJournal, set:setNotifJournal },
                      { label:'Rappels hebdomadaires', desc:'Résumé hebdomadaire des activités de vos stagiaires', val:notifRappel, set:setNotifRappel },
                    ].map(({ label, desc, val, set }) => (
                      <div key={label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', background:'#f8faff', borderRadius:10 }}>
                        <div>
                          <p style={{ margin:0, fontSize:14, fontWeight:600, color:NAVY }}>{label}</p>
                          <p style={{ margin:'3px 0 0', fontSize:12, color:MUTED }}>{desc}</p>
                        </div>
                        <div onClick={()=>set(!val)} style={{ width:44, height:24, borderRadius:12, background: val ? BLUE : '#d1d9f0', cursor:'pointer', position:'relative', transition:'background .2s', flexShrink:0 }}>
                          <div style={{ position:'absolute', top:3, left: val ? 23 : 3, width:18, height:18, borderRadius:'50%', background:'#fff', transition:'left .2s', boxShadow:'0 1px 3px rgba(0,0,0,.2)' }}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}