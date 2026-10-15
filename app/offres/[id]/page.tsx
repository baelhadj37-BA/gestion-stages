'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Offre {
  id: number;
  titre: string;
  description: string;
  duree: string;
  localisation: string;
  tags: string | null;
  statut: string;
  createdAt: string;
  entreprise: {
    nom: string;
    prenom: string;
    secteur: string | null;
    telephone: string | null;
    email: string;
  };
}

export default function OffreDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [offre, setOffre] = useState<Offre | null>(null);
  const [loading, setLoading] = useState(true);
  const [postule, setPostule] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch(`/api/offres/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        setOffre(d.offre);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  const handlePostuler = async () => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    setPostule(true);
    const res = await fetch('/api/candidatures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ offreId: offre?.id }),
    });
    const data = await res.json();
    if (res.ok) setMsg('✅ Candidature envoyée avec succès !');
    else setMsg(`❌ ${data.message || 'Erreur'}`);
    setPostule(false);
  };

  if (loading) return <div className="text-center text-gray-400 py-20">Chargement...</div>;
  if (!offre) return <div className="text-center text-gray-400 py-20">Offre introuvable.</div>;

  const tags = offre.tags ? offre.tags.split(',').map((t) => t.trim()) : [];

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Link
        href="/offres"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition"
      >
        ← Retour aux offres
      </Link>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-7">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-bold text-white capitalize">{offre.titre}</h1>
          <span className={`text-xs px-3 py-1 rounded-full border font-medium ${
            offre.statut === 'PUBLIEE'
              ? 'bg-green-950/60 text-green-400 border-green-800'
              : offre.statut === 'FERMEE'
              ? 'bg-red-950/60 text-red-400 border-red-800'
              : 'bg-yellow-950/60 text-yellow-400 border-yellow-800'
          }`}>
            {offre.statut === 'PUBLIEE' ? 'Ouverte' : offre.statut === 'FERMEE' ? 'Fermée' : 'En attente'}
          </span>
        </div>

        <p className="text-blue-400 font-medium mb-5">
          🏢 {offre.entreprise.nom} {offre.entreprise.prenom}
          {offre.entreprise.secteur && (
            <span className="text-gray-400 font-normal"> — {offre.entreprise.secteur}</span>
          )}
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <div>
            <p className="text-xs text-gray-500 mb-1">Localisation</p>
            <p className="text-white text-sm">📍 {offre.localisation}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Durée</p>
            <p className="text-white text-sm">⏱️ {offre.duree}</p>
          </div>
          {offre.entreprise.email && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Email</p>
              <p className="text-white text-sm">{offre.entreprise.email}</p>
            </div>
          )}
          {offre.entreprise.telephone && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Téléphone</p>
              <p className="text-white text-sm">{offre.entreprise.telephone}</p>
            </div>
          )}
        </div>

        <div className="mb-6">
          <h2 className="text-white font-semibold mb-2">Description</h2>
          <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">{offre.description}</p>
        </div>

        {tags.length > 0 && (
          <div className="mb-6">
            <h2 className="text-white font-semibold mb-2">Compétences requises</h2>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="bg-blue-950/60 text-blue-400 text-xs px-3 py-1 rounded-full border border-blue-800">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {msg && <p className="text-sm mb-4">{msg}</p>}

        {offre.statut === 'PUBLIEE' && !msg && (
          <div className="pt-4 border-t border-gray-800">
            <button
              onClick={handlePostuler}
              disabled={postule}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium px-5 py-2.5 rounded-lg transition"
            >
              {postule ? 'Envoi...' : 'Postuler'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}