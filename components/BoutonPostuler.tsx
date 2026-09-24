'use client';

import { useState, ChangeEvent, useRef } from 'react';
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l\'envoi de la candidature');
      }

      toast.success(`Candidature envoyée pour "${titreOffre}" !`);
      
      // Réinitialiser le fichier dans le state et dans l'élément HTML
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      toast.error(err.message || 'Impossible de postuler pour le moment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <input
        ref={fileInputRef}
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