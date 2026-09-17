'use client';

import { useState, useEffect } from 'react';

export default function AdminCandidaturesPage() {
  const [candidatures, setCandidatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCandidatures = async () => {
    try {
      const res = await fetch('/api/candidatures');
      const data = await res.json();
      if (Array.isArray(data)) setCandidatures(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidatures();
  }, []);

  const changerStatut = async (id: string, nouveauStatut: 'ACCEPTE' | 'REFUSE') => {
    try {
      await fetch(`/api/candidatures/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: nouveauStatut }),
      });
      fetchCandidatures(); // Rafraîchir la liste
    } catch (err) {
      console.error('Erreur lors de la mise à jour:', err);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
        🛠️ Espace Recruteur - Gestion des Candidatures
      </h1>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '0.5rem', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Candidat / Offre</th>
                <th style={{ padding: '0.75rem 1rem' }}>Entreprise</th>
                <th style={{ padding: '0.75rem 1rem' }}>Statut Actuel</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions Recruteur</th>
              </tr>
            </thead>
            <tbody>
              {candidatures.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>
                    {item.offreTitre || item.titre || item.offre?.titre || 'Développeur Fullstack'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {item.entreprise || item.offre?.entreprise || 'Tech Sénégal'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold' }}>{item.statut}</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    <button
                      onClick={() => changerStatut(item.id, 'ACCEPTE')}
                      style={{ backgroundColor: '#16a34a', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '0.25rem', marginRight: '0.5rem', cursor: 'pointer' }}
                    >
                      Accepter
                    </button>
                    <button
                      onClick={() => changerStatut(item.id, 'REFUSE')}
                      style={{ backgroundColor: '#dc2626', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '0.25rem', cursor: 'pointer' }}
                    >
                      Refuser
                    </button>
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