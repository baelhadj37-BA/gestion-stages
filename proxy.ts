import { NextRequest, NextResponse } from 'next/server';

const routesPubliques = ['/login', '/api/auth/login', '/'];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    routesPubliques.includes(pathname) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/pdf') ||
    pathname.startsWith('/verify') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token =
    req.cookies.get('token')?.value ||
    req.headers.get('authorization')?.split(' ')[1];

  if (!token) return NextResponse.redirect(new URL('/login', req.url));

  const parts = token.split('.');
  if (parts.length !== 3) return NextResponse.redirect(new URL('/login', req.url));

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};