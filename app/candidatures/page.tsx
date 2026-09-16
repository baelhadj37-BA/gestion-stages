import { prisma } from '@/lib/prisma';

export const revalidate = 0;

export default async function CandidaturesPage() {
  const candidatures = await prisma.candidature.findMany({
    include: {
      offre: true,
      user: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Mes Candidatures</h1>
        <p className="text-gray-400 text-sm mt-1">
          Suivez l&apos;état de vos postulations aux offres de stage
        </p>
      </div>

      {candidatures.length === 0 ? (
        <div className="text-center py-12 bg-gray-900 rounded-xl border border-gray-800">
          <p className="text-gray-400">Vous n&apos;avez encore postulé à aucune offre.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-900">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-gray-800/60 text-xs uppercase text-gray-400 border-b border-gray-800">
              <tr>
                <th className="px-6 py-4">Offre</th>
                <th className="px-6 py-4">Entreprise</th>
                <th className="px-6 py-4">Candidat</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {candidatures.map((candidature) => (
                <tr key={candidature.id} className="hover:bg-gray-800/40 transition">
                  <td className="px-6 py-4 font-medium text-white capitalize">
                    {candidature.offre.titre}
                  </td>
                  <td className="px-6 py-4 text-blue-400 font-medium">
                    {candidature.offre.entreprise}
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    {candidature.user?.nom || candidature.user?.email || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-xs">
                    {new Date(candidature.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-yellow-950/60 text-yellow-400 border border-yellow-800 text-xs px-3 py-1 rounded-full font-medium">
                      {candidature.statut}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}