// app/dashboard/entreprise/offres/nouvelle/page.tsx
// Formulaire de publication d'une nouvelle offre de stage

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const DOMAINES = [
  'Informatique', 'Développement Web', 'Développement Mobile',
  'Intelligence Artificielle', 'Réseaux & Sécurité', 'Data Science',
  'Gestion de Projet', 'Marketing Digital', 'Finance', 'Comptabilité', 'Autre'
]

export default function PageNouvelleOffre() {
  const router = useRouter()
  const [champ, setChamp] = useState({
    titre:        '',
    description:  '',
    domaine:      '',
    duree:        '',
    competences:  '',
    remuneration: '',
  })
  const [envoi,   setEnvoi]   = useState(false)
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [toast,   setToast]   = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    const user  = JSON.parse(localStorage.getItem('user') || '{}')
    if (!token || user.role !== 'ENTREPRISE') router.replace('/login')
  }, [])

  function valider(): boolean {
    const e: Record<string, string> = {}
    if (!champ.titre.trim())       e.titre       = 'Le titre est obligatoire'
    if (!champ.description.trim()) e.description = 'La description est obligatoire'
    if (champ.description.length < 30) e.description = 'Description trop courte (min 30 caractères)'
    if (!champ.domaine)            e.domaine     = 'Sélectionnez un domaine'
    if (!champ.duree)              e.duree       = 'La durée est obligatoire'
    if (parseInt(champ.duree) < 1 || parseInt(champ.duree) > 52)
      e.duree = 'Durée entre 1 et 52 semaines'
    setErreurs(e)
    return Object.keys(e).length === 0
  }

  async function soumettre(e: React.FormEvent) {
    e.preventDefault()
    if (!valider()) return
    setEnvoi(true)
    try {
      const token = localStorage.getItem('token')
      const res   = await fetch('/api/offres', {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          titre:        champ.titre.trim(),
          description:  champ.description.trim(),
          domaine:      champ.domaine,
          duree:        parseInt(champ.duree),
          competences:  champ.competences.trim(),
          remuneration: champ.remuneration.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setErreurs({ global: data.message }); return }
      setToast('✅ Offre soumise ! En attente de validation par l\'administrateur.')
      setTimeout(() => router.push('/dashboard/entreprise'), 2500)
    } catch {
      setErreurs({ global: 'Erreur réseau. Réessaie.' })
    } finally {
      setEnvoi(false)
    }
  }

  const inp = (name: keyof typeof champ, value: string) =>
    setChamp(prev => ({ ...prev, [name]: value }))

  const styleInput = (err?: string): React.CSSProperties => ({
    width: '100%', boxSizing: 'border-box',
    padding: '10px 12px', borderRadius: 8,
    border: `1px solid ${err ? '#dc2626' : '#e2e8f0'}`,
    fontSize: 14, outline: 'none',
    background: 'white',
  })

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '20px 32px',
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <button
          onClick={() => router.back()}
          style={{
            padding: '8px 14px', borderRadius: 8,
            border: '1px solid #e2e8f0', background: 'white',
            cursor: 'pointer', fontSize: 13, color: '#64748b',
          }}
        >
          ← Retour
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1e293b' }}>
            Publier une offre de stage
          </h1>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8' }}>
            L'offre sera visible après validation par l'administrateur
          </p>
        </div>
      </div>

      {/* Formulaire */}
      <div style={{ maxWidth: 680, margin: '32px auto', padding: '0 24px' }}>
        <form onSubmit={soumettre} style={{
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          padding: 32,
          display: 'flex', flexDirection: 'column', gap: 20,
        }}>
          {/* Titre */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Titre du poste *
            </label>
            <input
              type="text"
              value={champ.titre}
              onChange={e => inp('titre', e.target.value)}
              placeholder="ex: Développeur Web Front-end"
              style={styleInput(erreurs.titre)}
            />
            {erreurs.titre && <p style={{ color: '#dc2626', fontSize: 12, margin: '4px 0 0' }}>{erreurs.titre}</p>}
          </div>

          {/* Domaine + Durée côte à côte */}
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Domaine *
              </label>
              <select
                value={champ.domaine}
                onChange={e => inp('domaine', e.target.value)}
                style={{ ...styleInput(erreurs.domaine), color: champ.domaine ? '#1e293b' : '#94a3b8' }}
              >
                <option value="">Sélectionner…</option>
                {DOMAINES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              {erreurs.domaine && <p style={{ color: '#dc2626', fontSize: 12, margin: '4px 0 0' }}>{erreurs.domaine}</p>}
            </div>
            <div style={{ width: 160 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Durée (semaines) *
              </label>
              <input
                type="number"
                min={1} max={52}
                value={champ.duree}
                onChange={e => inp('duree', e.target.value)}
                placeholder="ex: 8"
                style={styleInput(erreurs.duree)}
              />
              {erreurs.duree && <p style={{ color: '#dc2626', fontSize: 12, margin: '4px 0 0' }}>{erreurs.duree}</p>}
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Description du poste *
            </label>
            <textarea
              value={champ.description}
              onChange={e => inp('description', e.target.value)}
              placeholder="Décrivez les missions, le contexte du stage, l'environnement de travail..."
              rows={5}
              style={{ ...styleInput(erreurs.description), resize: 'vertical' }}
            />
            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#94a3b8' }}>
              {champ.description.length} caractères
            </p>
            {erreurs.description && <p style={{ color: '#dc2626', fontSize: 12, margin: '4px 0 0' }}>{erreurs.description}</p>}
          </div>

          {/* Compétences */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Compétences requises
              <span style={{ fontWeight: 400, color: '#94a3b8' }}> (séparées par des virgules)</span>
            </label>
            <input
              type="text"
              value={champ.competences}
              onChange={e => inp('competences', e.target.value)}
              placeholder="ex: React, TypeScript, Node.js"
              style={styleInput()}
            />
          </div>

          {/* Rémunération */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Rémunération
              <span style={{ fontWeight: 400, color: '#94a3b8' }}> (optionnel)</span>
            </label>
            <input
              type="text"
              value={champ.remuneration}
              onChange={e => inp('remuneration', e.target.value)}
              placeholder="ex: 75 000 FCFA / mois"
              style={styleInput()}
            />
          </div>

          {/* Erreur globale */}
          {erreurs.global && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: 8, padding: '10px 14px',
              color: '#dc2626', fontSize: 13,
            }}>
              ⚠️ {erreurs.global}
            </div>
          )}

          {/* Bouton */}
          <button
            type="submit"
            disabled={envoi}
            style={{
              padding: '13px 0', borderRadius: 10,
              border: 'none',
              background: envoi ? '#93c5fd' : '#2563eb',
              cursor: envoi ? 'not-allowed' : 'pointer',
              color: 'white', fontWeight: 700, fontSize: 15,
            }}
          >
            {envoi ? 'Envoi en cours…' : '📤 Soumettre l\'offre'}
          </button>
        </form>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%',
          transform: 'translateX(-50%)',
          background: '#16a34a', color: 'white',
          padding: '14px 28px', borderRadius: 12,
          fontWeight: 600, fontSize: 14,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          zIndex: 9999, maxWidth: 420, textAlign: 'center',
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}
