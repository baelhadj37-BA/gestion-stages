'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

export default function BoutonPostuler({
  offreId,
  titreOffre,
}: {
  offreId: string;
  titreOffre: string;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePostuler = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/candidatures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offreId }),
      });

      if (!res.ok) throw new Error('Erreur lors de la candidature');

      toast.success(`Candidature envoyée pour "${titreOffre}" !`);
    } catch (err) {
      toast.error('Impossible de postuler pour le moment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <button
      onClick={handlePostuler}
      disabled={isSubmitting}
      style={{
        backgroundColor: isSubmitting ? '#93c5fd' : '#2563eb',
        color: '#ffffff',
        padding: '0.5rem 1rem',
        borderRadius: '0.375rem',
        border: 'none',
        cursor: isSubmitting ? 'not-allowed' : 'pointer',
        fontWeight: '500',
        fontSize: '0.875rem',
        transition: 'background-color 0.2s',
      }}
    >
      {isSubmitting ? 'Envoi...' : 'Postuler'}
    </button>
  );
}