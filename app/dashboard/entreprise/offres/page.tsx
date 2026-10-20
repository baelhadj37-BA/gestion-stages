'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const NAV = [
  {
    label: 'Tableau de bord', href: '/dashboard/entreprise', actif: false,
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/></svg>,
  },
  {
    label: 'Mes offres de stage', href: '/dashboard/entreprise/offres', actif: true,
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="currentColor" strokeWidth="1.8"/></svg>,
  },
  {
    label: 'Candidatures reçues', href: '/dashboard/entreprise/candidatures', actif: false,
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.8"/><polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="1.8"/><line x1="9" y1="13" x2="15" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="9" y1="17" x2="13" y2="17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  },
  {
    label: 'Mon entreprise', href: '/dashboard/entreprise/profil', actif: false,
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="15" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="currentColor" strokeWidth="1.8"/><line x1="12" y1="12" x2="12" y2="17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="9.5" y1="14.5" x2="14.5" y2="14.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  },
  {
    label: 'Paramètres', href: '/dashboard/entreprise/parametres', actif: false,
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="1.8"/></svg>,
  },
]

const OFFRES_DEMO = [
  { id: 1, titre: 'Développeur Web Full Stack',  domaine: 'Informatique', duree: '6 mois', candidatures: 8,  statut: 'Publiée',    statutColor: '#15803d', statutBg: '#dcfce7', date: '10 oct. 2025' },
  { id: 2, titre: 'Assistant Marketing Digital', domaine: 'Marketing',    duree: '4 mois', candidatures: 5,  statut: 'Publiée',    statutColor: '#15803d', statutBg: '#dcfce7', date: '08 oct. 2025' },
  { id: 3, titre: 'Stagiaire Data Analyst',       domaine: 'Data Science', duree: '6 mois', candidatures: 3,  statut: 'En attente', statutColor: '#d97706', statutBg: '#fef3c7', date: '05 oct. 2025' },
  { id: 4, titre: 'Technicien Réseau',             domaine: 'Réseaux',     duree: '3 mois', candidatures: 0,  statut: 'Refusée',    statutColor: '#dc2626', statutBg: '#fee2e2', date: '01 oct. 2025' },
]

const STATS = [
  { label: 'Total offres',       count: 4,  bg: '#dbeafe', color: '#2563eb' },
  { label: 'Publiées',           count: 2,  bg: '#dcfce7', color: '#16a34a' },
  { label: 'En attente',         count: 1,  bg: '#fef3c7', color: '#d97706' },
  { label: 'Total candidatures', count: 16, bg: '#ede9fe', color: '#7c3aed' },
]

