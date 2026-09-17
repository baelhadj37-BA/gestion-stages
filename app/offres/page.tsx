'use client';

import { useState, useEffect } from 'react';
import BoutonPostuler from '@/components/BoutonPostuler';

interface Offre {
  id: string;
  titre: string;
  description: string;
  entreprise: string;
  lieu: string;
}

const offresSecours: Offre[] = [
  {
    id: 'off-1',
    titre: 'Développeur Fullstack Next.js',
    entreprise: 'Tech Sénégal',
    lieu: 'Dakar',
    description: 'Conception d\'applications web modernes avec Next.js 15, TypeScript et Prisma ORM.',
  },
  {
    id: 'off-2',
    titre: 'Développeur Frontend Angular',
    entreprise: 'Innov Dakar',
    lieu: 'Dakar / Télétravail',
    description: 'Développement d\'interfaces utilisateur dynamiques et intégration d\'APIs RESTful.',
  },
];

export default function OffresPage() {
  const [offres, setOffres] = useState<Offre[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isSubscribed = true;

    const fetchOffres = async () => {
      try {
        const res = await fetch('/api/offres');
        if (res.ok) {
          const data = await res.json();
          if (isSubscribed && Array.isArray(data) && data.length > 0) {
            setOffres(data);
            return;
          }
        }
        // Utilisation des données de secours si l'API est vide ou en erreur
        if (isSubscribed) setOffres(offresSecours);
      } catch (err) {
        console.error('Erreur de chargement:', err);
        if (isSubscribed) setOffres(offresSecours);
      } finally {
        if (isSubscribed) setLoading(false);
      }
    };

    fetchOffres();

    return () => {
      isSubscribed = false;
    };
  }, []);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>Offres de Stage</h1>
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
          Découvrez et postulez aux opportunités de stage disponibles
        </p>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
          Chargement des offres...
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {offres.map((offre) => (
            <div
              key={offre.id}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                  {offre.titre}
                </h3>
                <p style={{ color: '#2563eb', fontWeight: '500', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                  {offre.entreprise} — {offre.lieu}
                </p>
                <p style={{ color: '#4b5563', fontSize: '0.875rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
                  {offre.description}
                </p>
              </div>

              <BoutonPostuler offreId={offre.id} titreOffre={offre.titre} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}