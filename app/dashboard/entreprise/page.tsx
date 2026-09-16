'use client';

import { useState } from 'react';

interface Convention {
  id: string;
  etudiant: string;
}

export default function DashboardEntreprisePage() {
  const [activeTab, setActiveTab] = useState<'journaux' | 'conventions'>('conventions');
  const [motifsRejet, setMotifsRejet] = useState<{ [key: string]: string }>({});

  // Exemple de données de conventions à valider
  const [conventions, setConventions] = useState<Convention[]>([
    { id: '1', etudiant: 'Lamine Tounkara' },
  ]);

  const handleMotifChange = (id: string, value: string) => {
    setMotifsRejet((prev) => ({ ...prev, [id]: value }));
  };

  const handleValider = (id: string) => {
    console.log('Convention validée:', id);
    setConventions((prev) => prev.filter((c) => c.id !== id));
  };

  const handleRejeter = (id: string) => {
    const motif = motifsRejet[id];
    if (!motif) {
      alert('Veuillez saisir un motif de rejet.');
      return;
    }
    console.log('Convention rejetée:', id, 'Motif:', motif);
    setConventions((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans flex flex-col text-slate-800">
      {/* Navbar supérieure bleue */}
      <header className="bg-[#1e2b70] text-white px-8 py-4 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight">IPD Gestion des Stages</h1>
          <p className="text-xs text-slate-300">Espace entreprise</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span>Bonjour, <strong className="font-semibold">SARL TechCorp</strong></span>
          <button className="bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-1.5 rounded-md transition-colors text-xs">
            Déconnexion
          </button>
        </div>
      </header>

      {/* Corps principal : Sidebar + Contenu */}
      <div className="flex flex-1">
        {/* Sidebar gauche */}
        <aside className="w-64 bg-white border-r border-slate-200 p-4 space-y-2">
          <button
            onClick={() => setActiveTab('journaux')}
            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'journaux'
                ? 'bg-[#1e2b70] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            📄 Journaux à valider (0)
          </button>

          <button
            onClick={() => setActiveTab('conventions')}
            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'conventions'
                ? 'bg-[#1e2b70] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            📄 Conventions à valider ({conventions.length})
          </button>
        </aside>

        {/* Zone de contenu */}
        <main className="flex-1 p-8">
          {activeTab === 'conventions' && (
            <div className="space-y-6 max-w-5xl">
              <h2 className="text-2xl font-bold text-[#1e2b70]">
                Conventions à valider
              </h2>

              {conventions.length === 0 ? (
                <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
                  Aucune convention en attente de validation.
                </div>
              ) : (
                conventions.map((conv) => (
                  <div
                    key={conv.id}
                    className="bg-white rounded-xl border-l-4 border-l-[#1e2b70] border border-slate-200 shadow-sm p-6 space-y-4"
                  >
                    <h3 className="text-lg font-semibold text-slate-800">
                      {conv.etudiant}
                    </h3>

                    <input
                      type="text"
                      placeholder="Motif de rejet (si rejet)"
                      value={motifsRejet[conv.id] || ''}
                      onChange={(e) => handleMotifChange(conv.id, e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                    />

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        onClick={() => handleRejeter(conv.id)}
                        className="bg-red-100 hover:bg-red-200 text-red-600 text-xs font-semibold px-4 py-2 rounded-md transition-colors"
                      >
                        Rejeter
                      </button>
                      <button
                        onClick={() => handleValider(conv.id)}
                        className="bg-[#1e2b70] hover:bg-indigo-900 text-white text-xs font-semibold px-5 py-2 rounded-md transition-colors shadow-sm"
                      >
                        Valider
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'journaux' && (
            <div className="max-w-5xl">
              <h2 className="text-2xl font-bold text-[#1e2b70] mb-4">
                Journaux à valider
              </h2>
              <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
                Aucun journal de stage à valider pour le moment.
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}