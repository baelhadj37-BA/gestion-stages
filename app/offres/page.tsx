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
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>Offres de Stage</h1>
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Trouvez le stage qui correspond à vos compétences.</p>
      </div>

      {/* Barre de recherche */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <input
          type="text"
          placeholder="Rechercher par titre, entreprise..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '0.5rem 1rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
        />
        <input
          type="text"
          placeholder="Filtrer par ville/localisation..."
          value={localisation}
          onChange={(e) => setLocalisation(e.target.value)}
          style={{ padding: '0.5rem 1rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
        />
      </div>

      {/* Affichage en Tableau */}
      {loading ? (
        <p style={{ textAlign: 'center', color: '#6b7280' }}>Chargement des offres...</p>
      ) : offres.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#6b7280' }}>Aucune offre trouvée.</p>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <tr>
                <th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Titre du poste</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Entreprise</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Localisation</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Durée</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Description</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: '600', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {offres.map((offre) => (
                <tr key={offre.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>{offre.titre}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{offre.entreprise}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>📍 {offre.localisation}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>⏱️ {offre.duree}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563', maxWidth: '300px' }}>{offre.description}</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    <BoutonPostuler offreId={offre.id} titreOffre={offre.titre} />
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