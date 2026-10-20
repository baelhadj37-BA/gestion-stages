'use client';

import { useState } from 'react';

interface BoutonPostulerProps {
  offreId: string;
}

export default function BoutonPostuler({ offreId }: BoutonPostulerProps) {
  const [loading, setLoading] = useState(false);
  const [postule, setPostule] = useState(false);

  const handlePostuler = async () => {
    setLoading(true);

    try {
      const res = await fetch('/api/candidatures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ offreId }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Erreur lors de la candidature.');
        return;
      }

      setPostule(true);
      alert('Candidature envoyée avec succès !');
    } catch {
      alert("Une erreur s'est produite lors de la candidature.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePostuler}
      disabled={loading || postule}
      className={`text-xs font-medium px-3.5 py-2 rounded-lg transition border ${
        postule
          ? 'bg-green-900/50 text-green-300 border-green-700 cursor-not-allowed'
          : 'bg-gray-800 hover:bg-blue-600 text-white border-gray-700 hover:border-blue-500 disabled:opacity-50'
      }`}
    >
      {loading ? 'Envoi...' : postule ? 'Postulé ✓' : 'Postuler'}
    </button>
  );
}