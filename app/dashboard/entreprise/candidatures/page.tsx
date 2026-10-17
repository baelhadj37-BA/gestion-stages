'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const NAV = [
  { label: 'Tableau de bord', href: '/dashboard/entreprise', actif: false, icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="1.8"/><polyline points="9,22 9,12 15,12 15,22" stroke="currentColor" strokeWidth="1.8"/></svg> },
  { label: 'Offres de stage', href: '/dashboard/entreprise/offres', actif: false, icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="currentColor" strokeWidth="1.8"/></svg> },
  { label: 'Candidatures', href: '/dashboard/entreprise/candidatures', actif: true, icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.8"/><polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="1.8"/></svg> },
  { label: 'Conventions', href: '/dashboard/entreprise/conventions', actif: false, icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="1.8"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="currentColor" strokeWidth="1.8"/></svg> },
  { label: 'Messages', href: '/dashboard/entreprise/messages', actif: false, badge: 1, icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.8"/></svg> },
  { label: 'Paramètres', href: '/dashboard/entreprise/parametres', actif: false, icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="1.8"/></svg> },
]

const CANDIDATURES_DEMO = [
  { id: 1, nom: 'Fatou Diallo',    filiere: 'Génie Logiciel L3',    offre: 'Développeur Web Full Stack',  score: 92, statut: 'En attente', date: '12 oct. 2025', avatar: 'FD' },
  { id: 2, nom: 'Ibrahima Sow',    filiere: 'Développement Web L2', offre: 'Développeur Web Full Stack',  score: 78, statut: 'En attente', date: '11 oct. 2025', avatar: 'IS' },
  { id: 3, nom: 'Mariama Balde',   filiere: 'Génie Logiciel L3',    offre: 'Développeur Web Full Stack',  score: 65, statut: 'Acceptée',   date: '10 oct. 2025', avatar: 'MB' },
  { id: 4, nom: 'Oumar Camara',    filiere: 'Informatique L2',      offre: 'Développeur Web Full Stack',  score: 45, statut: 'Refusée',    date: '09 oct. 2025', avatar: 'OC' },
  { id: 5, nom: 'Aissatou Ndiaye', filiere: 'Marketing Digital L3', offre: 'Assistant Marketing Digital', score: 88, statut: 'En attente', date: '11 oct. 2025', avatar: 'AN' },
  { id: 6, nom: 'Mamadou Diop',    filiere: 'Marketing Digital L2', offre: 'Assistant Marketing Digital', score: 72, statut: 'Acceptée',   date: '10 oct. 2025', avatar: 'MD' },
  { id: 7, nom: 'Rokhaya Fall',    filiere: 'Data Science L3',      offre: 'Stagiaire Data Analyst',      score: 81, statut: 'En attente', date: '08 oct. 2025', avatar: 'RF' },
]

export default function EntrepriseCandidatures() {
  const router = useRouter()
  const [filtre, setFiltre] = useState('Toutes')
  const [offreFiltree, setOffreFiltree] = useState('Toutes')

  const offres = ['Toutes', ...Array.from(new Set(CANDIDATURES_DEMO.map(c => c.offre)))]
  const filtres = ['Toutes', 'En attente', 'Acceptée', 'Refusée']

  const candidaturesFiltrees = CANDIDATURES_DEMO.filter(c => {
    const matchStatut = filtre === 'Toutes' || c.statut === filtre
    const matchOffre  = offreFiltree === 'Toutes' || c.offre === offreFiltree
    return matchStatut && matchOffre
  })

  const statutStyle = (s: string) => {
    if (s === 'Acceptée') return { color: '#15803d', bg: '#dcfce7' }
    if (s === 'Refusée')  return { color: '#dc2626', bg: '#fee2e2' }
    return { color: '#d97706', bg: '#fef3c7' }
  }

  const scoreColor = (n: number) => n >= 70 ? '#15803d' : n >= 50 ? '#d97706' : '#dc2626'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif", background: '#f0f4f8' }}>

      <aside style={{ width: 235, minWidth: 235, background: '#0d1b3e', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100 }}>
        <div style={{ padding: '18px 16px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'white', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/logo-ipd.jpg" alt="IPD" style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(e) => { const p = (e.target as HTMLImageElement).parentElement; if (p) p.innerHTML = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M2 10l10-6 10 6-10 6z" fill="#1d4ed8"/><path d="M6 12v5c0 0 2 3 6 3s6-3 6-3v-5" stroke="#1d4ed8" stroke-width="1.5" fill="none"/></svg>` }} />
          </div>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'white', lineHeight: 1.4, textTransform: 'uppercase' }}>Institut Polytechnique</div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'white', lineHeight: 1.4, textTransform: 'uppercase' }}>de Dakar</div>
            <div style={{ fontSize: 9.5, color: '#93c5fd', marginTop: 1 }}>Espace Entreprise</div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '8px 8px' }}>
          {NAV.map(item => (
            <button key={item.href} onClick={() => router.push(item.href)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', marginBottom: 2, background: item.actif ? '#2563eb' : 'transparent', color: item.actif ? 'white' : 'rgba(255,255,255,0.65)', fontWeight: item.actif ? 600 : 400, fontSize: 13.5, textAlign: 'left' }}>
              <span style={{ flexShrink: 0, opacity: item.actif ? 1 : 0.75 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && <span style={{ background: '#ef4444', color: 'white', fontSize: 10.5, fontWeight: 700, borderRadius: 10, padding: '1px 6px' }}>{item.badge}</span>}
            </button>
          ))}
        </nav>
        <div style={{ padding: '0 20px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'rgba(255,255,255,0.15)', fontStyle: 'italic', lineHeight: 1.3 }}>Ton avenir<br/>commence ici</div>
        </div>
      </aside>

      <main style={{ marginLeft: 235, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ background: 'white', borderBottom: '1px solid #e8edf2', height: 62, padding: '0 28px', display: 'flex', alignItems: 'center', gap: 16, position: 'sticky', top: 0, zIndex: 50 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>Candidatures reçues</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white' }}>SC</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>Senegal Corp</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Entreprise</div>
            </div>
          </div>
        </header>

        <div style={{ flex: 1, padding: '24px 28px' }}>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
            {[
              { label: 'Total',      val: CANDIDATURES_DEMO.length,                                     bg: '#dbeafe', color: '#2563eb' },
              { label: 'En attente', val: CANDIDATURES_DEMO.filter(c => c.statut === 'En attente').length, bg: '#fef3c7', color: '#d97706' },
              { label: 'Acceptées',  val: CANDIDATURES_DEMO.filter(c => c.statut === 'Acceptée').length,  bg: '#dcfce7', color: '#16a34a' },
              { label: 'Refusées',   val: CANDIDATURES_DEMO.filter(c => c.statut === 'Refusée').length,   bg: '#fee2e2', color: '#dc2626' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 12, padding: '16px 18px', border: '1px solid #e8edf2' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={s.color} strokeWidth="1.8"/><circle cx="9" cy="7" r="4" stroke={s.color} strokeWidth="1.8"/></svg>
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Filtres */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {filtres.map(f => (
                <button key={f} onClick={() => setFiltre(f)} style={{ padding: '7px 14px', borderRadius: 20, border: '1px solid', fontSize: 13, fontWeight: 500, cursor: 'pointer', borderColor: filtre === f ? '#2563eb' : '#e2e8f0', background: filtre === f ? '#2563eb' : 'white', color: filtre === f ? 'white' : '#64748b' }}>
                  {f}
                </button>
              ))}
            </div>
            <select value={offreFiltree} onChange={e => setOffreFiltree(e.target.value)} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, color: '#475569', background: 'white', cursor: 'pointer' }}>
              {offres.map(o => <option key={o} value={o}>{o === 'Toutes' ? 'Toutes les offres' : o}</option>)}
            </select>
          </div>

          {/* Table */}
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e8edf2', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px 100px 130px 160px', padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid #e8edf2' }}>
              {['Candidat', 'Offre', 'Matching', 'Statut', 'Actions'].map(h => (
                <div key={h} style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</div>
              ))}
            </div>
            {candidaturesFiltrees.map((c, i) => {
              const sc = statutStyle(c.statut)
              return (
                <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr 200px 100px 130px 160px', padding: '14px 20px', borderBottom: i < candidaturesFiltrees.length - 1 ? '1px solid #f1f5f9' : 'none', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 700, color: '#4f46e5', flexShrink: 0 }}>{c.avatar}</div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1e293b' }}>{c.nom}</div>
                      <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 1 }}>{c.filiere}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12.5, color: '#475569', paddingRight: 8 }}>{c.offre}</div>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: scoreColor(c.score) }}>{c.score}%</span>
                    {c.score >= 70 && <div style={{ fontSize: 10, color: '#16a34a', fontWeight: 600 }}>Recommandé</div>}
                  </div>
                  <div>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: sc.color, background: sc.bg, borderRadius: 6, padding: '3px 10px' }}>{c.statut}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {c.statut === 'En attente' && (
                      <>
                        <button style={{ background: '#dcfce7', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 11.5, color: '#15803d', fontWeight: 600 }}>Accepter</button>
                        <button style={{ background: '#fee2e2', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 11.5, color: '#dc2626', fontWeight: 600 }}>Refuser</button>
                      </>
                    )}
                    {c.statut !== 'En attente' && (
                      <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>Traité le {c.date}</span>
                    )}
                  </div>
                </div>
              )
            })}
            {candidaturesFiltrees.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                Aucune candidature dans cette catégorie
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}