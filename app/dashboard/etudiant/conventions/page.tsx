// app/dashboard/etudiant/conventions/page.tsx
// Convention de stage étudiant — URL dédiée /dashboard/etudiant/conventions

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

interface StageDetail {
  id: number
  dateDebut: string
  dateFin: string
  statut: string
  candidature?: {
    offre?: {
      titre: string
      entreprise?: {
        nom: string
        prenom: string
        email: string
        secteur: string | null
      }
    }
  }
}

interface ConventionDetail {
  id: number
  stageId: number
  statut: string
  dateValidation?: string | null
  qrCodeUrl?: string | null
  pdfUrl?: string | null
}

const STATUTS_CONVENTION: Record<string, { label: string; fond: string; texte: string }> = {
  ETAPE_ETUDIANT: { label: 'Initié par l’étudiant', fond: '#dbe8fd', texte: '#1d56c9' },
  ETAPE_ENTREPRISE: { label: 'En attente entreprise', fond: '#fde9d0', texte: '#c2410c' },
  ETAPE_ADMIN: { label: 'En attente administrateur', fond: '#eadffc', texte: '#6d28d9' },
  VALIDEE: { label: 'Validée & Certifiée', fond: '#d9f5e3', texte: '#15803d' },
  REJETEE: { label: 'Rejetée', fond: '#fde2e2', texte: '#b91c1c' },
}

