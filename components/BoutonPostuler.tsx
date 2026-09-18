'use client';

import { useState, ChangeEvent } from 'react';
import toast from 'react-hot-toast';

export default function BoutonPostuler({
  offreId,
  titreOffre,
}: {
  offreId: string;
  titreOffre: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePostuler = async () => {
    if (!file) {
      toast.error('Veuillez sélectionner un CV au format PDF ou DOCX.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('offreId', offreId);
      formData.append('file', file);

      const res = await fetch('/api/candidatures', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Erreur réseau');

      toast.success(`Candidature envoyée pour "${titreOffre}" !`);
      setFile(null);
    } catch (err) {
      toast.error('Impossible de postuler pour le moment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <input
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          setFile(e.target.files?.[0] || null)
        }
        style={{ fontSize: '0.8rem' }}
      />
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
        }}
      >
        {isSubmitting ? 'Envoi...' : 'Postuler'}
      </button>
    </div>
  );
}