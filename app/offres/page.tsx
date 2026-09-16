'use client';

import { useState, useEffect } from 'react';
import BoutonPostuler from '@/components/BoutonPostuler';

interface Offre {
  id: string;
  titre: string;
  entreprise: string;
  localisation: string;
  duree: string;
  description: string;
  tags?: string[];
}

export default function OffresPage() {
  const [offres, setOffres] = useState<Offre[]>([]);
  const [search, setSearch] = useState('');
  const [localisation, setLocalisation] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isSubscribed = true;

    const fetchOffres = async () => {
      try {
        const res = await fetch(
          `/api/offres?q=${encodeURIComponent(search)}&localisation=${encodeURIComponent(localisation)}`
        );
        const data = await res.json();
        if (isSubscribed && Array.isArray(data)) {
          setOffres(data);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des offres:', err);
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    fetchOffres();

    return () => {
      isSubscribed = false;
    };
  }, [search, localisation]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Offres de Stage</h1>
        <p className="text-gray-400 text-sm">Trouvez le stage qui correspond à vos compétences.</p>
      </div>

      {/* Barre de Recherche & Filtres */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-900 p-4 rounded-xl border border-gray-800">
        <input
          type="text"
          placeholder="Rechercher par titre, entreprise ou mot-clé..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
        />
        <input
          type="text"
          placeholder="Filtrer par ville/localisation (ex: Dakar)..."
          value={localisation}
          onChange={(e) => setLocalisation(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Liste des Offres */}
      {loading ? (
        <p className="text-gray-400 text-center py-8">Chargement des offres...</p>
      ) : offres.length === 0 ? (
        <p className="text-gray-400 text-center py-8">Aucune offre ne correspond à votre recherche.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {offres.map((offre) => (
            <div key={offre.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold text-white capitalize">{offre.titre}</h2>
                    <p className="text-sm text-blue-400 mt-1">{offre.entreprise} • 📍 {offre.localisation}</p>
                  </div>
                  <span className="text-xs bg-gray-800 text-gray-300 px-3 py-1 rounded-full border border-gray-700">
                    ⏱️ {offre.duree}
                  </span>
                </div>

                <p className="text-gray-300 text-sm mt-4 line-clamp-3">{offre.description}</p>

                {/* Badges Tags / Compétences */}
                {offre.tags && offre.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {offre.tags.map((tag, idx) => (
                      <span key={idx} className="bg-blue-950/60 text-blue-300 text-xs px-2.5 py-1 rounded-md border border-blue-800/50">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-800/80 flex justify-end">
                <BoutonPostuler offreId={offre.id} titreOffre={offre.titre} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}