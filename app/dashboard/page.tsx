'use client';

import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
        Tableau de bord
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
        Bienvenue sur votre espace de gestion des stages.
      </p>

      {/* Cartes de raccourcis */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
        <div style={{ padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', backgroundColor: '#ffffff' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>Offres disponibles</h3>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
            Consultez les dernières offres de stage et postulez.
          </p>
          <Link
            href="/offres"
            style={{ color: '#2563eb', fontWeight: '500', textDecoration: 'none', fontSize: '0.875rem' }}
          >
            Voir les offres →
          </Link>
        </div>

        <div style={{ padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', backgroundColor: '#ffffff' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>Mes candidatures</h3>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
            Suivez l'état d'avancement de vos demandes.
          </p>
          <Link
            href="/candidatures"
            style={{ color: '#2563eb', fontWeight: '500', textDecoration: 'none', fontSize: '0.875rem' }}
          >
            Voir mes candidatures →
          </Link>
        </div>
      </div>
    </div>
  );
}