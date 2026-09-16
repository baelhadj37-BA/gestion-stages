// app/register/page.tsx
// Page d'inscription — Design professionnel IPD

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    motDePasse: '',
    confirmerMotDePasse: '',
    role: 'ETUDIANT'
  })
  const [afficherMotDePasse, setAfficherMotDePasse] = useState(false)
  const [erreur, setErreur] = useState('')
  const [chargement, setChargement] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErreur('')

    // Vérifier que les mots de passe correspondent
    if (formData.motDePasse !== formData.confirmerMotDePasse) {
      setErreur('Les mots de passe ne correspondent pas')
      return
    }

    setChargement(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          motDePasse: formData.motDePasse,
          role: formData.role
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setErreur(data.message)
        return
      }

      // Sauvegarder le token
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.utilisateur))

      // Rediriger selon le rôle
      const role = data.utilisateur.role
      if (role === 'ETUDIANT') router.push('/dashboard/etudiant')
      else if (role === 'ENTREPRISE') router.push('/dashboard/entreprise')
      else if (role === 'ENCADREUR') router.push('/dashboard/encadreur')

    } catch {
      setErreur('Erreur de connexion — vérifiez votre réseau')
    } finally {
      setChargement(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-8"
      style={{ background: 'linear-gradient(135deg, #1a237e 0%, #1565c0 50%, #bbdefb 100%)' }}>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 flex overflow-hidden">

        {/* Partie gauche — Formulaire */}
        <div className="flex-1 p-10 flex flex-col justify-center">

          {/* Titre */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="h-px w-12 bg-blue-900"></div>
              <h1 className="text-2xl font-bold text-blue-900 tracking-widest uppercase">
                Inscription
              </h1>
              <div className="h-px w-12 bg-blue-900"></div>
            </div>
          </div>

          {/* Message d'erreur */}
          {erreur && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              ⚠️ {erreur}
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-3">

            {/* Nom et Prénom */}
            <div className="flex gap-3">
              <div className="flex-1 flex items-center border border-gray-300 rounded-xl px-4 py-3 focus-within:border-blue-900 focus-within:ring-1 focus-within:ring-blue-900 transition-all">
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  placeholder="Nom"
                  required
                  className="flex-1 outline-none text-gray-700 bg-transparent"
                />
              </div>
              <div className="flex-1 flex items-center border border-gray-300 rounded-xl px-4 py-3 focus-within:border-blue-900 focus-within:ring-1 focus-within:ring-blue-900 transition-all">
                <input
                  type="text"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  placeholder="Prénom"
                  required
                  className="flex-1 outline-none text-gray-700 bg-transparent"
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center border border-gray-300 rounded-xl px-4 py-3 focus-within:border-blue-900 focus-within:ring-1 focus-within:ring-blue-900 transition-all">
              <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Adresse e-mail"
                required
                className="flex-1 outline-none text-gray-700 bg-transparent"
              />
            </div>

            {/* Rôle */}
            <div className="flex items-center border border-gray-300 rounded-xl px-4 py-3 focus-within:border-blue-900 focus-within:ring-1 focus-within:ring-blue-900 transition-all">
              <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="flex-1 outline-none text-gray-700 bg-transparent"
              >
                <option value="ETUDIANT">Étudiant</option>
                <option value="ENTREPRISE">Entreprise</option>
                <option value="ENCADREUR">Encadreur</option>
              </select>
            </div>

            {/* Mot de passe */}
            <div className="flex items-center border border-gray-300 rounded-xl px-4 py-3 focus-within:border-blue-900 focus-within:ring-1 focus-within:ring-blue-900 transition-all">
              <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <input
                type={afficherMotDePasse ? 'text' : 'password'}
                name="motDePasse"
                value={formData.motDePasse}
                onChange={handleChange}
                placeholder="Mot de passe"
                required
                className="flex-1 outline-none text-gray-700 bg-transparent"
              />
              <button type="button" onClick={() => setAfficherMotDePasse(!afficherMotDePasse)}
                className="text-gray-400 hover:text-blue-900 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>

            {/* Confirmer mot de passe */}
            <div className="flex items-center border border-gray-300 rounded-xl px-4 py-3 focus-within:border-blue-900 focus-within:ring-1 focus-within:ring-blue-900 transition-all">
              <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <input
                type={afficherMotDePasse ? 'text' : 'password'}
                name="confirmerMotDePasse"
                value={formData.confirmerMotDePasse}
                onChange={handleChange}
                placeholder="Confirmer le mot de passe"
                required
                className="flex-1 outline-none text-gray-700 bg-transparent"
              />
            </div>

            {/* Bouton inscription */}
            <button
              type="submit"
              disabled={chargement}
              className="w-full py-3 rounded-xl text-white font-semibold text-lg tracking-wide transition-all hover:opacity-90 disabled:opacity-50 mt-2"
              style={{ backgroundColor: '#1a237e' }}
            >
              {chargement ? 'Inscription...' : "S'inscrire"}
            </button>

          </form>

          {/* Lien connexion */}
          <p className="text-center text-sm text-gray-500 mt-4">
            Déjà un compte ?{' '}
            <a href="/login" className="text-blue-600 hover:underline font-medium">
              Se connecter
            </a>
          </p>

        </div>

        {/* Partie droite — Logo IPD */}
        <div className="flex-1 flex flex-col items-center justify-center p-10"
          style={{ background: 'linear-gradient(180deg, #f8f9ff 0%, #e8eaf6 100%)' }}>

          <div className="mb-6">
            <Image
              src="/logo-ipd.png"
              alt="Logo IPD Thomas Sankara"
              width={180}
              height={180}
              className="object-contain"
              style={{ mixBlendMode: 'multiply' }}
            />
          </div>

          <div className="w-16 h-px bg-blue-900 mb-6"></div>

          <div className="text-center">
            <p className="text-blue-900 font-bold text-xl tracking-widest uppercase leading-tight">PLATEFORME</p>
            <p className="text-blue-900 font-bold text-xl tracking-widest uppercase leading-tight">DE</p>
            <p className="text-blue-900 font-bold text-xl tracking-widest uppercase leading-tight">GESTION DE STAGE</p>
          </div>

          <div className="w-16 h-px bg-blue-900 mt-6"></div>

          <p className="text-gray-500 text-xs mt-4 text-center italic">
            S&apos;élever par le savoir pour servir
          </p>

        </div>

      </div>
    </div>
  )
}