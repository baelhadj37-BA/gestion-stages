import './globals.css';
import Link from 'next/link';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <nav className="bg-white border-b border-gray-200 px-8 py-4 shadow-sm">
          <div className="max-w-5xl mx-auto flex justify-between items-center">
            <span className="font-bold text-xl text-blue-600">GestionStage</span>
            <div className="space-x-6 text-sm font-medium text-gray-600">
              <Link href="/dashboard" className="hover:text-blue-600 transition">
                Dashboard
              </Link>
              <Link href="/offres" className="hover:text-blue-600 transition">
                Offres
              </Link>
              <Link href="/candidatures" className="hover:text-blue-600 transition">
                Candidatures
              </Link>
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}