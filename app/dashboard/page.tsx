'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Offre {
  id: string;
  titre: string;
  entreprise: string;
  localisation: string;
  duree: string;
}

export default function DashboardPage() {
  const [offres, setOffres] = useState<Offre[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isSubscribed = true;

    const fetchOffres = async () => {
      try {
        const res = await fetch('/api/offres');
        const data = await res.json();
        if (isSubscribed && Array.isArray(data)) {
          setOffres(data.slice(0, 5)); // Récupère les 5 dernières offres
        }
      } catch (err) {
        console.error('Erreur lors du chargement des offres:', err);
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    fetchOffres();

    return () => {
      isSubscribed = false;
    };
  }, []);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      {/* En-tête */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>Tableau de Bord</h1>
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Vue d'ensemble de la plateforme de gestion de stages</p>
      </div>

      {/* Cartes de statistiques */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div style={{ padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', backgroundColor: '#ffffff', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>Offres de Stage</p>
          <p style={{ fontSize: '2.25rem', fontWeight: 'bold', marginTop: '0.5rem', color: '#111827' }}>{offres.length}</p>
        </div>

        <div style={{ padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', backgroundColor: '#ffffff', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>Candidatures Soumises</p>
          <p style={{ fontSize: '2.25rem', fontWeight: 'bold', marginTop: '0.5rem', color: '#111827' }}>0</p>
        </div>

        <div style={{ padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', backgroundColor: '#ffffff', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>Utilisateurs Inscrits</p>
          <p style={{ fontSize: '2.25rem', fontWeight: 'bold', marginTop: '0.5rem', color: '#111827' }}>1</p>
        </div>
      </div>

      {/* Section Dernières Offres en Tableau */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Dernières Offres Publiées</h2>
          <Link href="/offres" style={{ color: '#2563eb', fontSize: '0.875rem', fontWeight: '500', textDecoration: 'none' }}>
            Voir tout &rarr;
          </Link>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#6b7280', padding: '1rem' }}>Chargement...</p>
        ) : offres.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#6b7280', padding: '1rem' }}>Aucune offre disponible.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Titre du poste</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Entreprise</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Localisation</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Durée</th>
                </tr>
              </thead>
              <tbody>
                {offres.map((offre) => (
                  <tr key={offre.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: '#111827' }}>{offre.titre}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{offre.entreprise}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>📍 {offre.localisation}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>⏱️ {offre.duree}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}