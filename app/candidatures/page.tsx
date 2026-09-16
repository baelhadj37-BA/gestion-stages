'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Candidature {
  id: string;
  offreTitre: string;
  entreprise: string;
  datePostulation: string;
  statut: 'EN_ATTENTE' | 'ACCEPTE' | 'REFUSE';
}

export default function CandidaturesPage() {
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isSubscribed = true;

    const fetchCandidatures = async () => {
      try {
        const res = await fetch('/api/candidatures');
        const data = await res.json();
        if (isSubscribed && Array.isArray(data)) {
          setCandidatures(data);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des candidatures:', err);
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    fetchCandidatures();

    return () => {
      isSubscribed = false;
    };
  }, []);

  const getBadgeStyle = (statut: string) => {
    switch (statut) {
      case 'ACCEPTE':
        return { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' };
      case 'REFUSE':
        return { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' };
      default:
        return { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' };
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'ACCEPTE':
        return 'Acceptée';
      case 'REFUSE':
        return 'Refusée';
      default:
        return 'En attente';
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      {/* En-tête */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>Mes Candidatures</h1>
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
          Suivez l'état de vos postulations aux offres de stage
        </p>
      </div>

      {/* Tableau des Candidatures */}
      {loading ? (
        <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
          Chargement de vos candidatures...
        </p>
      ) : candidatures.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', border: '1px solid #e5e7eb', borderRadius: '0.5rem', backgroundColor: '#ffffff' }}>
          <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
            Vous n'avez encore postulé à aucune offre.
          </p>
          <Link
            href="/offres"
            style={{ display: 'inline-block', backgroundColor: '#2563eb', color: '#ffffff', padding: '0.5rem 1rem', borderRadius: '0.375rem', textDecoration: 'none', fontSize: '0.875rem', fontWeight: '500' }}
          >
            Découvrir les offres
          </Link>
        </div>
      ) : (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '0.5rem', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Offre de stage</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Entreprise</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Date de postulation</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {candidatures.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: '#111827' }}>
                    {item.offreTitre}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>
                    {item.entreprise}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>
                    {item.datePostulation}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span
                      style={{
                        ...getBadgeStyle(item.statut),
                        padding: '0.25rem 0.625rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        display: 'inline-block',
                      }}
                    >
                      {getStatutLabel(item.statut)}
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