export default function ConventionsEtudiantPage() {
  const router = useRouter()
  const [stage, setStage] = useState<StageDetail | null>(null)
  const [convention, setConvention] = useState<ConventionDetail | null>(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState('')
  const [envoi, setEnvoi] = useState(false)

  const chargerDonnees = async (token: string) => {
    try {
      const entetes = { authorization: `Bearer ${token}` }
      const resStage = await fetch('/api/stages/me', { headers: entetes })
      if (resStage.ok) {
        const dataStage = await resStage.json()
        const stageActif = Array.isArray(dataStage) ? dataStage[0] : dataStage
        setStage(stageActif || null)

        if (stageActif?.id) {
          const resConv = await fetch(`/api/convention?stageId=${stageActif.id}`, { headers: entetes })
          if (resConv.ok) {
            setConvention(await resConv.json())
          }
        }
      }
    } catch {
      setErreur('Impossible de charger les informations de votre convention.')
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')

    if (!token || !user) {
      router.push('/login')
      return
    }

    try {
      const userData = JSON.parse(user)
      if (userData.role !== 'ETUDIANT') {
        router.push('/login')
        return
      }
    } catch {
      router.push('/login')
      return
    }

    chargerDonnees(token).finally(() => setChargement(false))
  }, [router])

  const initierConvention = async () => {
    if (!stage) return
    setEnvoi(true)
    setErreur('')
    setSucces('')
    const token = localStorage.getItem('token')!
    try {
      const res = await fetch('/api/convention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ stageId: stage.id }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error || body?.detail || 'Erreur lors de l’initialisation')
      }
      setSucces('Convention initiée avec succès ! Transmise à votre entreprise.')
      chargerDonnees(token)
    } catch (err: unknown) {
      setErreur(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setEnvoi(false)
    }
  }

  const conventionStatut = convention?.statut ? STATUTS_CONVENTION[convention.statut] : null

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7fc', fontFamily: 'inherit', color: '#10244c', padding: 32 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {/* Navigation retour */}
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link
            href="/dashboard/etudiant"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 14,
              fontWeight: 600,
              color: '#1d6fe8',
              textDecoration: 'none',
            }}
          >
            ← Retour au tableau de bord
          </Link>
          <span style={{ fontSize: 13, color: '#6b7a99' }}>IPD Thomas Sankara · Service des Stages</span>
        </div>

        {/* Titre */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#0b2f7a' }}>
            Convention de stage tripartite
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 15, color: '#2f55b0' }}>
            Suivi du circuit d’approbation réglementaire et certificat officiel avec QR Code
          </p>
        </div>

        {erreur && (
          <div style={{ padding: 14, borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', marginBottom: 20 }}>
            {erreur}
          </div>
        )}

        {succes && (
          <div style={{ padding: 14, borderRadius: 10, background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', marginBottom: 20 }}>
            {succes}
          </div>
        )}

        {/* Contenu principal */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #eef2fa', padding: 30, boxShadow: '0 2px 10px rgba(30, 70, 150, 0.06)' }}>
          {chargement ? (
            <p style={{ textAlign: 'center', color: '#6b7a99', padding: 40 }}>Chargement de votre convention...</p>
          ) : !convention ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ fontSize: 44, margin: '0 0 12px' }}>📄</p>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0b2f7a' }}>
                Convention non encore initiée
              </h3>
              <p style={{ margin: '8px 0 24px', color: '#6b7a99', fontSize: 14 }}>
                {stage
                  ? `Vous avez un stage assigné (${stage.candidature?.offre?.titre || 'Stage'}). Vous pouvez initier votre convention dès maintenant.`
                  : 'Vous n’avez pas encore de stage assigné pour initier une convention.'}
              </p>
              <button
                onClick={initierConvention}
                disabled={!stage || envoi}
                style={{
                  padding: '12px 28px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#1d6fe8',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: stage && !envoi ? 'pointer' : 'not-allowed',
                  opacity: stage && !envoi ? 1 : 0.6,
                }}
              >
                {envoi ? 'Initialisation...' : 'Initier la convention maintenant'}
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #eef2fa', paddingBottom: 20 }}>
                <div>
                  <span style={{ fontSize: 13, color: '#6b7a99' }}>DOSSIER N° {convention.id}</span>
                  <h2 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 800, color: '#0b2f7a' }}>
                    {stage?.candidature?.offre?.titre || 'Convention tripartite'}
                  </h2>
                </div>
                <span
                  style={{
                    padding: '8px 18px',
                    borderRadius: 999,
                    fontSize: 14,
                    fontWeight: 700,
                    background: conventionStatut?.fond || '#f1f5fb',
                    color: conventionStatut?.texte || '#2d3b5a',
                  }}
                >
                  {conventionStatut?.label || convention.statut}
                </span>
              </div>

              {/* Circuit en 3 étapes */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, margin: '26px 0' }}>
                <div style={{ padding: 18, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#1d6fe8' }}>ÉTAPE 1</span>
                  <h4 style={{ margin: '6px 0 4px', fontSize: 15, color: '#0b2f7a' }}>Initiation Étudiant</h4>
                  <p style={{ margin: 0, fontSize: 12.5, color: '#16a34a', fontWeight: 600 }}>✓ Complétée</p>
                </div>

                <div style={{ padding: 18, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#1d6fe8' }}>ÉTAPE 2</span>
                  <h4 style={{ margin: '6px 0 4px', fontSize: 15, color: '#0b2f7a' }}>Signature Entreprise</h4>
                  <p style={{ margin: 0, fontSize: 12.5, color: convention.statut === 'ETAPE_ETUDIANT' ? '#ea580c' : '#16a34a', fontWeight: 600 }}>
                    {convention.statut === 'ETAPE_ETUDIANT' ? '⏳ En attente' : '✓ Validée'}
                  </p>
                </div>

                <div style={{ padding: 18, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#1d6fe8' }}>ÉTAPE 3</span>
                  <h4 style={{ margin: '6px 0 4px', fontSize: 15, color: '#0b2f7a' }}>Validation par l'administrateur</h4>
                  <p style={{ margin: 0, fontSize: 12.5, color: convention.statut === 'VALIDEE' ? '#16a34a' : '#ea580c', fontWeight: 600 }}>
                    {convention.statut === 'VALIDEE' ? '✓ Sceau & QR apposés' : '⏳ En attente'}
                  </p>
                </div>
              </div>

              {/* Bloc certification QR Code si validée */}
              {convention.statut === 'VALIDEE' && convention.qrCodeUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: 22, background: '#ecfdf5', borderRadius: 12, border: '1px solid #a7f3d0' }}>
                  <div style={{ width: 110, height: 110, position: 'relative', background: '#fff', borderRadius: 8, padding: 6, flexShrink: 0 }}>
                    <Image src={convention.qrCodeUrl} alt="QR Code d'authentification" fill style={{ objectFit: 'contain' }} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#065f46' }}>
                      Convention Officiellement Signée & Certifiée
                    </h4>
                    <p style={{ margin: '6px 0 14px', fontSize: 13.5, color: '#047857', lineHeight: 1.5 }}>
                      Ce document intègre un QR Code infalsifiable garantissant son authenticité et son enregistrement direct auprès de l’administration de l’IPD Thomas Sankara.
                    </p>
                    {convention.pdfUrl && (
                      <a
                        href={convention.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '10px 20px',
                          background: '#059669',
                          color: '#fff',
                          borderRadius: 8,
                          textDecoration: 'none',
                          fontSize: 14,
                          fontWeight: 600,
                        }}
                      >
                        📄 Télécharger le PDF officiel scellé
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
