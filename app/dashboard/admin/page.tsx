// app/dashboard/admin/page.tsx
// Tableau de bord administrateur — IPD Gestion des Stages

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

// Types
interface Stats {
  utilisateurs: { total: number; etudiants: number; entreprises: number; encadreurs: number }
  offres: { total: number; enAttente: number; publiees: number }
  candidatures: { total: number; acceptees: number; refusees: number; tauxAcceptation: string }
  stages: { total: number; enCours: number; termines: number; tauxPlacement: string }
  alertes: { etudiantsEnRetard: number; offresEnAttente: number }
}

interface User {
  id: number
  nom: string
  prenom: string
  email: string
  role: string
  createdAt: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [onglet, setOnglet] = useState('stats')
  const [chargement, setChargement] = useState(true)
  const [admin, setAdmin] = useState<{ nom: string; prenom: string } | null>(null)

  const chargerDonnees = async (token: string) => {
    try {
      // Charger stats et users en parallèle
      const [statsRes, usersRes] = await Promise.all([
        fetch('/api/admin/stats', {
          headers: { authorization: `Bearer ${token}` }
        }),
        fetch('/api/admin/users', {
          headers: { authorization: `Bearer ${token}` }
        })
      ])

      const statsData = await statsRes.json()
      const usersData = await usersRes.json()

      setStats(statsData)
      setUsers(usersData.users || [])
    } catch (error) {
      console.error('Erreur chargement données:', error)
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')

    if (!token || !user) {
      router.push('/login')
      return
    }

    const userData = JSON.parse(user)
    if (userData.role !== 'ADMIN') {
      router.push('/login')
      return
    }

    const fetchData = async () => {
      setAdmin(userData)
      await chargerDonnees(token)
    }

    fetchData()
  }, [router])

