// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const routesPubliques = [
  '/api/auth/login',
  '/api/auth/register',
]

const secret = new TextEncoder().encode(process.env.JWT_SECRET)

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (routesPubliques.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json(
      { message: 'Accès refusé — Connexion requise' },
      { status: 401 }
    )
  }

  try {
    const { payload } = await jwtVerify(token, secret)

    const response = NextResponse.next()
    response.headers.set('x-user-id', String(payload.userId))
    response.headers.set('x-user-role', String(payload.role))
    return response

  } catch {
    return NextResponse.json(
      { message: 'Token invalide ou expiré' },
      { status: 401 }
    )
  }
}

export const config = {
  matcher: [
    '/api/:path*',
  ]
}