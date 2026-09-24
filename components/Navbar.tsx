import Link from 'next/link';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
      <div className="flex items-center space-x-6">
        <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 font-medium">
          Dashboard
        </Link>
        <Link href="/offres" className="text-gray-700 hover:text-blue-600 font-medium">
          Offres
        </Link>
        <Link href="/candidatures" className="text-gray-700 hover:text-blue-600 font-medium">
          Mes Candidatures
        </Link>
        <Link href="/journal" className="text-gray-700 hover:text-blue-600 font-medium">
          Journal de bord
        </Link>
        <Link href="/convention" className="text-gray-700 hover:text-blue-600 font-medium">
          Convention
        </Link>
      </div>

      <div className="flex items-center space-x-4">
        {/* Correction ici : {1} au lieu de "1" */}
        <NotificationBell userId={1} />
      </div>
    </nav>
  );
}