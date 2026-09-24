'use client';

import { useState, useEffect } from 'react';

interface Convention {
  id: number;
  statut: string;
  pdfUrl?: string;
  motifRejet?: string;
  stage: {
    id: number;
    etudiant: { nom: string; email: string };
    candidature: { offre: { titre: string; entreprise: string } };
  };
}

export default function AdminConventionPage() {
  const [conventions, setConventions] = useState<Convention[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [motifRejet, setMotifRejet] = useState<string>('');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    fetchConventions();
  }, []);

  const fetchConventions = async () => {
    try {
      const res = await fetch('/api/convention');
      const data = await res.json();
      if (Array.isArray(data)) setConventions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatut = async (id: number, nouveauStatut: string, rejectionReason?: string) => {
    try {
      const res = await fetch(`/api/convention/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statut: nouveauStatut,
          motifRejet: rejectionReason || null,
        }),
      });

      if (res.ok) {
        setSelectedId(null);
        setMotifRejet('');
        fetchConventions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '0 1rem', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1e293b' }}>
        🛠️ Administration - Gestion des Conventions
      </h1>

      {loading ? (
        <p>Chargement des demandes...</p>
      ) : conventions.length === 0 ? (
        <p style={{ color: '#64748b' }}>Aucune convention à traiter.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {conventions.map((c) => (
            <div key={c.id} style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0 }}>
                    Étudiant : {c.stage?.etudiant?.nom || 'Inconnu'} ({c.stage?.etudiant?.email})
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0.25rem 0' }}>
                    Sujet : <strong>{c.stage?.candidature?.offre?.titre}</strong> chez <strong>{c.stage?.candidature?.offre?.entreprise}</strong>
                  </p>
                </div>
                <span style={{ fontSize: '0.85rem', padding: '0.25rem 0.6rem', borderRadius: '0.25rem', backgroundColor: '#e2e8f0', fontWeight: 'bold' }}>
                  Statut : {c.statut}
                </span>
              </div>

              {selectedId === c.id ? (
                <div style={{ marginTop: '1rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.375rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                    Motif du rejet :
                  </label>
                  <input
                    type="text"
                    value={motifRejet}
                    onChange={(e) => setMotifRejet(e.target.value)}
                    placeholder="Précisez la raison du rejet..."
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #cbd5e1', marginBottom: '0.75rem' }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleUpdateStatut(c.id, 'REJETEE', motifRejet)}
                      style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '0.25rem', cursor: 'pointer' }}
                    >
                      Confirmer le rejet
                    </button>
                    <button
                      onClick={() => setSelectedId(null)}
                      style={{ backgroundColor: '#64748b', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '0.25rem', cursor: 'pointer' }}
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button
                    onClick={() => handleUpdateStatut(c.id, 'ETAPE_ENTREPRISE')}
                    style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.375rem', cursor: 'pointer' }}
                  >
                    Transmettre à l'entreprise
                  </button>
                  <button
                    onClick={() => handleUpdateStatut(c.id, 'VALIDEE')}
                    style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.375rem', cursor: 'pointer' }}
                  >
                    Valider définitivement
                  </button>
                  <button
                    onClick={() => setSelectedId(c.id)}
                    style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.375rem', cursor: 'pointer' }}
                  >
                    Rejeter
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}