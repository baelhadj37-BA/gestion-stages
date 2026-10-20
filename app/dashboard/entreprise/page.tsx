'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const NAV = [
  {
    label: 'Tableau de bord',
    href: '/dashboard/entreprise',
    actif: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
      </svg>
    ),
  },
  {
    label: 'Mes offres de stage',
    href: '/dashboard/entreprise/offres',
    actif: false,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="currentColor" strokeWidth="1.8"/>
      </svg>
    ),
  },
  {
    label: 'Candidatures reçues',
    href: '/dashboard/entreprise/candidatures',
    actif: false,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.8"/>
        <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="1.8"/>
        <line x1="9" y1="13" x2="15" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="9" y1="17" x2="13" y2="17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: 'Mon entreprise',
    href: '/dashboard/entreprise/profil',
    actif: false,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="7" width="20" height="15" rx="2" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="currentColor" strokeWidth="1.8"/>
        <line x1="12" y1="12" x2="12" y2="17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="9.5" y1="14.5" x2="14.5" y2="14.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: 'Paramètres',
    href: '/dashboard/entreprise/parametres',
    actif: false,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="1.8"/>
      </svg>
    ),
  },
]

const STATS = [
  {
    label: 'Offres publiées',
    valeur: 5,
    delta: '+1 cette semaine',
    couleur: '#3b82f6',
    bg: '#eff6ff',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="7" width="20" height="14" rx="2" fill="#3b82f6" opacity="0.15"/>
        <rect x="2" y="7" width="20" height="14" rx="2" stroke="#3b82f6" strokeWidth="1.8"/>
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="#3b82f6" strokeWidth="1.8"/>
      </svg>
    ),
  },
  {
    label: 'Candidatures reçues',
    valeur: 12,
    delta: '+3 cette semaine',
    couleur: '#10b981',
    bg: '#ecfdf5',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#10b981" opacity="0.15" stroke="#10b981" strokeWidth="1.8"/>
        <polyline points="14,2 14,8 20,8" stroke="#10b981" strokeWidth="1.8"/>
        <line x1="9" y1="13" x2="15" y2="13" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: 'Candidatures en attente',
    valeur: 7,
    delta: '+2 cette semaine',
    couleur: '#a855f7',
    bg: '#faf5ff',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" fill="#a855f7" opacity="0.15" stroke="#a855f7" strokeWidth="1.8"/>
        <path d="M12 6v6l4 2" stroke="#a855f7" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: 'Offres à valider',
    valeur: 2,
    delta: '+1 cette semaine',
    couleur: '#f59e0b',
    bg: '#fffbeb',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="#f59e0b" opacity="0.15" stroke="#f59e0b" strokeWidth="1.8"/>
        <polyline points="9,12 11,14 15,10" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
]

const OFFRES = [
  { id: 1, titre: 'Développeur Web Full Stack', domaine: 'Informatique', duree: '3 mois', candidatures: 5, statut: 'Publié', statutColor: '#16a34a', statutBg: '#dcfce7' },
  { id: 2, titre: 'Assistant Marketing Digital', domaine: 'Marketing', duree: '6 mois', candidatures: 3, statut: 'Publié', statutColor: '#16a34a', statutBg: '#dcfce7' },
  { id: 3, titre: 'Technicien Réseau', domaine: 'Réseaux', duree: '4 mois', candidatures: 2, statut: 'En attente', statutColor: '#d97706', statutBg: '#fef3c7' },
  { id: 4, titre: 'Développeur Mobile', domaine: 'Informatique', duree: '3 mois', candidatures: 4, statut: 'Publié', statutColor: '#16a34a', statutBg: '#dcfce7' },
]

const CANDIDATURES_RECENTES = [
  { id: 1, nom: 'Mamadou Diallo', poste: 'Développeur Web', date: '12 avr. 2025', statut: 'Nouveau', statutColor: '#2563eb', statutBg: '#dbeafe', avatar: 'https://i.pravatar.cc/40?img=11' },
  { id: 2, nom: 'Awa Fall', poste: 'Réseaux & Sécurité', date: '10 avr. 2025', statut: 'En cours', statutColor: '#0891b2', statutBg: '#e0f2fe', avatar: 'https://i.pravatar.cc/40?img=47' },
  { id: 3, nom: 'Cheikh Ndiaye', poste: 'Développement Mobile', date: '08 avr. 2025', statut: 'En cours', statutColor: '#0891b2', statutBg: '#e0f2fe', avatar: 'https://i.pravatar.cc/40?img=15' },
]

