'use client';

import { useState, useEffect } from 'react';

interface Candidature {
  id: string;
  statut: string;
  createdAt: string;
  cvUrl?: string; // Lien du CV enregistré dans Prisma
  offre?: {
    titre: string;
    entreprise: string;
    lieu: string;
  };
}

export default function CandidaturesPage() {
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isSubscribed = true;

    const fetchCandidatures = async () => {
      try {
        const res = await fetch('/api/candidatures');
        if (!res.ok) throw new Error('Erreur réseau');
        const data = await res.json();
        if (isSubscribed && Array.isArray(data)) {
          setCandidatures(data);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des candidatures:', err);
      } finally {
        if (isSubscribed) setLoading(false);
      }
    };

    fetchCandidatures();

    return () => {
      isSubscribed = false;
    };
  }, []);

  const getBadgeStyle = (statut: string) => {
    switch (statut) {
      case 'ACCEPTEE':
      case 'ACCEPTE':
        return { backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' };
      case 'REFUSEE':
      case 'REFUSE':
        return { backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' };
      default:
        return { backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' };
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>Mes Candidatures</h1>
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
          Suivez l'état de vos demandes de stage
        </p>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
          Chargement de vos candidatures...
        </p>
      ) : candidatures.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', border: '1px solid #e5e7eb', borderRadius: '0.5rem', backgroundColor: '#ffffff' }}>
          <p style={{ color: '#6b7280' }}>Vous n'avez encore postulé à aucune offre.</p>
        </div>
      ) : (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '0.5rem', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Offre / Poste</th>
                <th style={{ padding: '0.75rem 1rem' }}>Entreprise</th>
                <th style={{ padding: '0.75rem 1rem' }}>Document</th>
                <th style={{ padding: '0.75rem 1rem' }}>Date de demande</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {candidatures.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>
                    {item.offre?.titre || 'Stage Développeur'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>
                    {item.offre?.entreprise || 'Entreprise'}
                  </td>

                  {/* Lien de visionnage du CV */}
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {item.cvUrl ? (
                      <a
                        href={item.cvUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#2563eb', textDecoration: 'underline', fontWeight: '500' }}
                      >
                        📄 Voir le CV
                      </a>
                    ) : (
                      <span style={{ color: '#9ca3af' }}>Aucun document</span>
                    )}
                  </td>

                  <td style={{ padding: '0.75rem 1rem', color: '#6b7280' }}>
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString('fr-FR') : 'Récemment'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    <span
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        display: 'inline-block',
                        ...getBadgeStyle(item.statut),
                      }}
                    >
                      {item.statut === 'ACCEPTEE' || item.statut === 'ACCEPTE'
                        ? 'Acceptée'
                        : item.statut === 'REFUSEE' || item.statut === 'REFUSE'
                        ? 'Refusée'
                        : 'En attente'}
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