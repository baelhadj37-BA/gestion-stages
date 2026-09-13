'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';

export default function DashboardPage() {
  // Simulation des données en temps réel (mise à jour toutes les 5 secondes)
  const [stats, setStats] = useState({
    placed: 85,
    total: 100,
    web: 50,
    ai: 22,
    security: 13,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        web: prev.web + Math.floor(Math.random() * 3) - 1,
        ai: prev.ai + Math.floor(Math.random() * 2),
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // 1. Données pour la jauge du taux de placement (Étudiants en stage / total)
  const placementRate = Math.round((stats.placed / stats.total) * 100);
  const placementData = [
    { name: 'Placés', value: stats.placed, color: '#db2777' },
    { name: 'Restants', value: stats.total - stats.placed, color: '#fce7f3' },
  ];

  // 2. Données pour les stages par domaine
  const domainData = [
    { name: 'Développement Web', stages: stats.web },
    { name: 'Data / IA', stages: stats.ai },
    { name: 'Cybersécurité', stages: stats.security },
  ];

  // 3. Données pour les statuts des candidatures
  const statusData = [
    { name: 'Validés', value: 50, color: '#10B981' },
    { name: 'En attente', value: 30, color: '#F59E0B' },
    { name: 'Refusés', value: 20, color: '#EF4444' },
  ];

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10 space-y-8">
      {/* En-tête de la plateforme */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100 gap-4">
        <div>
          <span className="px-3 py-1 bg-pink-50 text-pink-600 text-xs font-semibold rounded-full border border-pink-100">
            IPD - Gestion des Stages 2026 (Temps Réel & Recharts)
          </span>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Tableau de Bord - Suivi des Étapes</h1>
          <p className="text-sm text-gray-500 mt-1">Plateforme officielle - Khady Tall (STI3)</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition text-sm"
          >
            Connexion
          </Link>
          <a
            href="/api/pdf/convention/STAGE-IPD-2026-001"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 bg-pink-600 text-white font-semibold rounded-xl hover:bg-pink-700 transition shadow-md shadow-pink-600/20 flex items-center gap-2 text-sm"
          >
            <span>👁️ Aperçu Convention (Puppeteer)</span>
          </a>
        </div>
      </div>

      {/* Section des Graphiques Recharts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Jauge Circulaire : Taux de Placement */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800 self-start mb-2">Taux de Placement</h2>
          <div className="h-48 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={placementData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                >
                  {placementData.map((entry, index) => (
                    <Cell key={`cell-placement-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-extrabold text-pink-600">{placementRate}%</span>
              <span className="text-xs text-gray-400">Global</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">{stats.placed} étudiants sur {stats.total} en stage</p>
        </div>

        {/* Graphique en Barres : Stages par Domaine */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 md:col-span-2">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Stages par Domaine (Temps Réel)</h2>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={domainData}>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} />
                <YAxis stroke="#888888" fontSize={12} />
                <Tooltip />
                <Bar dataKey="stages" fill="#db2777" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Section Secondaire : Statuts des Candidatures */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Répartition des Statuts des Candidatures</h2>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-status-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </main>
  );
}