export default function DashboardEntreprise() {
  const router = useRouter()
  const [profilOuvert, setProfilOuvert] = useState(false)
  const [notifsOuvertes, setNotifsOuvertes] = useState(false)
  const profilRef = useRef<HTMLDivElement>(null)
  const notifsRef = useRef<HTMLDivElement>(null)

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
        width: 260,
        minWidth: 260,
        background: 'linear-gradient(180deg, #0d1b3e 0%, #0f2052 60%, #1a3a6b 100%)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, overflow: 'hidden',
            }}>
              <img src="/logo-ipd.jpg" alt="IPD" style={{ width: '100%', height: '100%', objectFit: 'contain' }}
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
                fontSize: 14, textAlign: 'left',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!item.actif) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)' }}
              onMouseLeave={e => { if (!item.actif) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            >
              <span style={{ flexShrink: 0 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Slogan bas */}
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
          background: 'white',
          borderBottom: '1px solid #e8edf2',
          height: 64,
          padding: '0 28px',
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
            <input
              type="text"
              placeholder="Rechercher une offre, une candidature..."
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '10px 14px 10px 42px',
                border: '1.5px solid #e2e8f0', borderRadius: 24,
                fontSize: 13.5, color: '#374151', outline: 'none',
                background: '#f8fafc',
              }}
            />
          </div>

          <div style={{ flex: 1 }} />

          {/* Cloche notifications */}
          <div ref={notifsRef} style={{ position: 'relative' }}>
            <button
              onClick={() => { setNotifsOuvertes(v => !v); setProfilOuvert(false) }}
              style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: '#64748b', display: 'flex' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.8"/>
              </svg>
              <span style={{
                position: 'absolute', top: 4, right: 4,
                width: 18, height: 18, background: '#ef4444',
                borderRadius: '50%', border: '2px solid white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, color: 'white',
              }}>2</span>
            </button>
            {notifsOuvertes && (
              <div style={{
                position: 'absolute', top: 50, right: 0, width: 300,
                background: 'white', border: '1px solid #e2e8f0',
                borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 200,
              }}>
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
            <div
              onClick={() => { setProfilOuvert(v => !v); setNotifsOuvertes(false) }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '6px 10px', borderRadius: 10, border: '1px solid #e2e8f0' }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: '#2563eb',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0,
              }}>AN</div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1e293b', lineHeight: 1.3 }}>Astou Ndiaye</div>
                <div style={{ fontSize: 11.5, color: '#64748b', lineHeight: 1.3 }}>Entreprise</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color: '#9ca3af' }}>
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            {profilOuvert && (
              <div style={{
                position: 'absolute', top: 54, right: 0, width: 200,
                background: 'white', border: '1px solid #e2e8f0',
                borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 200, overflow: 'hidden',
              }}>
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
                <div
                  onClick={() => { localStorage.removeItem('token'); router.replace('/') }}
                  style={{ padding: '10px 16px', fontSize: 13, color: '#ef4444', cursor: 'pointer', fontWeight: 500 }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                >Se déconnecter</div>
              </div>
            )}
          </div>
        </header>

        {/* ── Contenu ── */}
        <div style={{ flex: 1, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* Hero Banner */}
          <div style={{
            borderRadius: 16, overflow: 'hidden',
            background: 'linear-gradient(120deg, #dbeafe 0%, #e0f2fe 50%, #eff6ff 100%)',
            padding: '28px 32px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            minHeight: 110, position: 'relative',
          }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#1e3a5f' }}>Bonjour, Astou Ndiaye !</h1>
              <p style={{ margin: '6px 0 0', fontSize: 14, color: '#4b6a8a' }}>Gérez vos offres de stage et suivez les candidatures reçues.</p>
            </div>
            {/* Illustration décorative */}
            <div style={{ position: 'relative', width: 160, height: 90, flexShrink: 0 }}>
              <svg width="160" height="90" viewBox="0 0 160 90" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Bâtiment */}
                <rect x="60" y="20" width="60" height="65" rx="3" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="1.5"/>
                <rect x="70" y="35" width="12" height="12" rx="1" fill="#93c5fd"/>
                <rect x="90" y="35" width="12" height="12" rx="1" fill="#93c5fd"/>
                <rect x="70" y="55" width="12" height="12" rx="1" fill="#93c5fd"/>
                <rect x="90" y="55" width="12" height="12" rx="1" fill="#93c5fd"/>
                <rect x="78" y="68" width="24" height="17" rx="1" fill="#7dd3fc"/>
                {/* Plantes */}
                <ellipse cx="30" cy="80" rx="18" ry="10" fill="#bfdbfe" opacity="0.5"/>
                <path d="M30 80 C25 60 15 55 20 45 C25 55 28 58 30 65 C32 58 35 55 40 45 C45 55 35 60 30 80Z" fill="#7dd3fc"/>
                <ellipse cx="145" cy="80" rx="15" ry="8" fill="#bfdbfe" opacity="0.5"/>
                <path d="M145 80 C141 65 134 60 138 52 C142 60 143 63 145 68 C147 63 148 60 152 52 C156 60 149 65 145 80Z" fill="#93c5fd"/>
              </svg>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {STATS.map((s, i) => (
              <div key={i} style={{
                background: 'white', borderRadius: 14,
                padding: '20px 22px',
                border: '1px solid #e8edf2',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {s.icon}
                  </div>
                  <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500, lineHeight: 1.3 }}>{s.label}</div>
                </div>
                <div style={{ fontSize: 34, fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{s.valeur}</div>
                <div style={{ marginTop: 8, fontSize: 12, color: s.couleur, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <path d="M7 17L17 7M17 7H7M17 7v10" stroke={s.couleur} strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  {s.delta}
                </div>
              </div>
            ))}
          </div>

          {/* Bas : tableau offres + colonne droite */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>

            {/* Tableau mes offres */}
            <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e8edf2', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
              <div style={{ padding: '18px 22px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="7" width="20" height="14" rx="2" stroke="#2563eb" strokeWidth="1.8"/>
                    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="#2563eb" strokeWidth="1.8"/>
                  </svg>
                  <span style={{ fontWeight: 700, fontSize: 15.5, color: '#2563eb' }}>Mes offres de stage</span>
                </div>
                <button onClick={() => router.push('/dashboard/entreprise/offres')}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: '#2563eb', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                  Voir toutes
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                </button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Titre du stage', 'Domaine', 'Durée', 'Candidatures', 'Statut', ''].map((h, i) => (
                      <th key={i} style={{ padding: '10px 18px', textAlign: 'left', fontSize: 12, color: '#94a3b8', fontWeight: 600, letterSpacing: 0.3, borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {OFFRES.map((o, i) => (
                    <tr key={o.id} style={{ borderBottom: i < OFFRES.length - 1 ? '1px solid #f8fafc' : 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fafbfc')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                      <td style={{ padding: '14px 18px', fontSize: 13.5, fontWeight: 600, color: '#2563eb', cursor: 'pointer' }}
                        onClick={() => router.push(`/dashboard/entreprise/offres/${o.id}`)}>{o.titre}</td>
                      <td style={{ padding: '14px 18px', fontSize: 13, color: '#64748b' }}>{o.domaine}</td>
                      <td style={{ padding: '14px 18px', fontSize: 13, color: '#64748b' }}>{o.duree}</td>
                      <td style={{ padding: '14px 18px', fontSize: 13, color: '#64748b' }}>{o.candidatures}</td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: o.statutColor, background: o.statutBg, borderRadius: 20, padding: '3px 12px' }}>{o.statut}</span>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <button onClick={() => router.push(`/dashboard/entreprise/offres/${o.id}`)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Colonne droite */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Bouton Publier */}
              <button
                onClick={() => router.push('/dashboard/entreprise/offres/creer')}
                style={{
                  width: '100%', padding: '20px 22px', borderRadius: 14,
                  background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                  border: 'none', cursor: 'pointer', color: 'white',
                  display: 'flex', alignItems: 'center', gap: 14,
                  boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
                }}
              >
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <line x1="12" y1="5" x2="12" y2="19" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
                    <line x1="5" y1="12" x2="19" y2="12" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>Publier une nouvelle offre</div>
                  <div style={{ fontSize: 12, opacity: 0.85 }}>Partagez une opportunité de stage avec les étudiants</div>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>

              {/* Candidatures récentes */}
              <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e8edf2', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                <div style={{ padding: '16px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#2563eb" strokeWidth="1.8"/>
                      <circle cx="9" cy="7" r="4" stroke="#2563eb" strokeWidth="1.8"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="#2563eb" strokeWidth="1.8"/>
                    </svg>
                    <span style={{ fontWeight: 700, fontSize: 14.5, color: '#2563eb' }}>Candidatures récentes</span>
                  </div>
                  <button onClick={() => router.push('/dashboard/entreprise/candidatures')}
                    style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 12.5, cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                    Voir toutes
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  </button>
                </div>
                {CANDIDATURES_RECENTES.map((c, i) => (
                  <div key={c.id} style={{ padding: '13px 18px', borderBottom: i < CANDIDATURES_RECENTES.length - 1 ? '1px solid #f8fafc' : 'none', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                    onClick={() => router.push(`/dashboard/entreprise/candidatures/${c.id}`)}
                    onMouseEnter={e => (e.currentTarget.style.background = '#fafbfc')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                    <img src={c.avatar} alt={c.nom} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                      onError={e => { const el = e.target as HTMLImageElement; el.style.display = 'none' }}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1e293b' }}>{c.nom}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{c.poste}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 11.5, color: '#94a3b8', marginBottom: 4 }}>{c.date}</div>
                      <span style={{ fontSize: 11.5, fontWeight: 600, color: c.statutColor, background: c.statutBg, borderRadius: 20, padding: '2px 10px' }}>{c.statut}</span>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color: '#cbd5e1', flexShrink: 0 }}><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  </div>
                ))}
              </div>

              {/* Mon entreprise */}
              <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e8edf2', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 9 }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="7" width="20" height="15" rx="2" stroke="#1e293b" strokeWidth="1.8"/>
                    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="#1e293b" strokeWidth="1.8"/>
                  </svg>
                  <span style={{ fontWeight: 700, fontSize: 14.5, color: '#1e293b' }}>Mon entreprise</span>
                </div>
                <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                  onClick={() => router.push('/dashboard/entreprise/profil')}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fafbfc')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: '#1e3a5f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0 }}>ST</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>SENEGAL TECH</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Technologie / Services numériques</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color: '#cbd5e1' }}><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  )
}