export default function EntrepriseOffres() {
  const router = useRouter()
  const [filtre, setFiltre] = useState('Toutes')
  const [profilOuvert, setProfilOuvert] = useState(false)
  const [notifsOuvertes, setNotifsOuvertes] = useState(false)
  const profilRef = useRef<HTMLDivElement>(null)
  const notifsRef = useRef<HTMLDivElement>(null)

  const filtres = ['Toutes', 'Publiée', 'En attente', 'Refusée']
  const offresFiltrees = filtre === 'Toutes' ? OFFRES_DEMO : OFFRES_DEMO.filter(o => o.statut === filtre)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profilRef.current && !profilRef.current.contains(e.target as Node)) setProfilOuvert(false)
      if (notifsRef.current && !notifsRef.current.contains(e.target as Node)) setNotifsOuvertes(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif", background: '#f0f4f8' }}>

      {/* ══ SIDEBAR ══ */}
      <aside style={{
        width: 260, minWidth: 260,
        background: 'linear-gradient(180deg, #0d1b3e 0%, #0f2052 60%, #1a3a6b 100%)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
              <img src="/logo-ipd.jpeg" alt="IPD" style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={e => {
                  const p = (e.target as HTMLImageElement).parentElement
                  if (p) p.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M2 10l10-6 10 6-10 6z" fill="#1d4ed8"/><path d="M6 12v5c0 0 2 3 6 3s6-3 6-3v-5" stroke="#1d4ed8" strokeWidth="1.5" fill="none"/></svg>`
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'white', lineHeight: 1.5, textTransform: 'uppercase', letterSpacing: 0.3 }}>Institut Polytechnique</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'white', lineHeight: 1.5, textTransform: 'uppercase', letterSpacing: 0.3 }}>de Dakar</div>
              <div style={{ fontSize: 10, color: '#93c5fd', marginTop: 1 }}>Plateforme de gestion des stages</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px' }}>
          {NAV.map(item => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', marginBottom: 2,
                background: item.actif ? '#2563eb' : 'transparent',
                color: item.actif ? 'white' : 'rgba(255,255,255,0.6)',
                fontWeight: item.actif ? 600 : 400,
                fontSize: 14, textAlign: 'left', transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!item.actif) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)' }}
              onMouseLeave={e => { if (!item.actif) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            >
              <span style={{ flexShrink: 0 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Slogan */}
        <div style={{ padding: '16px 20px 24px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 13, fontStyle: 'italic', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, textAlign: 'center' }}>
            Ensemble pour<br/>l&avenir des talents
          </div>
        </div>
      </aside>

      {/* ══ MAIN ══ */}
      <main style={{ marginLeft: 260, flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* ── Topbar ── */}
        <header style={{
          background: 'white', borderBottom: '1px solid #e8edf2',
          height: 64, padding: '0 28px',
          display: 'flex', alignItems: 'center', gap: 16,
          position: 'sticky', top: 0, zIndex: 50,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}>
          {/* Barre de recherche */}
          <div style={{ flex: 1, maxWidth: 540, position: 'relative' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <input type="text" placeholder="Rechercher une offre, une candidature..."
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px 10px 42px', border: '1.5px solid #e2e8f0', borderRadius: 24, fontSize: 13.5, color: '#374151', outline: 'none', background: '#f8fafc' }}
            />
          </div>

          <div style={{ flex: 1 }} />

          {/* Cloche */}
          <div ref={notifsRef} style={{ position: 'relative' }}>
            <button onClick={() => { setNotifsOuvertes(v => !v); setProfilOuvert(false) }}
              style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: '#64748b', display: 'flex' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.8"/>
              </svg>
              <span style={{ position: 'absolute', top: 4, right: 4, width: 18, height: 18, background: '#ef4444', borderRadius: '50%', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white' }}>2</span>
            </button>
            {notifsOuvertes && (
              <div style={{ position: 'absolute', top: 50, right: 0, width: 300, background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 200 }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', fontWeight: 700, fontSize: 14 }}>Notifications</div>
                {[
                  { texte: 'Nouvelle candidature pour "Dev Web Full Stack"', temps: 'Il y a 5 min' },
                  { texte: 'Votre offre "Technicien Réseau" a été approuvée', temps: 'Il y a 2h' },
                ].map((n, i) => (
                  <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid #f8fafc', background: '#eff6ff', cursor: 'pointer' }}>
                    <div style={{ fontSize: 13, color: '#1e293b', marginBottom: 3 }}>{n.texte}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{n.temps}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Profil */}
          <div ref={profilRef} style={{ position: 'relative' }}>
            <div onClick={() => { setProfilOuvert(v => !v); setNotifsOuvertes(false) }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '6px 10px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0 }}>AN</div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1e293b', lineHeight: 1.3 }}>Astou Ndiaye</div>
                <div style={{ fontSize: 11.5, color: '#64748b', lineHeight: 1.3 }}>Entreprise</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color: '#9ca3af' }}>
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            {profilOuvert && (
              <div style={{ position: 'absolute', top: 54, right: 0, width: 200, background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 200, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Astou Ndiaye</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Entreprise</div>
                </div>
                {[
                  { label: 'Mon profil', href: '/dashboard/entreprise/profil' },
                  { label: 'Mon entreprise', href: '/dashboard/entreprise/profil' },
                  { label: 'Paramètres', href: '/dashboard/entreprise/parametres' },
                ].map(item => (
                  <div key={item.label} onClick={() => { router.push(item.href); setProfilOuvert(false) }}
                    style={{ padding: '10px 16px', fontSize: 13, color: '#374151', cursor: 'pointer', borderBottom: '1px solid #f8fafc' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                  >{item.label}</div>
                ))}
                <div onClick={() => { localStorage.removeItem('token'); router.replace('/') }}
                  style={{ padding: '10px 16px', fontSize: 13, color: '#ef4444', cursor: 'pointer', fontWeight: 500 }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                >Se déconnecter</div>
              </div>
            )}
          </div>
        </header>

        {/* ── Contenu ── */}
        <div style={{ flex: 1, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Titre + bouton */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#1e293b' }}>Offres de stage</h1>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>{OFFRES_DEMO.length} offres publiées au total</p>
            </div>
            <button onClick={() => router.push('/dashboard/entreprise/offres/nouvelle')}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '11px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/><line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
              Publier une offre
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {STATS.map((s, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 14, padding: '18px 20px', border: '1px solid #e8edf2', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="7" width="20" height="14" rx="2" stroke={s.color} strokeWidth="1.8"/>
                    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke={s.color} strokeWidth="1.8"/>
                  </svg>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{s.count}</div>
                <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 5 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Filtres */}
          <div style={{ display: 'flex', gap: 8 }}>
            {filtres.map(f => (
              <button key={f} onClick={() => setFiltre(f)}
                style={{
                  padding: '8px 18px', borderRadius: 20, border: '1.5px solid',
                  fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  borderColor: filtre === f ? '#2563eb' : '#e2e8f0',
                  background: filtre === f ? '#2563eb' : 'white',
                  color: filtre === f ? 'white' : '#64748b',
                  transition: 'all 0.15s',
                }}>
                {f}
              </button>
            ))}
          </div>

          {/* Tableau */}
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e8edf2', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            {/* En-tête tableau */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 100px 130px 120px 140px', padding: '12px 22px', background: '#f8fafc', borderBottom: '1px solid #e8edf2' }}>
              {['Offre', 'Domaine', 'Durée', 'Candidatures', 'Statut', 'Actions'].map(h => (
                <div key={h} style={{ fontSize: 11.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
              ))}
            </div>

            {/* Lignes */}
            {offresFiltrees.map((offre, i) => (
              <div key={offre.id}
                style={{ display: 'grid', gridTemplateColumns: '1fr 140px 100px 130px 120px 140px', padding: '15px 22px', borderBottom: i < offresFiltrees.length - 1 ? '1px solid #f1f5f9' : 'none', alignItems: 'center' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#fafbfc')}
                onMouseLeave={e => (e.currentTarget.style.background = 'white')}
              >
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1e293b' }}>{offre.titre}</div>
                  <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>Publiée le {offre.date}</div>
                </div>
                <div style={{ fontSize: 13, color: '#475569' }}>{offre.domaine}</div>
                <div style={{ fontSize: 13, color: '#475569' }}>{offre.duree}</div>
                <div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#f1f5f9', borderRadius: 6, padding: '4px 10px', fontSize: 12.5, fontWeight: 600, color: '#475569' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/></svg>
                    {offre.candidatures}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: offre.statutColor, background: offre.statutBg, borderRadius: 20, padding: '4px 12px' }}>{offre.statut}</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => router.push(`/dashboard/entreprise/offres/${offre.id}`)}
                    style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 7, padding: '6px 12px', cursor: 'pointer', fontSize: 12.5, color: '#475569', fontWeight: 500 }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#e2e8f0')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#f1f5f9')}
                  >Voir</button>
                  <button onClick={() => router.push(`/dashboard/entreprise/offres/${offre.id}/modifier`)}
                    style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 7, padding: '6px 12px', cursor: 'pointer', fontSize: 12.5, color: '#475569', fontWeight: 500 }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#e2e8f0')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#f1f5f9')}
                  >Modifier</button>
                </div>
              </div>
            ))}

            {offresFiltrees.length === 0 && (
              <div style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                Aucune offre dans cette catégorie
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}