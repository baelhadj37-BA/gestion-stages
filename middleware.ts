import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const routesPubliques = ['/login', '/api/auth/login', '/'];

// Next.js 16 accepte la fonction par défaut ou nommée 'proxy' / 'middleware'
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    routesPubliques.includes(pathname) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/pdf') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get('token')?.value || req.headers.get('authorization')?.split(' ')[1];

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    const secret = process.env.JWT_SECRET || 'secret_par_defaut_ipd';
    jwt.verify(token, secret);
    return NextResponse.next();
  } catch (error) {
    console.error('Erreur de validation du token JWT:', error);
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};