  const seDeconnecter = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  if (chargement) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #1a237e 0%, #1565c0 100%)' }}>
        <div className="text-white text-xl">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Navbar */}
      <nav className="text-white shadow-lg px-6 py-4 flex items-center justify-between"
        style={{ backgroundColor: '#1a237e' }}>
        <div className="flex items-center gap-3">
          <Image src="/logo-ipd.png" alt="Logo IPD" width={40} height={40}
            className="object-contain" style={{ mixBlendMode: 'multiply', filter: 'brightness(0) invert(1)' }} />
          <div>
            <h1 className="font-bold text-lg">IPD Gestion des Stages</h1>
            <p className="text-blue-200 text-xs">Administration</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-blue-200 text-sm">
            Bonjour, {admin?.prenom} {admin?.nom}
          </span>
          <button onClick={seDeconnecter}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Déconnexion
          </button>
        </div>
      </nav>

      <div className="flex">

        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-md min-h-screen p-4">
          <nav className="space-y-2">
            {[
              { id: 'stats', label: '📊 Statistiques', },
              { id: 'users', label: '👥 Utilisateurs', },
              { id: 'offres', label: '💼 Offres en attente', },
            ].map(item => (
              <button key={item.id} onClick={() => setOnglet(item.id)}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                  onglet === item.id
                    ? 'text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
                style={onglet === item.id ? { backgroundColor: '#1a237e' } : {}}>
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Contenu principal */}
        <main className="flex-1 p-6">

          {/* ── ONGLET STATISTIQUES ── */}
          {onglet === 'stats' && stats && (
            <div>
              <h2 className="text-2xl font-bold text-blue-900 mb-6">
                Tableau de bord
              </h2>

              {/* Alertes */}
              {(stats.alertes.etudiantsEnRetard > 0 || stats.alertes.offresEnAttente > 0) && (
                <div className="bg-orange-50 border border-orange-300 rounded-lg p-4 mb-6">
                  <h3 className="font-bold text-orange-700 mb-2">⚠️ Alertes</h3>
                  {stats.alertes.etudiantsEnRetard > 0 && (
                    <p className="text-orange-600 text-sm">
                      {stats.alertes.etudiantsEnRetard} étudiant(s) en retard sur leur journal
                    </p>
                  )}
                  {stats.alertes.offresEnAttente > 0 && (
                    <p className="text-orange-600 text-sm">
                      {stats.alertes.offresEnAttente} offre(s) en attente de validation
                    </p>
                  )}
                </div>
              )}

              {/* Cartes statistiques */}
              <div className="grid grid-cols-2 gap-4 mb-6">

                {/* Utilisateurs */}
                <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-blue-900">
                  <h3 className="text-gray-500 text-sm mb-2">Utilisateurs</h3>
                  <p className="text-3xl font-bold text-blue-900">{stats.utilisateurs.total}</p>
                  <div className="mt-3 space-y-1 text-sm text-gray-500">
                    <p>🎓 Étudiants : {stats.utilisateurs.etudiants}</p>
                    <p>🏢 Entreprises : {stats.utilisateurs.entreprises}</p>
                    <p>👨‍🏫 Encadreurs : {stats.utilisateurs.encadreurs}</p>
                  </div>
                </div>

                {/* Offres */}
                <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-green-500">
                  <h3 className="text-gray-500 text-sm mb-2">Offres de stage</h3>
                  <p className="text-3xl font-bold text-green-600">{stats.offres.total}</p>
                  <div className="mt-3 space-y-1 text-sm text-gray-500">
                    <p>⏳ En attente : {stats.offres.enAttente}</p>
                    <p>✅ Publiées : {stats.offres.publiees}</p>
                  </div>
                </div>

                {/* Candidatures */}
                <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-purple-500">
                  <h3 className="text-gray-500 text-sm mb-2">Candidatures</h3>
                  <p className="text-3xl font-bold text-purple-600">{stats.candidatures.total}</p>
                  <div className="mt-3 space-y-1 text-sm text-gray-500">
                    <p>✅ Acceptées : {stats.candidatures.acceptees}</p>
                    <p>❌ Refusées : {stats.candidatures.refusees}</p>
                    <p>📊 Taux : {stats.candidatures.tauxAcceptation}</p>
                  </div>
                </div>

                {/* Stages */}
                <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-orange-500">
                  <h3 className="text-gray-500 text-sm mb-2">Stages</h3>
                  <p className="text-3xl font-bold text-orange-600">{stats.stages.total}</p>
                  <div className="mt-3 space-y-1 text-sm text-gray-500">
                    <p>🔄 En cours : {stats.stages.enCours}</p>
                    <p>✅ Terminés : {stats.stages.termines}</p>
                    <p>📊 Taux placement : {stats.stages.tauxPlacement}</p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ── ONGLET UTILISATEURS ── */}
          {onglet === 'users' && (
            <div>
              <h2 className="text-2xl font-bold text-blue-900 mb-6">
                Gestion des utilisateurs
              </h2>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead style={{ backgroundColor: '#1a237e' }}>
                    <tr>
                      {['ID', 'Nom', 'Prénom', 'Email', 'Rôle', 'Date'].map(h => (
                        <th key={h} className="text-white text-left px-4 py-3 text-sm font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, index) => (
                      <tr key={user.id}
                        className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="px-4 py-3 text-sm text-gray-600">{user.id}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">{user.nom}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{user.prenom}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === 'ADMIN' ? 'bg-red-100 text-red-700' :
                            user.role === 'ETUDIANT' ? 'bg-blue-100 text-blue-700' :
                            user.role === 'ENTREPRISE' ? 'bg-green-100 text-green-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── ONGLET OFFRES ── */}
          {onglet === 'offres' && (
            <div>
              <h2 className="text-2xl font-bold text-blue-900 mb-6">
                Offres en attente de validation
              </h2>
              <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-400">
                <p className="text-4xl mb-2">💼</p>
                <p>Aucune offre en attente pour le moment</p>
                <p className="text-sm mt-1">Les offres publiées par les entreprises apparaîtront ici</p>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}