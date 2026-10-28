// app/dashboard/etudiant/conventions/[id]/page.tsx
// Page détail d'une convention — vue Étudiant

'use client'

import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from 'react'
import { useRouter, useParams } from 'next/navigation'

/* ───────── Mise à l'échelle ───────── */
const LARGEUR_MAQUETTE = 1672
const abonnerRedimension = (cb: () => void) => {
  window.addEventListener('resize', cb)
  return () => window.removeEventListener('resize', cb)
}
const lireLargeur    = () => window.innerWidth
const largeurServeur = () => LARGEUR_MAQUETTE

/* ───────── Types ───────── */
type StatutDB =
  | 'ETAPE_ETUDIANT'
  | 'ETAPE_ENTREPRISE'
  | 'ETAPE_ADMIN'
  | 'VALIDEE'
  | 'REJETEE'

interface Convention {
  id: number
  statut: StatutDB
  pdfUrl: string | null
  uuid: string
  motifRejet: string | null
  dateValidation: string | null
  createdAt: string
  stage: {
    id: number
    dateDebut: string
    dateFin: string
    statut: string
    encadreur: { id: number; nom: string; prenom: string; email: string } | null
    candidature: {
      offre: {
        titre: string
        domaine: string
        entreprise: {
          id: number
          nom: string
          prenom: string
          secteur: string | null
          email: string
        } | null
      }
    }
  }
}

