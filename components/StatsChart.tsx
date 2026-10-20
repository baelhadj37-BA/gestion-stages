'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const dataStats = [
  { domaine: 'Informatique & Dev', stages: 18, valide: 15 },
  { domaine: 'Réseaux & Sécurité', stages: 12, valide: 10 },
  { domaine: 'Génie Logiciel', stages: 14, valide: 12 },
  { domaine: 'Data Science / IA', stages: 9, valide: 8 },
];

export default function StatsChart() {
  return (
    <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Statistiques des Stages - IPD</h3>
          <p className="text-sm text-gray-500">Suivi des conventions validées par département</p>
        </div>
        <span className="px-3 py-1 bg-pink-50 text-pink-600 text-xs font-semibold rounded-full border border-pink-100">
          Temps Réel
        </span>
      </div>

      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dataStats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="domaine" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            />
            <Legend wrapperStyle={{ paddingTop: '15px' }} />
            <Bar dataKey="stages" name="Total Demandes" fill="#f472b6" radius={[6, 6, 0, 0]} />
            <Bar dataKey="valide" name="Conventions Validées" fill="#db2777" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}