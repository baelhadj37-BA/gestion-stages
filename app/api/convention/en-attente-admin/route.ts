import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifierToken } from "@/lib/auth";

const prisma = new PrismaClient();

function getUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];
  if (!token) return null;
  return verifierToken(token);
}

export async function GET(req: NextRequest) {
  const user = getUser(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const conventions = await prisma.convention.findMany({
    where: { statut: "ETAPE_ENTREPRISE" },
    include: {
      stage: {
        include: {
          etudiant: { select: { nom: true, prenom: true } },
          candidature: { include: { offre: { include: { entreprise: { select: { nom: true } } } } } },
        },
      },
    },
  });

  return NextResponse.json(conventions);
}