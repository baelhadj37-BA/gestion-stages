'use client';

import { useState, useEffect } from 'react';

interface Convention {
  id: number;
  statut: string;
  pdfUrl?: string;
  motifRejet?: string;
  dateValidation?: string;
  stage: {
    id: number;
    etudiant: { nom: string; email: string };
    candidature: { offre: { titre: string; entreprise: string } };
  };
}

export default function ConventionPage() {
  const [conventions, setConventions] = useState<Convention[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'ETAPE_ETUDIANT':
        return { label: 'Signature Étudiant', color: '#3b82f6', bg: '#eff6ff' };
      case 'ETAPE_ENTREPRISE':
        return { label: 'Validation Entreprise', color: '#f59e0b', bg: '#fffbe3' };
      case 'ETAPE_ADMIN':
        return { label: 'Validation Administration', color: '#8b5cf6', bg: '#f5f3ff' };
      case 'VALIDEE':
        return { label: 'Validée / Signée', color: '#16a34a', bg: '#f0fdf4' };
      case 'REJETEE':
        return { label: 'Rejetée', color: '#dc2626', bg: '#fef2f2' };
      default:
        return { label: statut, color: '#64748b', bg: '#f1f5f9' };
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '0 1rem', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1e293b' }}>
        📄 Suivi de la Convention de Stage
      </h1>

      {loading ? (
        <p>Chargement des conventions...</p>
      ) : conventions.length === 0 ? (
        <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <p style={{ color: '#64748b' }}>Aucune convention générée pour le moment.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {conventions.map((c) => {
            const badge = getStatutBadge(c.statut);
            return (
              <div key={c.id} style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0 }}>
                      {c.stage?.candidature?.offre?.titre || 'Convention de Stage'}
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
                      Entreprise : <strong>{c.stage?.candidature?.offre?.entreprise || 'N/A'}</strong>
                    </p>
                  </div>
                  <span style={{
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '0.375rem',
                    backgroundColor: badge.bg,
                    color: badge.color,
                  }}>
                    {badge.label}
                  </span>
                </div>

                {c.motifRejet && (
                  <div style={{ backgroundColor: '#fef2f2', borderLeft: '4px solid #dc2626', padding: '0.75rem', marginBottom: '0.75rem', fontSize: '0.875rem', color: '#991b1b' }}>
                    <strong>Motif du rejet :</strong> {c.motifRejet}
                  </div>
                )}

                {c.pdfUrl && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <a
                      href={c.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#2563eb', textDecoration: 'underline', fontWeight: '500', fontSize: '0.9rem' }}
                    >
                      📥 Télécharger / Consulter la convention (PDF)
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}