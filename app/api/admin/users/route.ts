import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifierToken } from "@/lib/auth";

function getUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];
  if (!token) return null;
  return verifierToken(token);
}

export async function GET(req: NextRequest) {
  try {
    const user = getUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      users: users.map((u) => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Erreur GET /api/admin/users:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
