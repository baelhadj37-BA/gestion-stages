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
  if (!user || user.role !== "ENTREPRISE") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const journaux = await prisma.journalBord.findMany({
    where: {
      statut: "SOUMIS",
      stage: { candidature: { offre: { entrepriseId: user.userId } } },
    },
    include: {
      stage: { include: { etudiant: { select: { nom: true, prenom: true } } } },
    },
    orderBy: { dateDepot: "asc" },
  });

  return NextResponse.json(journaux);
}