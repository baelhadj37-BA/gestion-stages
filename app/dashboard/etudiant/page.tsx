// app/dashboard/etudiant/page.tsx
// Tableau de bord étudiant — IPD Gestion des Stages

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface Stage {
  id: number
  dateDebut: string
  dateFin: string
  statut: string
}

interface JournalEntry {
  id: number
  semaine: number
  contenu: string
  statut: string
  commentaire: string | null
  dateDepot: string
}

interface Convention {
  id: number
  statut: string
  motifRejet: string | null
  pdfUrl: string | null
  qrCodeUrl: string | null
}

export default function EtudiantDashboard() {
  const router = useRouter()
  const [etudiant, setEtudiant] = useState<{ nom: string; prenom: string } | null>(null)
  const [onglet, setOnglet] = useState('journal')
  const [chargement, setChargement] = useState(true)

  const [stage, setStage] = useState<Stage | null>(null)
  const [historique, setHistorique] = useState<JournalEntry[]>([])
  const [contenu, setContenu] = useState('')
  const [envoiJournal, setEnvoiJournal] = useState(false)
  const [erreurJournal, setErreurJournal] = useState('')

  const [convention, setConvention] = useState<Convention | null>(null)
  const [chargementConvention, setChargementConvention] = useState(false)
  const [erreurConvention, setErreurConvention] = useState('')

  const semaineActuelle =
    historique.length === 0
      ? 1
      : Math.max(...historique.map((j) => j.semaine)) +
        (historique.at(-1)?.statut !== 'EN_ATTENTE' ? 1 : 0)

  const chargerJournal = async (token: string, stageId: number) => {
    const res = await fetch(`/api/journal?stageId=${stageId}`, {
      headers: { authorization: `Bearer ${token}` },
    })
    if (res.ok) setHistorique(await res.json())
  }

  const chargerConvention = async (token: string, stageId: number) => {
    const res = await fetch(`/api/convention?stageId=${stageId}`, {
      headers: { authorization: `Bearer ${token}` },
    })
    if (res.ok) setConvention(await res.json())
    else setConvention(null)
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')

    if (!token || !user) {
      router.push('/login')
      return
    }

    const userData = JSON.parse(user)
    if (userData.role !== 'ETUDIANT') {
      router.push('/login')
      return
    }

    const fetchData = async () => {
      setEtudiant(userData)

      const stageRes = await fetch('/api/stages/me', {
        headers: { authorization: `Bearer ${token}` },
      })

      if (stageRes.ok) {
        const stageData = await stageRes.json()
        setStage(stageData)
        await Promise.all([
          chargerJournal(token, stageData.id),
          chargerConvention(token, stageData.id),
        ])
      }

      setChargement(false)
    }

    fetchData()
  }, [router])

  const seDeconnecter = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  const envoyerRapport = async () => {
    setErreurJournal('')
    if (contenu.trim().length < 10) {
      setErreurJournal('Décris un peu plus ce que tu as fait cette semaine.')
      return
    }
    if (!stage) return

    setEnvoiJournal(true)
    const token = localStorage.getItem('token')!
    const res = await fetch('/api/journal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ stageId: stage.id, semaine: semaineActuelle, contenu }),
    })
    setEnvoiJournal(false)

    if (!res.ok) {
      const data = await res.json()
      setErreurJournal(data.error ?? "L'envoi a échoué.")
      return
    }
    setContenu('')
    await chargerJournal(token, stage.id)
  }

  const demarrerConvention = async () => {
    if (!stage) return
    setErreurConvention('')
    setChargementConvention(true)
    const token = localStorage.getItem('token')!
    const res = await fetch('/api/convention', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ stageId: stage.id }),
    })
    setChargementConvention(false)

    if (!res.ok) {
      const data = await res.json()
      setErreurConvention(data.error ?? 'Impossible de démarrer la convention.')
      return
    }
    await chargerConvention(token, stage.id)
  }

  if (chargement) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #1a237e 0%, #1565c0 100%)' }}>
        <div className="text-white text-xl">Chargement...</div>
      </div>
    )
  }

  const badgeStatut = (statut: string) => {
    const styles: Record<string, string> = {
      VALIDE: 'bg-green-100 text-green-700',
      VALIDEE: 'bg-green-100 text-green-700',
      REJETE: 'bg-red-100 text-red-700',
      REJETEE: 'bg-red-100 text-red-700',
      SOUMIS: 'bg-blue-100 text-blue-700',
      EN_ATTENTE: 'bg-orange-100 text-orange-700',
      ETAPE_ETUDIANT: 'bg-orange-100 text-orange-700',
      ETAPE_ENTREPRISE: 'bg-blue-100 text-blue-700',
      ETAPE_ADMIN: 'bg-purple-100 text-purple-700',
    }
    return styles[statut] ?? 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="min-h-screen bg-gray-100">

      <nav className="text-white shadow-lg px-6 py-4 flex items-center justify-between"
        style={{ backgroundColor: '#1a237e' }}>
        <div className="flex items-center gap-3">
          <Image src="/logo-ipd.png" alt="Logo IPD" width={40} height={40}
            className="object-contain" style={{ mixBlendMode: 'multiply', filter: 'brightness(0) invert(1)' }} />
          <div>
            <h1 className="font-bold text-lg">IPD Gestion des Stages</h1>
            <p className="text-blue-200 text-xs">Espace étudiant</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-blue-200 text-sm">
            Bonjour, {etudiant?.prenom} {etudiant?.nom}
          </span>
          <button onClick={seDeconnecter}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Déconnexion
          </button>
        </div>
      </nav>

      <div className="flex">

        <aside className="w-64 bg-white shadow-md min-h-screen p-4">
          <nav className="space-y-2">
            {[
              { id: 'journal', label: 'Journal de bord' },
              { id: 'convention', label: 'Convention de stage' },
            ].map((item) => (
              <button key={item.id} onClick={() => setOnglet(item.id)}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                  onglet === item.id ? 'text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
                style={onglet === item.id ? { backgroundColor: '#1a237e' } : {}}>
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-6">

          {!stage && (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-400">
              <p className="text-4xl mb-2">📭</p>
              <p>Aucun stage actif trouvé sur ton compte.</p>
            </div>
          )}

          {stage && onglet === 'journal' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-blue-900">Journal de bord</h2>
                <span className="text-3xl font-bold" style={{ color: '#1a237e' }}>
                  Semaine {String(semaineActuelle).padStart(2, '0')}
                </span>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-blue-900 mb-6">
                <h3 className="text-gray-700 font-medium mb-3">Rapport de la semaine</h3>
                <textarea
                  value={contenu}
                  onChange={(e) => setContenu(e.target.value)}
                  rows={6}
                  placeholder="Tâches réalisées, difficultés rencontrées, ce que tu as appris..."
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-700 outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all resize-none"
                />
                {erreurJournal && (
                  <p className="text-red-600 text-sm mt-2">⚠️ {erreurJournal}</p>
                )}
                <div className="flex justify-end mt-4">
                  <button
                    onClick={envoyerRapport}
                    disabled={envoiJournal}
                    className="px-6 py-2.5 rounded-xl text-white font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: '#1a237e' }}
                  >
                    {envoiJournal ? 'Envoi...' : 'Envoyer le rapport'}
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="text-gray-700 font-medium">Historique</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {historique.length === 0 && (
                    <p className="px-6 py-6 text-gray-400 text-sm">
                      Ton premier rapport apparaîtra ici une fois envoyé.
                    </p>
                  )}
                  {historique.map((j) => (
                    <div key={j.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-800">
                          Semaine {String(j.semaine).padStart(2, '0')}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeStatut(j.statut)}`}>
                          {j.statut}
                        </span>
                      </div>
                      {j.commentaire && (
                        <p className="text-sm text-gray-500 italic mt-1">&quot;{j.commentaire}&quot;</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {stage && onglet === 'convention' && (
            <div>
              <h2 className="text-2xl font-bold text-blue-900 mb-6">Convention de stage</h2>

              {!convention && (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                  <p className="text-4xl mb-2">📄</p>
                  <p className="text-gray-500 mb-4">
                    Tu n&apos;as pas encore démarré ta convention de stage.
                  </p>
                  {erreurConvention && (
                    <p className="text-red-600 text-sm mb-3">⚠️ {erreurConvention}</p>
                  )}
                  <button
                    onClick={demarrerConvention}
                    disabled={chargementConvention}
                    className="px-6 py-2.5 rounded-xl text-white font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: '#1a237e' }}
                  >
                    {chargementConvention ? 'Démarrage...' : 'Démarrer ma convention'}
                  </button>
                </div>
              )}

              {convention && (
                <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-blue-900">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-700 font-medium">Statut actuel</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${badgeStatut(convention.statut)}`}>
                      {convention.statut}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    {['ETAPE_ETUDIANT', 'ETAPE_ENTREPRISE', 'ETAPE_ADMIN'].map((etape) => {
                      const ordre = ['ETAPE_ETUDIANT', 'ETAPE_ENTREPRISE', 'ETAPE_ADMIN', 'VALIDEE']
                      const franchi = ordre.indexOf(convention.statut) >= ordre.indexOf(etape)
                      return (
                        <div key={etape} className="flex items-center flex-1">
                          <div
                            className={`h-2 flex-1 rounded-full ${
                              franchi ? 'bg-blue-900' : 'bg-gray-200'
                            }`}
                          />
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mb-4">
                    <span>Étudiant</span>
                    <span>Entreprise</span>
                    <span>Admin</span>
                  </div>

                  {convention.statut === 'REJETEE' && convention.motifRejet && (
                    <p className="text-red-600 text-sm mt-2">
                      Motif du rejet : {convention.motifRejet}
                    </p>
                  )}

                  {convention.statut === 'VALIDEE' && (
                    <div className="mt-4 flex items-center gap-4">
                      {convention.qrCodeUrl && (
                        <img
                          src={convention.qrCodeUrl}
                          alt="QR Code de vérification"
                          className="w-24 h-24 border border-gray-200 rounded-lg p-1"
                        />
                      )}
                      <div>
                        <p className="text-sm text-gray-500 mb-1">
                          Document sécurisé avec QR Code anti-falsification.
                        </p>
                        {convention.pdfUrl && (
               <a
                            href={convention.pdfUrl}
                            target="_blank"
                            className="text-blue-700 hover:underline text-sm font-medium"
                          >
                            Télécharger la convention validée
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  )
}