/* ───────── Helpers ───────── */
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}
function fmtDateCourt(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function statutLabel(s: StatutDB): string {
  switch (s) {
    case 'ETAPE_ETUDIANT':   return 'En attente de votre signature'
    case 'ETAPE_ENTREPRISE': return 'En attente de la signature entreprise'
    case 'ETAPE_ADMIN':      return 'En attente de validation admin'
    case 'VALIDEE':          return 'Validée'
    case 'REJETEE':          return 'Rejetée'
  }
}
function statutCouleur(s: StatutDB): { bg: string; color: string; border: string } {
  switch (s) {
    case 'ETAPE_ETUDIANT':
      return { bg: '#fef3c7', color: '#d97706', border: '#fcd34d' }
    case 'ETAPE_ENTREPRISE':
      return { bg: '#dbeafe', color: '#1d4ed8', border: '#93c5fd' }
    case 'ETAPE_ADMIN':
      return { bg: '#e0e7ff', color: '#4338ca', border: '#a5b4fc' }
    case 'VALIDEE':
      return { bg: '#dcfce7', color: '#15803d', border: '#86efac' }
    case 'REJETEE':
      return { bg: '#fee2e2', color: '#dc2626', border: '#fca5a5' }
  }
}

/* ───────── Étapes de progression ───────── */
const ETAPES: { id: StatutDB; label: string }[] = [
  { id: 'ETAPE_ETUDIANT',   label: 'Signature étudiant' },
  { id: 'ETAPE_ENTREPRISE', label: 'Signature entreprise' },
  { id: 'ETAPE_ADMIN',      label: 'Validation admin' },
  { id: 'VALIDEE',          label: 'Convention validée' },
]
function etapeIndex(s: StatutDB): number {
  if (s === 'REJETEE') return -1
  return ETAPES.findIndex(e => e.id === s)
}

/* ───────── Couleurs ───────── */
const NAVY  = '#0b2f7a'
const BLUE  = '#1d6fe8'
const MUTED = '#6b7a99'
const BG    = '#f0f4f8'
const WHITE = '#ffffff'

/* ───────── Composant principal ───────── */
export default function ConventionDetailPage() {
  const router       = useRouter()
  const params       = useParams()
  const conventionId = params?.id as string

  const largeur = useSyncExternalStore(abonnerRedimension, lireLargeur, largeurServeur)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _scale  = largeur / LARGEUR_MAQUETTE

  const tokenRef = useRef<string>('')
  const [convention, setConvention] = useState<Convention | null>(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur]         = useState('')
  const [enCoursSig, setEnCoursSig] = useState(false)
  const [messageSig, setMessageSig] = useState('')
  const [erreurSig, setErreurSig]   = useState('')

  /* Charger la convention */
  const loadConvention = useCallback(async (tok: string) => {
    try {
      const res = await fetch(`/api/conventions/${conventionId}`, {
        headers: { Authorization: `Bearer ${tok}` },
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Erreur')
      }
      const data = await res.json()
      setConvention(data.convention)
    } catch (e: unknown) {
      setErreur(e instanceof Error ? e.message : 'Erreur lors du chargement')
    } finally {
      setChargement(false)
    }
  }, [conventionId])

  useEffect(() => {
    async function init() {
      const t = localStorage.getItem('token') || ''
      if (!t) { router.push('/login'); return }
      tokenRef.current = t
      await loadConvention(t)
    }
    init().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* Signer la convention */
  const signerConvention = useCallback(async () => {
    const tok = tokenRef.current
    setEnCoursSig(true)
    setErreurSig('')
    setMessageSig('')
    try {
      const res = await fetch(`/api/conventions/${conventionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tok}`,
        },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Erreur')
      setMessageSig(data.message)
      await loadConvention(tok)
    } catch (e: unknown) {
      setErreurSig(e instanceof Error ? e.message : 'Erreur lors de la signature')
    } finally {
      setEnCoursSig(false)
    }
  }, [conventionId, loadConvention])

  /* ───────── Rendu ───────── */
  if (chargement) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: BG }}>
        <div style={{ textAlign: 'center', color: MUTED }}>
          <div style={{ width: 40, height: 40, border: `3px solid ${BLUE}`,
            borderTop: '3px solid transparent', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          Chargement…
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (erreur) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: BG, flexDirection: 'column', gap: 16 }}>
        <div style={{ color: '#dc2626', fontSize: 18, fontWeight: 600 }}>{erreur}</div>
        <button onClick={() => router.back()}
          style={{ padding: '10px 24px', background: BLUE, color: WHITE,
            border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
          ← Retour
        </button>
      </div>
    )
  }

  if (!convention) return null

  const { statut, stage } = convention
  const offre      = stage.candidature.offre
  const entreprise = offre.entreprise
  const couleur    = statutCouleur(statut)
  const idx        = etapeIndex(statut)
  const peutSigner = statut === 'ETAPE_ETUDIANT'

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        * { box-sizing: border-box; }
      `}</style>

      {/* En-tête */}
      <div style={{ background: NAVY, padding: '20px 32px', display: 'flex',
        alignItems: 'center', gap: 16 }}>
        <button
          onClick={() => router.push('/dashboard/etudiant/conventions')}
          style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8,
            padding: '8px 16px', color: WHITE, cursor: 'pointer', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
          ← Retour
        </button>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Convention de stage</div>
          <div style={{ color: WHITE, fontWeight: 700, fontSize: 20 }}>{offre.titre}</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <span style={{ background: couleur.bg, color: couleur.color,
            border: `1px solid ${couleur.border}`, padding: '6px 16px',
            borderRadius: 20, fontWeight: 600, fontSize: 14 }}>
            {statutLabel(statut)}
          </span>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '32px auto', padding: '0 24px' }}>

        {/* Barre de progression */}
        {statut !== 'REJETEE' && (
          <div style={{ background: WHITE, borderRadius: 12, padding: '24px 32px',
            marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <div style={{ fontWeight: 700, color: NAVY, marginBottom: 20, fontSize: 16 }}>
              Progression de la convention
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {ETAPES.map((etape, i) => {
                const done    = i < idx
                const current = i === idx
                const bgCircle  = done || current ? BLUE : '#e2e8f0'
                const colorText = done ? BLUE : current ? NAVY : MUTED
                const lineColor = done ? BLUE : '#e2e8f0'
                return (
                  <div key={etape.id} style={{ display: 'flex', alignItems: 'center',
                    flex: i < ETAPES.length - 1 ? 1 : 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column',
                      alignItems: 'center', minWidth: 80 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%',
                        background: bgCircle, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', marginBottom: 8,
                        border: current ? `3px solid ${BLUE}` : 'none',
                        boxShadow: current ? `0 0 0 4px rgba(29,111,232,0.15)` : 'none' }}>
                        {done ? (
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                            <polyline points="20 6 9 17 4 12" stroke={WHITE}
                              strokeWidth="2.5" strokeLinecap="round"/>
                          </svg>
                        ) : (
                          <div style={{ width: 10, height: 10, borderRadius: '50%',
                            background: current ? WHITE : '#cbd5e1' }} />
                        )}
                      </div>
                      <div style={{ fontSize: 11, textAlign: 'center', color: colorText,
                        fontWeight: current ? 700 : done ? 600 : 400, lineHeight: 1.3 }}>
                        {etape.label}
                      </div>
                    </div>
                    {i < ETAPES.length - 1 && (
                      <div style={{ flex: 1, height: 3, background: lineColor,
                        margin: '-20px 4px 0', borderRadius: 2 }} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Rejetée */}
        {statut === 'REJETEE' && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 12,
            padding: '20px 24px', marginBottom: 24, color: '#dc2626' }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
              ✗ Cette convention a été rejetée
            </div>
            {convention.motifRejet && (
              <div style={{ fontSize: 14 }}>Motif : {convention.motifRejet}</div>
            )}
          </div>
        )}

        {/* Grille infos */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

          {/* Infos stage */}
          <div style={{ background: WHITE, borderRadius: 12, padding: 24,
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <SectionTitre label="Informations du stage" icon={
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                <rect x="2" y="7" width="20" height="14" rx="2" stroke={BLUE} strokeWidth="1.8"/>
                <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke={BLUE} strokeWidth="1.8"/>
              </svg>
            } />
            <InfoLigne label="Offre"        value={offre.titre} />
            <InfoLigne label="Domaine"      value={offre.domaine || '—'} />
            <InfoLigne label="Début"        value={fmtDate(stage.dateDebut)} />
            <InfoLigne label="Fin"          value={fmtDate(stage.dateFin)} />
            <InfoLigne label="Statut stage" value={stage.statut} />
          </div>

          {/* Infos entreprise */}
          <div style={{ background: WHITE, borderRadius: 12, padding: 24,
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <SectionTitre label="Entreprise d'accueil" icon={
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
                  stroke={BLUE} strokeWidth="1.8"/>
                <polyline points="9 22 9 12 15 12 15 22" stroke={BLUE} strokeWidth="1.8"/>
              </svg>
            } />
            {entreprise ? (
              <>
                <InfoLigne label="Nom"    value={`${entreprise.prenom} ${entreprise.nom}`} />
                <InfoLigne label="Secteur" value={entreprise.secteur || '—'} />
                <InfoLigne label="Email"  value={entreprise.email} />
              </>
            ) : (
              <div style={{ color: MUTED, fontSize: 14 }}>Informations non disponibles</div>
            )}
          </div>

          {/* Infos convention */}
          <div style={{ background: WHITE, borderRadius: 12, padding: 24,
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <SectionTitre label="Détails de la convention" icon={
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                  stroke={BLUE} strokeWidth="1.8"/>
                <polyline points="14 2 14 8 20 8" stroke={BLUE} strokeWidth="1.8"/>
              </svg>
            } />
            <InfoLigne label="Créée le"         value={fmtDateCourt(convention.createdAt)} />
            <InfoLigne label="Date de validation"
              value={convention.dateValidation ? fmtDateCourt(convention.dateValidation) : '—'} />
            <InfoLigne label="PDF"
              value={convention.pdfUrl ? 'Disponible' : 'Non généré'} />
          </div>

          {/* Encadreur */}
          <div style={{ background: WHITE, borderRadius: 12, padding: 24,
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <SectionTitre label="Encadreur pédagogique" icon={
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                  stroke={BLUE} strokeWidth="1.8"/>
                <circle cx="12" cy="7" r="4" stroke={BLUE} strokeWidth="1.8"/>
              </svg>
            } />
            {stage.encadreur ? (
              <>
                <InfoLigne label="Nom"
                  value={`${stage.encadreur.prenom} ${stage.encadreur.nom}`} />
                <InfoLigne label="Email" value={stage.encadreur.email} />
              </>
            ) : (
              <div style={{ color: MUTED, fontSize: 14 }}>
                Aucun encadreur assigné pour l&apos;instant
              </div>
            )}
          </div>
        </div>

        {/* Zone de signature */}
        {peutSigner && (
          <div style={{ background: WHITE, borderRadius: 12, padding: '28px 32px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: `2px solid ${BLUE}` }}>
            <div style={{ fontWeight: 700, color: NAVY, fontSize: 17, marginBottom: 8 }}>
              ✏️ Signer votre convention de stage
            </div>
            <p style={{ color: MUTED, fontSize: 14, margin: '0 0 20px', lineHeight: 1.6 }}>
              En cliquant sur &laquo;&nbsp;Signer&nbsp;&raquo;, vous confirmez avoir pris
              connaissance des termes de votre convention et vous engagez à respecter les
              conditions définies. Elle sera ensuite transmise à l&apos;entreprise pour signature.
            </p>

            {messageSig && (
              <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 8,
                padding: '12px 16px', color: '#15803d', fontWeight: 600,
                marginBottom: 16, fontSize: 14 }}>
                ✓ {messageSig}
              </div>
            )}
            {erreurSig && (
              <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8,
                padding: '12px 16px', color: '#dc2626', fontWeight: 600,
                marginBottom: 16, fontSize: 14 }}>
                ✗ {erreurSig}
              </div>
            )}

            <button
              onClick={signerConvention}
              disabled={enCoursSig}
              style={{ padding: '14px 40px', background: enCoursSig ? MUTED : BLUE,
                color: WHITE, border: 'none', borderRadius: 10,
                cursor: enCoursSig ? 'not-allowed' : 'pointer',
                fontWeight: 700, fontSize: 16, display: 'flex',
                alignItems: 'center', gap: 10, transition: 'background 0.2s' }}>
              {enCoursSig ? (
                <>
                  <div style={{ width: 18, height: 18, border: `2px solid ${WHITE}`,
                    borderTop: '2px solid transparent', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite' }} />
                  Signature en cours…
                </>
              ) : (
                <>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                    <path d="M9 11l3 3L22 4" stroke={WHITE} strokeWidth="2.5"
                      strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"
                      stroke={WHITE} strokeWidth="2.2" strokeLinecap="round"/>
                  </svg>
                  Signer la convention
                </>
              )}
            </button>
          </div>
        )}

        {/* Déjà signé */}
        {!peutSigner && statut !== 'REJETEE' && (
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 12,
            padding: '20px 24px', color: '#15803d', fontSize: 14 }}>
            <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 15 }}>
              ✓ Vous avez signé cette convention
            </div>
            <div style={{ color: '#166534' }}>
              {statutLabel(statut)}.
              {statut === 'VALIDEE' && convention.dateValidation && (
                <> Validée le {fmtDate(convention.dateValidation)}.</>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

/* ───────── Sous-composants ───────── */
function SectionTitre({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <div style={{ fontWeight: 700, color: '#0b2f7a', marginBottom: 16, fontSize: 15,
      display: 'flex', alignItems: 'center', gap: 8 }}>
      {icon}
      {label}
    </div>
  )
}

function InfoLigne({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between',
      padding: '8px 0', borderBottom: '1px solid #f1f5f9',
      fontSize: 14, gap: 12 }}>
      <span style={{ color: '#6b7a99', flexShrink: 0 }}>{label}</span>
      <span style={{ color: '#0b2f7a', fontWeight: 500,
        textAlign: 'right', wordBreak: 'break-word' }}>
        {value}
      </span>
    </div>
  )
}