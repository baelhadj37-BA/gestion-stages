// proxy.ts
// Ce fichier protège les routes qui nécessitent une connexion
// Il s'exécute AVANT chaque requête vers une route protégée

import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

// Liste des routes publiques — pas besoin de connexion
const routesPubliques = [
  '/api/auth/login',
  '/api/auth/register',
  '/',
  '/login',
  '/register',
]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Si la route est publique → laisser passer
  if (routesPubliques.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // 2. Récupérer le token depuis les headers
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  // 3. Si pas de token → accès refusé
  if (!token) {
    return NextResponse.json(
      { message: 'Accès refusé — Connexion requise' },
      { status: 401 }
    )
  }

  // 4. Vérifier le token
  try {
    const tokenValide = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: number
      role: string
    }

    // 5. Token valide → ajouter les infos dans les headers
    const response = NextResponse.next()
    response.headers.set('x-user-id', tokenValide.userId.toString())
    response.headers.set('x-user-role', tokenValide.role)
    return response

  } catch {
    // 6. Token invalide ou expiré
    return NextResponse.json(
      { message: 'Token invalide ou expiré' },
      { status: 401 }
    )
  }
}

// Routes sur lesquelles le middleware s'applique
export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*'
  ]
}