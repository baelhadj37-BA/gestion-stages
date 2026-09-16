import Link from 'next/link';

export default function HomePage() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem', textAlign: 'center' }}>
      {/* Section Hero */}
      <div style={{ maxWidth: '800px', margin: '0 auto 3rem auto' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: '800', lineHeight: '1.2', color: '#0f172a', marginBottom: '1.5rem' }}>
          Trouvez et gérez vos <span style={{ color: '#2563eb' }}>stages d'exception</span>
        </h1>
        <p style={{ fontSize: '1.25rem', color: '#64748b', lineHeight: '1.6', marginBottom: '2.5rem' }}>
          La plateforme moderne simplifiant la mise en relation entre étudiants et entreprises pour le suivi de candidatures et d'offres de stage.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link
            href="/offres"
            style={{ backgroundColor: '#2563eb', color: '#ffffff', padding: '0.875rem 1.75rem', borderRadius: '0.5rem', fontWeight: '600', textDecoration: 'none', fontSize: '1rem', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)' }}
          >
            Découvrir les offres
          </Link>
          <Link
            href="/dashboard"
            style={{ backgroundColor: '#ffffff', color: '#334155', padding: '0.875rem 1.75rem', borderRadius: '0.5rem', fontWeight: '600', textDecoration: 'none', fontSize: '1rem', border: '1px solid #cbd5e1' }}
          >
            Voir le Dashboard
          </Link>
        </div>
      </div>

      {/* Cartes de fonctionnalités */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '4rem', textAlign: 'left' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔍</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>Recherche rapide</h3>
          <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.5' }}>
            Filtrez les offres par mot-clé et localisation pour dénicher le stage parfait.
          </p>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📋</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>Suivi en temps réel</h3>
          <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.5' }}>
            Consultez à tout moment l'avancement de vos candidatures (En attente, Accepté, Refusé).
          </p>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📊</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>Espace Dashboard</h3>
          <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.5' }}>
            Obtenez une vue synthétique sur les statistiques globales et les dernières opportunités.
          </p>
        </div>
      </div>
    </div>
  );
}