'use client';

import { useState, useEffect } from 'react';

interface Journal {
  id: string;
  semaine: number;
  activites: string;
  statut: string;
  commentaire?: string;
  user: {
    nom: string;
    email: string;
  };
}

export default function AdminJournalPage() {
  const [journaux, setJournaux] = useState<Journal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchJournaux();
  }, []);

  const fetchJournaux = async () => {
    try {
      const res = await fetch('/api/journal');
      const data = await res.json();
      if (Array.isArray(data)) setJournaux(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, statut: string, commentaire: string) => {
    try {
      const res = await fetch(`/api/journal/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut, commentaire }),
      });

      if (res.ok) {
        fetchJournaux();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '0 1rem', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1e293b' }}>
        📋 Validation des Journals de Bord
      </h1>

      {loading ? (
        <p>Chargement des rapports...</p>
      ) : journaux.length === 0 ? (
        <p style={{ color: '#64748b' }}>Aucun rapport soumis pour le moment.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {journaux.map((j) => (
            <div key={j.id} style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div>
                  <strong style={{ fontSize: '1.1rem' }}>{j.user?.nom || 'Étudiant'}</strong>
                  <span style={{ color: '#64748b', fontSize: '0.875rem', marginLeft: '0.5rem' }}>({j.user?.email})</span>
                </div>
                <span style={{ fontWeight: 'bold', color: '#2563eb' }}>Semaine {j.semaine}</span>
              </div>

              <p style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '0.375rem', margin: '0.75rem 0', whiteSpace: 'pre-line' }}>
                {j.activites}
              </p>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                  onClick={() => handleUpdateStatus(j.id, 'VALIDE', 'Rapport validé.')}
                  style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.375rem', cursor: 'pointer' }}
                >
                  Valider
                </button>
                <button
                  onClick={() => handleUpdateStatus(j.id, 'A_CORRIGER', 'Veuillez détailler vos activités.')}
                  style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.375rem', cursor: 'pointer' }}
                >
                  Demander correction
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}