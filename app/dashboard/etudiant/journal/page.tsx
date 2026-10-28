'use client'

import { useState, useEffect, useRef, useSyncExternalStore, type ReactNode, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

// ─── Types ───────────────────────────────────────────────────────────────────

interface JournalEntry {
  id: number
  semaine: number
  contenu: string
  statut: 'EN_ATTENTE' | 'VALIDE' | 'REJETE'
  commentaire: string | null
  createdAt: string
  updatedAt: string
}

// ─── Constantes visuelles ─────────────────────────────────────────────────────

const NAVY = '#0b2f7a'
const BLUE = '#1d6fe8'
const MUTED = '#6b7a99'
const LARGEUR_MAQUETTE = 1440

const CARTE: CSSProperties = {
  background: '#fff', borderRadius: 14,
  border: '1px solid #eef2fa', boxShadow: '0 2px 10px rgba(30,70,150,0.06)',
}

const STATUTS = {
  EN_ATTENTE: { label: 'En attente',  bg: '#fff8e1', color: '#f59e0b' },
  VALIDE:     { label: 'Validé',      bg: '#e8f5e9', color: '#22c55e' },
  REJETE:     { label: 'Rejeté',      bg: '#fce8e8', color: '#ef4444' },
}

// ─── Resize hook ──────────────────────────────────────────────────────────────

const abonnerRedimension = (cb: () => void) => {
  window.addEventListener('resize', cb)
  return () => window.removeEventListener('resize', cb)
}
const lireLargeur = () => window.innerWidth
const largeurServeur = () => LARGEUR_MAQUETTE

// ─── Icônes ───────────────────────────────────────────────────────────────────

const ICONS = {
  home:     <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/>,
  doc:      (<><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></>),
  plus:     (<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>),
  logout:   <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>,
  bell:     (<><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>),
  clock:    (<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></>),
  check:    (<><circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/></>),
  x:        (<><circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/></>),
  chevron:  <path d="M9 18l6-6-6-6"/>,
  edit:     (<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>),
  user:     (<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>),
} satisfies Record<string, ReactNode>

type IconName = keyof typeof ICONS

function Icon({ name, size = 20, sw = 1.8 }: { name: IconName; size?: number; sw?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none"
      stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" style={{ flexShrink: 0 }}>
      {ICONS[name]}
    </svg>
  )
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

// ─── Page principale ──────────────────────────────────────────────────────────

export default function EtudiantJournalPage() {
  const router = useRouter()
  const largeur = useSyncExternalStore(abonnerRedimension, lireLargeur, largeurServeur)

  const [etudiant, setEtudiant] = useState<{ nom: string; prenom: string } | null>(null)
  const [chargement, setChargement] = useState(true)
  const [journaux, setJournaux] = useState<JournalEntry[]>([])
  const [erreur, setErreur] = useState('')
  const tokenRef = useRef('')

  // Formulaire nouvelle entrée
  const [afficherFormulaire, setAfficherFormulaire] = useState(false)
  const [semaine, setSemaine] = useState(1)
  const [contenu, setContenu] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [messageEnvoi, setMessageEnvoi] = useState('')

  // Entrée sélectionnée pour détail
  const [detail, setDetail] = useState<JournalEntry | null>(null)

  useEffect(() => {
    async function init() {
      const token = localStorage.getItem('token') || ''
      const role  = localStorage.getItem('role')
      if (!token || role !== 'ETUDIANT') { router.push('/login'); return }
      tokenRef.current = token

      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setEtudiant({ nom: payload.nom ?? '', prenom: payload.prenom ?? '' })
      } catch { /* ignore */ }

      await chargerJournaux(token)
      setChargement(false)
    }
    init().catch(() => setChargement(false))
  }, [router])

  const chargerJournaux = async (token: string) => {
    try {
      const res = await fetch('/api/etudiant/journal', {
        headers: { authorization: `Bearer ${token}` },
      })
      if (res.status === 401 || res.status === 403) { router.push('/login'); return }
      if (!res.ok) { setErreur('Impossible de charger le journal'); return }
      const data = await res.json()
      setJournaux(data.journaux ?? [])
      setErreur('')
    } catch {
      setErreur('Impossible de contacter le serveur.')
    }
  }

  const soumettre = async () => {
    if (!contenu.trim()) { setMessageEnvoi('⚠ Le contenu ne peut pas être vide'); return }
    setEnvoi(true); setMessageEnvoi('')
    try {
      const res = await fetch('/api/etudiant/journal', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${tokenRef.current}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ semaine, contenu: contenu.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessageEnvoi('✓ Entrée soumise avec succès')
        setContenu('')
        setSemaine(prev => prev + 1)
        await chargerJournaux(tokenRef.current)
        setTimeout(() => { setAfficherFormulaire(false); setMessageEnvoi('') }, 1500)
      } else {
        setMessageEnvoi(data.error ?? data.message ?? 'Erreur lors de la soumission')
      }
    } catch {
      setMessageEnvoi('Erreur serveur')
    } finally {
      setEnvoi(false)
    }
  }

  const seDeconnecter = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    document.cookie = 'token=; path=/; max-age=0'
    router.push('/login')
  }

  if (chargement) {
    return (
      <div style={{ display:'flex', minHeight:'100vh', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#0b2f7a 0%,#1d6fe8 100%)' }}>
        <div style={{ fontSize:20, color:'#fff' }}>Chargement…</div>
      </div>
    )
  }

  const bureau = largeur >= 900
  const echelle = bureau ? Math.min(Math.max(largeur / LARGEUR_MAQUETTE, 0.7), 1.4) : 1
  const nomEtudiant = etudiant ? `${etudiant.prenom} ${etudiant.nom}`.trim() : ''
  const initialesEtu = etudiant ? `${etudiant.prenom[0] ?? ''}${etudiant.nom[0] ?? ''}`.toUpperCase() : 'E'

  // Statistiques rapides
  const total      = journaux.length
  const enAttente  = journaux.filter(j => j.statut === 'EN_ATTENTE').length
  const valides    = journaux.filter(j => j.statut === 'VALIDE').length
  const rejetes    = journaux.filter(j => j.statut === 'REJETE').length

  // Numéro de semaine suggéré (max existant + 1)
  const prochaineSemaine = journaux.length > 0
    ? Math.max(...journaux.map(j => j.semaine)) + 1
    : 1

  return (
    <div style={{ minHeight:'100vh', background:'#f4f7fc', zoom: echelle }}>

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header style={{ position:'sticky', top:0, zIndex:20, display:'flex', alignItems:'center', gap:16, height:68, padding:'0 28px', background:'#fff', borderBottom:'1px solid #eef2fa' }}>
        {/* Logo */}
        <div style={{ position:'relative', width:40, height:40, flexShrink:0, overflow:'hidden', borderRadius:'50%', background:'#f0f4ff' }}>
          <Image src="/logo-ipd.png" alt="IPD" fill sizes="40px" style={{ objectFit:'contain' }} />
        </div>
        <span style={{ fontSize:14, fontWeight:700, color:NAVY, marginRight:'auto' }}>Journal de bord</span>

        {/* Navigation rapide */}
        <button onClick={() => router.push('/dashboard/etudiant')}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:8, border:'1px solid #e2e8f0', background:'transparent', cursor:'pointer', color:NAVY, fontSize:13, fontWeight:500 }}>
          <Icon name="home" size={16}/> Tableau de bord
        </button>

        {/* Profil */}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:'50%', background:BLUE, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:13 }}>
            {initialesEtu}
          </div>
          <span style={{ fontSize:13, fontWeight:600, color:NAVY }}>{nomEtudiant}</span>
        </div>

        <button onClick={seDeconnecter}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 12px', borderRadius:8, border:'none', background:'transparent', cursor:'pointer', color:'#dc2626', fontSize:13 }}>
          <Icon name="logout" size={16}/>
        </button>
      </header>

      {/* ── CONTENU ────────────────────────────────────────────────────── */}
      <main style={{ maxWidth:900, margin:'0 auto', padding: bureau ? '32px 28px' : '20px 16px' }}>

        {/* Titre + bouton nouvelle entrée */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
          <div>
            <h1 style={{ margin:0, fontSize:26, fontWeight:800, color:NAVY }}>Mon journal de bord</h1>
            <p style={{ margin:'4px 0 0', fontSize:14, color:MUTED }}>Soumettez vos comptes rendus hebdomadaires à votre encadreur</p>
          </div>
          <button onClick={() => { setAfficherFormulaire(true); setSemaine(prochaineSemaine); setMessageEnvoi('') }}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 18px', background:BLUE, color:'#fff', border:'none', borderRadius:10, fontWeight:600, fontSize:14, cursor:'pointer' }}>
            <Icon name="plus" size={18}/> Nouvelle entrée
          </button>
        </div>

        {/* Erreur globale */}
        {erreur && (
          <div role="alert" style={{ marginBottom:20, padding:'12px 20px', borderRadius:10, background:'#fef2f2', border:'1px solid #fecaca', color:'#b91c1c', fontSize:14 }}>
            {erreur}
          </div>
        )}

        {/* ── Cartes stats ── */}
        <div style={{ display:'grid', gridTemplateColumns: bureau ? 'repeat(4,1fr)' : 'repeat(2,1fr)', gap:14, marginBottom:28 }}>
          {[
            { label:'Total',       valeur:total,     fond:'#e8f0fe', couleur:'#1d6fe8' },
            { label:'En attente',  valeur:enAttente,  fond:'#fff8e1', couleur:'#f59e0b' },
            { label:'Validés',     valeur:valides,    fond:'#e8f5e9', couleur:'#22c55e' },
            { label:'Rejetés',     valeur:rejetes,    fond:'#fce8e8', couleur:'#ef4444' },
          ].map(c => (
            <div key={c.label} style={{ ...CARTE, padding:'18px 20px' }}>
              <p style={{ margin:'0 0 6px', fontSize:12, color:MUTED, fontWeight:500 }}>{c.label}</p>
              <p style={{ margin:0, fontSize:30, fontWeight:800, color:c.couleur }}>{c.valeur}</p>
            </div>
          ))}
        </div>

        {/* ── Formulaire nouvelle entrée ── */}
        {afficherFormulaire && (
          <div style={{ ...CARTE, padding:'24px 28px', marginBottom:24 }}>
            <h2 style={{ margin:'0 0 20px', fontSize:17, fontWeight:700, color:NAVY }}>Nouvelle entrée — Semaine {semaine}</h2>

            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:MUTED, marginBottom:6 }}>Numéro de semaine</label>
              <input type="number" min={1} max={52} value={semaine} onChange={e => setSemaine(Number(e.target.value))}
                style={{ width:120, padding:'8px 12px', border:'1px solid #d1d9f0', borderRadius:8, fontSize:14, color:NAVY, outline:'none' }} />
            </div>

            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:MUTED, marginBottom:6 }}>Compte rendu de la semaine *</label>
              <textarea value={contenu} onChange={e => setContenu(e.target.value)}
                placeholder="Décrivez les tâches effectuées, les apprentissages, les difficultés rencontrées…"
                rows={6}
                style={{ width:'100%', padding:'10px 12px', border:'1px solid #d1d9f0', borderRadius:8, fontSize:14, color:NAVY, resize:'vertical', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }} />
              <p style={{ margin:'4px 0 0', fontSize:11, color:MUTED }}>{contenu.length} caractère(s)</p>
            </div>

            {messageEnvoi && (
              <p style={{ margin:'0 0 12px', fontSize:13, fontWeight:600, color: messageEnvoi.startsWith('✓') ? '#15803d' : '#b45309' }}>
                {messageEnvoi}
              </p>
            )}

            <div style={{ display:'flex', gap:12 }}>
              <button onClick={soumettre} disabled={envoi}
                style={{ padding:'10px 24px', background:BLUE, color:'#fff', border:'none', borderRadius:10, fontWeight:600, fontSize:14, cursor:envoi?'not-allowed':'pointer', opacity:envoi?0.7:1 }}>
                {envoi ? 'Envoi…' : 'Soumettre'}
              </button>
              <button onClick={() => { setAfficherFormulaire(false); setMessageEnvoi('') }}
                style={{ padding:'10px 20px', background:'transparent', color:MUTED, border:'1px solid #d1d9f0', borderRadius:10, fontWeight:600, fontSize:14, cursor:'pointer' }}>
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* ── Liste des journaux ── */}
        {journaux.length === 0 && !afficherFormulaire ? (
          <div style={{ ...CARTE, padding:'60px 40px', textAlign:'center', color:MUTED }}>
            <Icon name="doc" size={48}/>
            <p style={{ margin:'16px 0 8px', fontSize:16, fontWeight:600, color:NAVY }}>Aucune entrée pour l&apos;instant</p>
            <p style={{ margin:0, fontSize:14 }}>Cliquez sur &laquo; Nouvelle entrée &raquo; pour soumettre votre premier compte rendu.</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {journaux
              .slice()
              .sort((a, b) => b.semaine - a.semaine)
              .map(j => {
                const s = STATUTS[j.statut] ?? STATUTS.EN_ATTENTE
                return (
                  <div key={j.id} style={{ ...CARTE, padding:'20px 24px', cursor:'pointer', transition:'box-shadow .15s' }}
                    onClick={() => setDetail(detail?.id === j.id ? null : j)}>
                    <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                      {/* Icône statut */}
                      <div style={{ width:42, height:42, borderRadius:'50%', background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        {j.statut === 'VALIDE'    && <Icon name="check" size={20} sw={2}/>}
                        {j.statut === 'REJETE'    && <Icon name="x"     size={20} sw={2}/>}
                        {j.statut === 'EN_ATTENTE'&& <Icon name="clock" size={20} sw={2}/>}
                      </div>

                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                          <span style={{ fontSize:15, fontWeight:700, color:NAVY }}>Semaine {j.semaine}</span>
                          <span style={{ padding:'3px 10px', borderRadius:20, background:s.bg, color:s.color, fontSize:12, fontWeight:600 }}>{s.label}</span>
                        </div>
                        <p style={{ margin:0, fontSize:13, color:MUTED }}>Soumis le {formatDate(j.createdAt)}</p>
                      </div>

                      <Icon name="chevron" size={18} sw={2}/>
                    </div>

                    {/* Détail dépliable */}
                    {detail?.id === j.id && (
                      <div style={{ marginTop:16, paddingTop:16, borderTop:'1px solid #eef2fa' }}
                        onClick={e => e.stopPropagation()}>
                        <p style={{ margin:'0 0 8px', fontSize:12, fontWeight:600, color:MUTED, textTransform:'uppercase', letterSpacing:.5 }}>Contenu</p>
                        <p style={{ margin:'0 0 16px', fontSize:14, color:NAVY, lineHeight:1.7, whiteSpace:'pre-wrap' }}>{j.contenu}</p>

                        {j.commentaire && (
                          <>
                            <p style={{ margin:'0 0 8px', fontSize:12, fontWeight:600, color:MUTED, textTransform:'uppercase', letterSpacing:.5 }}>Commentaire de l&apos;encadreur</p>
                            <div style={{ padding:'12px 16px', borderRadius:8, background: j.statut==='VALIDE' ? '#e8f5e9' : '#fce8e8', borderLeft:`3px solid ${s.color}` }}>
                              <p style={{ margin:0, fontSize:14, color:NAVY, lineHeight:1.6 }}>{j.commentaire}</p>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        )}
      </main>
    </div>
  )
}
