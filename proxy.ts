// proxy.ts
// Protection des routes API et contrôle d'accès JWT — Next.js 16

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

// Routes publiques ne nécessitant pas d'authentification
const routesPubliquesExactes = ["/", "/api"];
const routesPubliquesPrefixes = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/verify",
  "/verify",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Laisser passer la racine et les routes publiques
  if (
    routesPubliquesExactes.includes(pathname) ||
    routesPubliquesPrefixes.some(
      (route) => pathname === route || pathname.startsWith(route + "/")
    )
  ) {
    return NextResponse.next();
  }

  // 2. Récupérer le token depuis l'en-tête Authorization ou le cookie
  const authHeader = request.headers.get("authorization");
  const token =
    authHeader?.replace("Bearer ", "") ||
    request.cookies.get("auth_token")?.value;

  // 3. Vérification des routes API protégées
  if (pathname.startsWith("/api/")) {
    if (!token) {
      return NextResponse.json(
        { message: "Accès refusé — Connexion requise" },
        { status: 401 }
      );
    }

    try {
      const tokenValide = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as {
        userId: number;
        role: string;
      };

      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-user-id", tokenValide.userId.toString());
      requestHeaders.set("x-user-role", tokenValide.role);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch {
      return NextResponse.json(
        { message: "Token invalide ou expiré" },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    "/api/:path*",
    "/verify/:path*",
  ],
};