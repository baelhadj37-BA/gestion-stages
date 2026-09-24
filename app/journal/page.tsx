'use client';

import { useState, useEffect } from 'react';

interface Journal {
  id: string;
  semaine: number;
  activites: string;
  statut: string;
  commentaire?: string;
  createdAt: string;
}

export default function JournalPage() {
  const [journaux, setJournaux] = useState<Journal[]>([]);
  const [semaine, setSemaine] = useState<number>(1);
  const [activites, setActivites] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activites.trim()) {
      setMessage({ type: 'error', text: 'Veuillez décrire vos activités.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ semaine, activites }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Rapport soumis avec succès !' });
        setActivites('');
        setSemaine((prev) => prev + 1);
        fetchJournaux();
      } else {
        setMessage({ type: 'error', text: 'Erreur lors de la soumission du rapport.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur réseau ou serveur.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1e293b' }}>
        📔 Journal de Bord
      </h1>

      {message && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '0.375rem',
          marginBottom: '1rem',
          backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: message.type === 'success' ? '#166534' : '#991b1b',
        }}>
          {message.text}
        </div>
      )}

      <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Rédiger un rapport hebdomadaire</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>Semaine n°</label>
            <input
              type="number"
              min="1"
              value={semaine}
              onChange={(e) => setSemaine(Number(e.target.value))}
              style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', width: '100px' }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>Activités & Tâches effectuées</label>
            <textarea
              rows={4}
              value={activites}
              onChange={(e) => setActivites(e.target.value)}
              placeholder="Ex: Mise en place de l'authentification, rédaction de la documentation..."
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontFamily: 'inherit' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              padding: '0.625rem 1.25rem',
              borderRadius: '0.375rem',
              border: 'none',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Envoi...' : 'Soumettre le rapport'}
          </button>
        </form>
      </div>

      <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Historique des soumisons</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {journaux.length === 0 ? (
          <p style={{ color: '#64748b' }}>Aucun rapport soumis pour le moment.</p>
        ) : (
          journaux.map((j) => (
            <div key={j.id} style={{ backgroundColor: '#ffffff', padding: '1rem 1.25rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 'bold' }}>Semaine {j.semaine}</span>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  backgroundColor: j.statut === 'VALIDE' ? '#dcfce7' : '#fef3c7',
                  color: j.statut === 'VALIDE' ? '#15803d' : '#b45309'
                }}>
                  {j.statut}
                </span>
              </div>
              <p style={{ color: '#334155', margin: '0.5rem 0', whiteSpace: 'pre-line' }}>{j.activites}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}