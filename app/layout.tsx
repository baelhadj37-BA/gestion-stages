import Link from 'next/link';

export const metadata = {
  title: 'GestionStage - Plateforme de Stages',
  description: 'Gestion des offres et candidatures de stage',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#f8fafc', color: '#0f172a' }}>
        {/* Navigation / Header */}
        <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 50 }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link href="/" style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#2563eb', textDecoration: 'none' }}>
              🎓 Gestion des Stages
            </Link>

            <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              <Link href="/dashboard" style={{ color: '#475569', textDecoration: 'none', fontWeight: '500', fontSize: '0.95rem' }}>
                Dashboard
              </Link>
              <Link href="/offres" style={{ color: '#475569', textDecoration: 'none', fontWeight: '500', fontSize: '0.95rem' }}>
                Offres
              </Link>
              <Link href="/candidatures" style={{ color: '#475569', textDecoration: 'none', fontWeight: '500', fontSize: '0.95rem' }}>
                Mes Candidatures
              </Link>
            </nav>
          </div>
        </header>

        {/* Contenu principal */}
        <main>{children}</main>
      </body>
    </html>
  );
}