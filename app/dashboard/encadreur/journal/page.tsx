'use client'

import { useState, useEffect, useRef, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'

const LARGEUR_MAQUETTE = 1672
const abonnerRedimension = (cb: () => void) => { window.addEventListener('resize', cb); return () => window.removeEventListener('resize', cb) }
const lireLargeur    = () => window.innerWidth
const largeurServeur = () => LARGEUR_MAQUETTE

const NAVY  = '#0b2f7a'
const BLUE  = '#1d6fe8'
const MUTED = '#6b7a99'
const BG    = '#f0f4f8'
const WHITE = '#ffffff'

interface JournalItem {
  id: number
  semaine: number
  contenu: string
  statut: 'EN_ATTENTE' | 'VALIDE' | 'REJETE'
  dateDepot: string
  commentaire: string | null
  alerte: boolean
  dateDebut: string
  dateFin: string
  stage: {
    etudiant: { id: number; nom: string; prenom: string; email: string }
  }
}
interface Profil { nom: string; prenom: string }

function statutJ(s: string) {
  if (s === 'VALIDE') return { label: 'Validé',     color: '#15803d', bg: '#dcfce7' }
  if (s === 'REJETE') return { label: 'Rejeté',     color: '#dc2626', bg: '#fee2e2' }
  return                     { label: 'En attente', color: '#d97706', bg: '#fef3c7' }
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}
function initiales(nom: string, prenom: string) {
  return `${(prenom || '')[0] || ''}${(nom || '')[0] || ''}`.toUpperCase()
}

const MENU_ENCADREUR = [
  { id: 'tableau',    label: 'Tableau de bord',  href: '/dashboard/encadreur',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/></svg> },
  { id: 'stagiaires', label: 'Mes stagiaires',   href: '/dashboard/encadreur/stagiaires',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8"/><path d="M17 14c2.8 0 4.5 2 4.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
  { id: 'journal',    label: 'Journaux de bord', href: '/dashboard/encadreur/journal',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="1.8"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="1.8"/></svg> },
  { id: 'evaluations', label: 'Évaluations',     href: '/dashboard/encadreur',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="1.8"/></svg> },
  { id: 'messages',   label: 'Messages',          href: '/dashboard/encadreur',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.8"/></svg> },
  { id: 'parametres', label: 'Paramètres',        href: '/dashboard/encadreur',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="1.8"/></svg> },
]

export default function EncadreurJournalPage() {
  const router   = useRouter()
  const tokenRef = useRef('')

  const largeur = useSyncExternalStore(abonnerRedimension, lireLargeur, largeurServeur)
  const echelle = largeur / LARGEUR_MAQUETTE

  const [profil,      setProfil]      = useState<Profil | null>(null)
  const [journaux,    setJournaux]    = useState<JournalItem[]>([])
  const [chargement,  setChargement]  = useState(true)
  const [filtre,      setFiltre]      = useState<'TOUS' | 'EN_ATTENTE' | 'VALIDE' | 'REJETE'>('TOUS')
  const [selected,    setSelected]    = useState<JournalItem | null>(null)
  const [commentaire, setCommentaire] = useState('')
  const [envoi,       setEnvoi]       = useState(false)
  const [msgSucces,   setMsgSucces]   = useState('')
  const [msgErreur,   setMsgErreur]   = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token') || ''
    tokenRef.current = token
    if (!token) { router.push('/login'); return }
    const headers = { Authorization: `Bearer ${token}` }
    Promise.all([
      fetch('/api/auth/me', { headers }).then(r => r.json()),
      fetch('/api/encadreur/journal', { headers }).then(r => r.json()),
    ]).then(([me, data]) => {
      if (!me.user) { router.push('/login'); return }
      setProfil({ nom: me.user.nom, prenom: me.user.prenom })
      const liste = Array.isArray(data) ? data : (data.journaux || data.journal || [])
      setJournaux(liste)
    }).catch(() => setMsgErreur('Erreur de chargement')).finally(() => setChargement(false))
  }, [router])

  async function valider(id: number, action: 'VALIDE' | 'REJETE') {
    setEnvoi(true); setMsgSucces(''); setMsgErreur('')
    try {
      const r = await fetch(`/api/encadreur/journal/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRef.current}` },
        body: JSON.stringify({ statut: action, commentaire: commentaire.trim() || null }),
      })
      const d = await r.json()
      if (!r.ok) { setMsgErreur(d.message || 'Erreur'); return }
      setMsgSucces(action === 'VALIDE' ? 'Journal validé !' : 'Journal rejeté')
      setJournaux(prev => prev.map(j => j.id === id ? { ...j, statut: action, commentaire: commentaire.trim() || null } : j))
      setSelected(null); setCommentaire('')
    } catch { setMsgErreur('Erreur réseau') }
    finally { setEnvoi(false) }
  }

  const liste     = journaux.filter(j => filtre === 'TOUS' || j.statut === filtre)
  const enAttente = journaux.filter(j => j.statut === 'EN_ATTENTE').length

  if (chargement) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BG }}>
      <div style={{ width: 48, height: 48, border: `4px solid ${BLUE}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ zoom: echelle } as React.CSSProperties & { zoom?: number }}>
      <div style={{ display: 'flex', minHeight: `${100 / echelle}vh`, background: BG, fontFamily: "'Inter','Segoe UI',sans-serif" }}>

        {/* Sidebar */}
        <aside style={{ width: 260, background: NAVY, color: WHITE, display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 100 }}>
          <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, background: BLUE, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}>
                {profil ? initiales(profil.nom, profil.prenom) : 'E'}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{profil ? `${profil.prenom} ${profil.nom}` : '…'}</div>
                <div style={{ fontSize: 11, opacity: 0.65, marginTop: 2 }}>Encadreur</div>
              </div>
            </div>
          </div>
          <nav style={{ flex: 1, padding: '16px 0', overflowY: 'auto' }}>
            {MENU_ENCADREUR.map(item => {
              const actif = item.id === 'journal'
              return (
                <button key={item.id} onClick={() => router.push(item.href)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '11px 24px', background: actif ? 'rgba(29,111,232,0.18)' : 'transparent', color: actif ? WHITE : 'rgba(255,255,255,0.7)', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: actif ? 600 : 400, borderLeft: actif ? `3px solid ${BLUE}` : '3px solid transparent', textAlign: 'left', position: 'relative' }}>
                  {item.icon}{item.label}
                  {item.id === 'journal' && enAttente > 0 && (
                    <span style={{ position: 'absolute', right: 16, background: '#ef4444', color: WHITE, borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                      {enAttente}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
          <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <button onClick={() => { localStorage.removeItem('token'); router.push('/login') }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.65)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, width: '100%', padding: '8px 0' }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Déconnexion
            </button>
          </div>
        </aside>

        {/* Contenu principal */}
        <main style={{ marginLeft: 260, flex: 1, padding: '32px 40px' }}>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: NAVY, margin: 0 }}>Journaux de bord</h1>
            <p style={{ color: MUTED, marginTop: 4, fontSize: 14 }}>Validez ou rejetez les rapports hebdomadaires de vos stagiaires</p>
          </div>

          {msgSucces && <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#15803d', fontSize: 14 }}>✓ {msgSucces}</div>}
          {msgErreur && <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#dc2626', fontSize: 14 }}>✗ {msgErreur}</div>}

          {/* Filtres */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
            {(['TOUS', 'EN_ATTENTE', 'VALIDE', 'REJETE'] as const).map(f => {
              const count = f === 'TOUS' ? journaux.length : journaux.filter(j => j.statut === f).length
              const labels: Record<string, string> = { TOUS: 'Tous', EN_ATTENTE: 'En attente', VALIDE: 'Validés', REJETE: 'Rejetés' }
              const colors: Record<string, string> = { TOUS: NAVY, EN_ATTENTE: '#d97706', VALIDE: '#15803d', REJETE: '#dc2626' }
              return (
                <button key={f} onClick={() => setFiltre(f)}
                  style={{ background: filtre === f ? colors[f] : WHITE, color: filtre === f ? WHITE : MUTED, border: `1.5px solid ${filtre === f ? colors[f] : '#e2e8f0'}`, borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  {labels[f]} ({count})
                </button>
              )
            })}
          </div>

          {enAttente > 0 && (
            <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#92400e', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="1.8"/><line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              <strong>{enAttente} rapport{enAttente > 1 ? 's' : ''}</strong> en attente de validation
            </div>
          )}

          {liste.length === 0 ? (
            <div style={{ background: WHITE, borderRadius: 14, padding: '48px 32px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
              <p style={{ color: MUTED, fontSize: 15 }}>Aucun journal</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {liste.map(j => {
                const st  = statutJ(j.statut)
                const etd = j.stage.etudiant
                return (
                  <div key={j.id} style={{ background: WHITE, borderRadius: 14, border: `1.5px solid ${j.alerte ? '#fde68a' : '#e2e8f0'}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 44, height: 44, background: `${BLUE}15`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontWeight: 700, fontSize: 16, color: BLUE }}>{initiales(etd.nom, etd.prenom)}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 15, color: NAVY }}>
                        {etd.prenom} {etd.nom}
                        {j.alerte && <span style={{ marginLeft: 8, background: '#fef3c7', color: '#92400e', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>⚠ Alerte</span>}
                      </div>
                      <div style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>Semaine {j.semaine} · {fmtDate(j.dateDebut)} – {fmtDate(j.dateFin)}</div>
                      <div style={{ fontSize: 13, color: NAVY, marginTop: 6, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{j.contenu}</div>
                    </div>
                    <div style={{ flexShrink: 0, textAlign: 'right' }}>
                      <span style={{ display: 'inline-block', background: st.bg, color: st.color, borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>{st.label}</span>
                      <div style={{ fontSize: 11, color: MUTED, marginBottom: 8 }}>Déposé le {fmtDate(j.dateDepot)}</div>
                      {j.statut === 'EN_ATTENTE' && (
                        <button onClick={() => { setSelected(j); setCommentaire('') }}
                          style={{ background: BLUE, color: WHITE, border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                          Évaluer
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </main>

        {/* Modal */}
        {selected && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            onClick={e => { if (e.target === e.currentTarget) setSelected(null) }}>
            <div style={{ background: WHITE, borderRadius: 16, padding: 32, width: '100%', maxWidth: 560, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: NAVY, margin: '0 0 4px' }}>Évaluer — Semaine {selected.semaine}</h2>
              <p style={{ fontSize: 13, color: MUTED, margin: '0 0 20px' }}>{selected.stage.etudiant.prenom} {selected.stage.etudiant.nom}</p>
              <div style={{ background: BG, borderRadius: 10, padding: 16, marginBottom: 20, maxHeight: 180, overflowY: 'auto' }}>
                <p style={{ fontSize: 13, color: NAVY, lineHeight: 1.7, margin: 0 }}>{selected.contenu}</p>
              </div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 8 }}>Commentaire (optionnel)</label>
              <textarea value={commentaire} onChange={e => setCommentaire(e.target.value)} placeholder="Remarques pour l'étudiant…" rows={3}
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #d1d9e6', borderRadius: 10, fontSize: 14, resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button onClick={() => valider(selected.id, 'VALIDE')} disabled={envoi}
                  style={{ flex: 1, background: '#15803d', color: WHITE, border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: envoi ? 'not-allowed' : 'pointer', opacity: envoi ? 0.7 : 1 }}>✓ Valider</button>
                <button onClick={() => valider(selected.id, 'REJETE')} disabled={envoi}
                  style={{ flex: 1, background: '#dc2626', color: WHITE, border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: envoi ? 'not-allowed' : 'pointer', opacity: envoi ? 0.7 : 1 }}>✗ Rejeter</button>
                <button onClick={() => setSelected(null)}
                  style={{ padding: '12px 20px', background: 'transparent', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, color: MUTED, cursor: 'pointer' }}>Annuler</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}