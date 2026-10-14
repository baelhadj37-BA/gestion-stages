// app/dashboard/etudiant/offres/page.tsx
// Page liste des offres de stage pour l'étudiant

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────
interface Offre {
  id:           number
  titre:        string
  description:  string
  domaine:      string
  duree:        number
  competences:  string
  remuneration: string | null
  statut:       string
  createdAt:    string
  entreprise:   { id: number; nom: string }
  _count:       { candidatures: number }
}

// ─── Composant carte offre ────────────────────────────────────
function CarteOffre({
  offre,
  onPostuler,
  dejaPostule,
}: {
  offre: Offre
  onPostuler: (offre: Offre) => void
  dejaPostule: boolean
}) {
  return (
    <div style={{
      background: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: 12,
      padding: '20px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
            {offre.titre}
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>
            {offre.entreprise.nom}
          </p>
        </div>
        <span style={{
          background: '#dbeafe',
          color: '#1d4ed8',
          fontSize: 11,
          fontWeight: 600,
          padding: '3px 10px',
          borderRadius: 20,
        }}>
          {offre.domaine}
        </span>
      </div>

      {/* Description */}
      <p style={{
        margin: 0,
        fontSize: 13,
        color: '#475569',
        lineHeight: 1.6,
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {offre.description}
      </p>

      {/* Infos */}
      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#64748b' }}>
        <span>⏱ {offre.duree} semaine{offre.duree > 1 ? 's' : ''}</span>
        {offre.remuneration && <span>💰 {offre.remuneration}</span>}
        <span>👥 {offre._count.candidatures} candidature{offre._count.candidatures !== 1 ? 's' : ''}</span>
      </div>

      {/* Compétences */}
      {offre.competences && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {offre.competences.split(',').map((c, i) => (
            <span key={i} style={{
              background: '#f1f5f9',
              color: '#475569',
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 6,
            }}>
              {c.trim()}
            </span>
          ))}
        </div>
      )}

      {/* Bouton */}
      <button
        onClick={() => !dejaPostule && onPostuler(offre)}
        disabled={dejaPostule}
        style={{
          marginTop: 4,
          padding: '10px 0',
          borderRadius: 8,
          border: 'none',
          cursor: dejaPostule ? 'not-allowed' : 'pointer',
          fontWeight: 600,
          fontSize: 14,
          background: dejaPostule ? '#e2e8f0' : '#2563eb',
          color:      dejaPostule ? '#94a3b8'  : 'white',
          transition: 'background 0.2s',
        }}
      >
        {dejaPostule ? '✅ Déjà postulé' : 'Postuler'}
      </button>
    </div>
  )
}

// ─── Modal candidature ────────────────────────────────────────
function ModalCandidature({
  offre,
  onFermer,
  onSucces,
}: {
  offre: Offre
  onFermer: () => void
  onSucces: (offreId: number) => void
}) {
  const [lettre, setLettre]   = useState('')
  const [cv, setCv]           = useState('')
  const [envoi, setEnvoi]     = useState(false)
  const [erreur, setErreur]   = useState('')

  async function envoyer() {
    if (lettre.trim().length < 50) {
      setErreur('La lettre de motivation doit contenir au moins 50 caractères.')
      return
    }
    setEnvoi(true)
    setErreur('')
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/candidatures', {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ offreId: offre.id, lettreMotivation: lettre, cv }),
      })
      const data = await res.json()
      if (!res.ok) { setErreur(data.message || 'Erreur'); return }
      onSucces(offre.id)
    } catch {
      setErreur('Erreur réseau. Réessaie.')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: 'white', borderRadius: 16,
        padding: 32, width: '100%', maxWidth: 520,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 18, color: '#1e293b' }}>
          Postuler — {offre.titre}
        </h2>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748b' }}>
          {offre.entreprise.nom}
        </p>

        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
          Lettre de motivation *
        </label>
        <textarea
          value={lettre}
          onChange={e => setLettre(e.target.value)}
          placeholder="Expliquez pourquoi vous êtes intéressé par ce stage et ce que vous apportez..."
          rows={6}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '10px 12px', borderRadius: 8,
            border: '1px solid #cbd5e1', fontSize: 13,
            resize: 'vertical', outline: 'none',
          }}
        />
        <p style={{ margin: '4px 0 16px', fontSize: 11, color: '#94a3b8' }}>
          {lettre.length} / 50 caractères minimum
        </p>

        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
          Lien CV (optionnel)
        </label>
        <input
          type="url"
          value={cv}
          onChange={e => setCv(e.target.value)}
          placeholder="https://drive.google.com/..."
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '10px 12px', borderRadius: 8,
            border: '1px solid #cbd5e1', fontSize: 13,
            outline: 'none',
          }}
        />

        {erreur && (
          <p style={{ color: '#dc2626', fontSize: 13, marginTop: 12 }}>⚠️ {erreur}</p>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button
            onClick={onFermer}
            style={{
              flex: 1, padding: '11px 0', borderRadius: 8,
              border: '1px solid #e2e8f0', background: 'white',
              cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#64748b',
            }}
          >
            Annuler
          </button>
          <button
            onClick={envoyer}
            disabled={envoi}
            style={{
              flex: 2, padding: '11px 0', borderRadius: 8,
              border: 'none', background: envoi ? '#93c5fd' : '#2563eb',
              cursor: envoi ? 'not-allowed' : 'pointer',
              fontWeight: 600, fontSize: 14, color: 'white',
            }}
          >
            {envoi ? 'Envoi…' : 'Envoyer ma candidature'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────
export default function PageOffresEtudiant() {
  const router = useRouter()
  const [offres,         setOffres]         = useState<Offre[]>([])
  const [chargement,     setChargement]     = useState(true)
  const [erreur,         setErreur]         = useState('')
  const [offreSelectee,  setOffreSelectee]  = useState<Offre | null>(null)
  const [dejaPostules,   setDejaPostules]   = useState<Set<number>>(new Set())
  const [toast,          setToast]          = useState('')

  // Filtres
  const [recherche,  setRecherche]  = useState('')
  const [domaine,    setDomaine]    = useState('')
  const [dureeMax,   setDureeMax]   = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    const user  = JSON.parse(localStorage.getItem('user') || '{}')
    if (!token || user.role !== 'ETUDIANT') {
      router.replace('/login')
      return
    }
    chargerOffres(token)
    chargerMesCandidatures(token)
  }, [])

  async function chargerOffres(token: string) {
    try {
      const params = new URLSearchParams()
      if (recherche) params.set('search',  recherche)
      if (domaine)   params.set('domaine', domaine)
      if (dureeMax)  params.set('dureeMax', dureeMax)

      const res  = await fetch(`/api/offres?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) setOffres(data.offres)
      else setErreur(data.message)
    } catch {
      setErreur('Impossible de charger les offres')
    } finally {
      setChargement(false)
    }
  }

  async function chargerMesCandidatures(token: string) {
    try {
      const res  = await fetch('/api/candidatures', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) {
        const ids = new Set<number>(data.candidatures.map((c: any) => c.offreId))
        setDejaPostules(ids)
      }
    } catch {}
  }

  function afficherToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  function onSuccesCandidature(offreId: number) {
    setDejaPostules(prev => new Set([...prev, offreId]))
    setOffreSelectee(null)
    afficherToast('🎉 Candidature envoyée avec succès !')
  }

  const offresFiltrees = offres.filter(o => {
    if (recherche && !o.titre.toLowerCase().includes(recherche.toLowerCase()) &&
        !o.description.toLowerCase().includes(recherche.toLowerCase())) return false
    if (domaine && !o.domaine.toLowerCase().includes(domaine.toLowerCase())) return false
    if (dureeMax && o.duree > parseInt(dureeMax)) return false
    return true
  })

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '20px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1e293b' }}>
            Offres de stage
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            {offresFiltrees.length} offre{offresFiltrees.length !== 1 ? 's' : ''} disponible{offresFiltrees.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/etudiant')}
          style={{
            padding: '8px 16px', borderRadius: 8,
            border: '1px solid #e2e8f0', background: 'white',
            cursor: 'pointer', fontSize: 13, color: '#64748b',
          }}
        >
          ← Tableau de bord
        </button>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px' }}>
        {/* Filtres */}
        <div style={{
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          padding: '16px 20px',
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 24,
        }}>
          <input
            type="text"
            placeholder="🔍 Rechercher une offre..."
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            style={{
              flex: 2, minWidth: 200,
              padding: '9px 12px', borderRadius: 8,
              border: '1px solid #e2e8f0', fontSize: 13, outline: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Domaine (ex: Informatique)"
            value={domaine}
            onChange={e => setDomaine(e.target.value)}
            style={{
              flex: 1, minWidth: 150,
              padding: '9px 12px', borderRadius: 8,
              border: '1px solid #e2e8f0', fontSize: 13, outline: 'none',
            }}
          />
          <select
            value={dureeMax}
            onChange={e => setDureeMax(e.target.value)}
            style={{
              flex: 1, minWidth: 150,
              padding: '9px 12px', borderRadius: 8,
              border: '1px solid #e2e8f0', fontSize: 13, outline: 'none',
              background: 'white',
            }}
          >
            <option value="">Toutes les durées</option>
            <option value="4">≤ 4 semaines</option>
            <option value="8">≤ 8 semaines</option>
            <option value="12">≤ 12 semaines</option>
            <option value="24">≤ 24 semaines</option>
          </select>
        </div>

        {/* Contenu */}
        {chargement ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
            Chargement des offres…
          </div>
        ) : erreur ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#dc2626' }}>{erreur}</div>
        ) : offresFiltrees.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
            Aucune offre ne correspond à ta recherche.
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 20,
          }}>
            {offresFiltrees.map(offre => (
              <CarteOffre
                key={offre.id}
                offre={offre}
                onPostuler={setOffreSelectee}
                dejaPostule={dejaPostules.has(offre.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {offreSelectee && (
        <ModalCandidature
          offre={offreSelectee}
          onFermer={() => setOffreSelectee(null)}
          onSucces={onSuccesCandidature}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%',
          transform: 'translateX(-50%)',
          background: '#16a34a', color: 'white',
          padding: '12px 24px', borderRadius: 10,
          fontWeight: 600, fontSize: 14,
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          zIndex: 9999,
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}
