export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 w-full max-w-md space-y-6">
        <div className="text-center">
          <span className="px-3 py-1 bg-pink-50 text-pink-600 text-xs font-semibold rounded-full border border-pink-100">
            IPD - Authentification
          </span>
          <h1 className="text-xl font-bold text-gray-900 mt-2">Connexion à la Plateforme</h1>
          <p className="text-sm text-gray-500">Espace réservé au suivi des stages</p>
        </div>

        <form className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Email institutionnel</label>
            <input 
              type="email" 
              placeholder="khady.tall@ipd.sn" 
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-600/20 focus:border-pink-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Mot de passe</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-600/20 focus:border-pink-600"
            />
          </div>
          <button 
            type="submit" 
            className="w-full py-3 bg-pink-600 text-white font-semibold rounded-xl hover:bg-pink-700 transition shadow-md shadow-pink-600/20 text-sm"
          >
            Se connecter
          </button>
        </form>
      </div>
    </main>
  );
}