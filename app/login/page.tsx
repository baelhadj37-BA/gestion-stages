// app/login/page.tsx
// Page de connexion — Design professionnel IPD

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [afficherMotDePasse, setAfficherMotDePasse] = useState(false)
  const [erreur, setErreur] = useState('')
  const [chargement, setChargement] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErreur('')
    setChargement(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, motDePasse })
      })

      const data = await response.json()

      if (!response.ok) {
        setErreur(data.message)
        return
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.utilisateur))

      const role = data.utilisateur.role
      if (role === 'ADMIN') router.push('/dashboard/admin')
      else if (role === 'ETUDIANT') router.push('/dashboard/etudiant')
      else if (role === 'ENTREPRISE') router.push('/dashboard/entreprise')
      else if (role === 'ENCADREUR') router.push('/dashboard/encadreur')

    } catch {
      setErreur('Erreur de connexion — vérifiez votre réseau')
    } finally {
      setChargement(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #1a237e 0%, #1565c0 50%, #bbdefb 100%)' }}>

      {/* Carte principale */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 flex overflow-hidden"
        style={{ minHeight: '480px' }}>

        {/* Partie gauche — Formulaire */}
        <div className="flex-1 p-10 flex flex-col justify-center">

          {/* Titre */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="h-px w-12 bg-blue-900"></div>
              <h1 className="text-2xl font-bold text-blue-900 tracking-widest uppercase">
                LOGIN
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
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div className="flex items-center border border-gray-300 rounded-xl px-4 py-3 focus-within:border-blue-900 focus-within:ring-1 focus-within:ring-blue-900 transition-all">
              <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Adresse e-mail"
                required
                className="flex-1 outline-none text-gray-700 bg-transparent"
              />
            </div>

            {/* Mot de passe */}
            <div className="flex items-center border border-gray-300 rounded-xl px-4 py-3 focus-within:border-blue-900 focus-within:ring-1 focus-within:ring-blue-900 transition-all">
              <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <input
                type={afficherMotDePasse ? 'text' : 'password'}
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                placeholder="Mot de passe"
                required
                className="flex-1 outline-none text-gray-700 bg-transparent"
              />
              <button
                type="button"
                onClick={() => setAfficherMotDePasse(!afficherMotDePasse)}
                className="text-gray-400 hover:text-blue-900 transition-colors"
              >
                {afficherMotDePasse ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Se souvenir de moi */}
            <div className="flex items-center gap-2">
              <input type="checkbox" id="remember" className="w-4 h-4 accent-blue-900" />
              <label htmlFor="remember" className="text-sm text-gray-500">
                Se souvenir de moi
              </label>
            </div>

            {/* Bouton connexion */}
            <button
              type="submit"
              disabled={chargement}
              className="w-full py-3 rounded-xl text-white font-semibold text-lg tracking-wide transition-all hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#1a237e' }}
            >
              {chargement ? 'Connexion...' : 'Se connecter'}
            </button>

          </form>

          {/* Lien inscription */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Vous n&apos;avez pas de compte ?{' '}
            <a href="/register" className="text-blue-600 hover:underline font-medium">
              S&apos;inscrire
            </a>
          </p>

        </div>

        {/* Partie droite — Logo IPD */}
        <div className="flex-1 flex flex-col items-center justify-center p-10"
          style={{ background: 'linear-gradient(180deg, #f8f9ff 0%, #e8eaf6 100%)' }}>

          {/* Logo */}
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

          {/* Ligne séparatrice */}
          <div className="w-16 h-px bg-blue-900 mb-6"></div>

          {/* Texte */}
          <div className="text-center">
            <p className="text-blue-900 font-bold text-xl tracking-widest uppercase leading-tight">
              PLATEFORME
            </p>
            <p className="text-blue-900 font-bold text-xl tracking-widest uppercase leading-tight">
              DE
            </p>
            <p className="text-blue-900 font-bold text-xl tracking-widest uppercase leading-tight">
              GESTION DES STAGES
            </p>
          </div>

          {/* Ligne séparatrice bas */}
          <div className="w-16 h-px bg-blue-900 mt-6"></div>

          {/* Slogan */}
          <p className="text-gray-500 text-xs mt-4 text-center italic">
            S&apos;élever par le savoir pour servir
          </p>

        </div>

      </div>
    </div>
  )
}