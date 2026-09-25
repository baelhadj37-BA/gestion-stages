import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Tableau de bord
        </h1>
        <p style={{ color: '#6b7280', fontSize: '1rem' }}>
          Bienvenue sur votre espace de gestion des stages.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* Carte 1 : Offres disponibles */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            Offres disponibles
          </h2>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Consultez les dernières offres de stage et postulez.
          </p>
          <Link 
            href="/offres" 
            style={{ color: '#2563eb', fontWeight: '500', textDecoration: 'none' }}
          >
            Voir les offres →
          </Link>
        </div>

        {/* Carte 2 : Mes candidatures */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            Mes candidatures
          </h2>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Suivez l'état d'avancement de vos demandes.
          </p>
          <Link 
            href="/candidatures" 
            style={{ color: '#2563eb', fontWeight: '500', textDecoration: 'none' }}
          >
            Voir mes candidatures →
          </Link>
        </div>

       
        </div>

        
         
    

      </div>
    
  );
}