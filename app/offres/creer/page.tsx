'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function CreerOffrePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    titre: '',
    entreprise: '',
    description: '',
    localisation: '',
    duree: '',
    tags: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/offres', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la création de l'offre");
      }

      router.push('/offres');
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Une erreur s'est produite.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Créer une nouvelle offre</h1>
      
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-gray-900 p-6 rounded-xl border border-gray-800">
        <div>
          <label className="block text-sm text-gray-300 mb-1">{"Titre de l'offre"}</label>
          <input 
            type="text" 
            required
            className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
            value={formData.titre}
            onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">{"Nom de l'entreprise"}</label>
          <input 
            type="text" 
            required
            className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
            value={formData.entreprise}
            onChange={(e) => setFormData({ ...formData, entreprise: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">Localisation</label>
          <input 
            type="text" 
            required
            className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
            value={formData.localisation}
            onChange={(e) => setFormData({ ...formData, localisation: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">Durée</label>
          <input 
            type="text" 
            placeholder="ex: 3 mois"
            required
            className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
            value={formData.duree}
            onChange={(e) => setFormData({ ...formData, duree: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">Mots-clés / Tags (optionnel)</label>
          <input 
            type="text" 
            placeholder="ex: React, Next.js, Stage"
            className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">Description</label>
          <textarea 
            rows={4}
            required
            className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg mt-2 transition disabled:opacity-50"
        >
          {loading ? 'Enregistrement en cours...' : "Enregistrer l'offre"}
        </button>
      </form>
    </div>
  );
}