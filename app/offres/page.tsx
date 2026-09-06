import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const revalidate = 0; // Garantit un affichage en temps réel des nouvelles offres

export default async function OffresPage() {
  const offres = await prisma.offre.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Offres de Stages</h1>
          <p className="text-gray-400 text-sm mt-1">
            Découvrez et postulez aux dernières opportunités
          </p>
        </div>
        <Link
          href="/offres/creer"
          className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2.5 rounded-lg transition"
        >
          + Créer une offre
        </Link>
      </div>

      {offres.length === 0 ? (
        <div className="text-center py-12 bg-gray-900 rounded-xl border border-gray-800">
          <p className="text-gray-400">Aucune offre disponible pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offres.map((offre) => (
            <div
              key={offre.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col justify-between hover:border-gray-700 transition"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-semibold text-white capitalize">
                    {offre.titre}
                  </h2>
                  {offre.tags && (
                    <span className="bg-blue-950/60 text-blue-400 text-xs px-2.5 py-1 rounded-full border border-blue-800">
                      {offre.tags}
                    </span>
                  )}
                </div>

                <p className="text-blue-400 text-sm font-medium mb-3">
                  🏢 {offre.entreprise}
                </p>

                <p className="text-gray-400 text-sm line-clamp-3 mb-4">
                  {offre.description}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-800 flex items-center justify-between mt-auto">
                <div className="text-xs text-gray-400 flex flex-col gap-1">
                  <span>📍 {offre.localisation}</span>
                  <span>⏱️ {offre.duree}</span>
                </div>

                <button className="bg-gray-800 hover:bg-blue-600 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition border border-gray-700 hover:border-blue-500">
                  Postuler
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}