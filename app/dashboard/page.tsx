import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const revalidate = 0;

export default async function DashboardPage() {
  const [totalOffres, totalCandidatures, totalUsers] = await Promise.all([
    prisma.offre.count(),
    prisma.candidature.count(),
    prisma.user.count(),
  ]);

  const dernieresOffres = await prisma.offre.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Tableau de Bord</h1>
        <p className="text-gray-400 text-sm mt-1">
          Vue d&apos;ensemble de la plateforme de gestion de stages
        </p>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <p className="text-gray-400 text-sm font-medium">Offres de Stage</p>
          <p className="text-4xl font-bold text-white mt-2">{totalOffres}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <p className="text-gray-400 text-sm font-medium">Candidatures Soumises</p>
          <p className="text-4xl font-bold text-blue-400 mt-2">{totalCandidatures}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <p className="text-gray-400 text-sm font-medium">Utilisateurs Inscrits</p>
          <p className="text-4xl font-bold text-emerald-400 mt-2">{totalUsers}</p>
        </div>
      </div>

      {/* Raccourcis & Dernières offres */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Dernières Offres Publiées</h2>
          <Link
            href="/offres"
            className="text-sm text-blue-400 hover:text-blue-300 font-medium"
          >
            Voir tout →
          </Link>
        </div>

        {dernieresOffres.length === 0 ? (
          <p className="text-gray-400 text-sm">Aucune offre disponible.</p>
        ) : (
          <div className="space-y-4">
            {dernieresOffres.map((offre) => (
              <div
                key={offre.id}
                className="flex items-center justify-between p-4 rounded-lg bg-gray-800/40 border border-gray-800"
              >
                <div>
                  <h3 className="font-medium text-white capitalize">{offre.titre}</h3>
                  <p className="text-sm text-gray-400">{offre.entreprise} • 📍 {offre.localisation}</p>
                </div>
                <span className="text-xs text-gray-400">{offre.duree}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}