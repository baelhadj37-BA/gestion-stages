import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifierToken } from "@/lib/auth";

const prisma = new PrismaClient();

function getUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization"); // "Bearer xxx"
  const token = authHeader?.split(" ")[1];
  if (!token) return null;
  return verifierToken(token); // { userId, role } | null
}

// POST /api/journal — l'étudiant soumet son rapport de la semaine
export async function POST(req: NextRequest) {
  try {
    const user = getUser(req);
    if (!user || user.role !== "ETUDIANT") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await req.json();
    const { stageId, semaine, contenu } = body;

    if (!stageId || !semaine || !contenu) {
      return NextResponse.json(
        { error: "Champs requis: stageId, semaine, contenu" },
        { status: 400 }
      );
    }

    const stage = await prisma.stage.findFirst({
      where: { id: Number(stageId), etudiantId: user.userId },
    });
    if (!stage) {
      return NextResponse.json({ error: "Stage introuvable" }, { status: 404 });
    }

    // Cherche un journal existant pour cette semaine, sinon le crée
    const existant = await prisma.journalBord.findFirst({
      where: { stageId: Number(stageId), semaine: Number(semaine) },
    });

    const journal = existant
      ? await prisma.journalBord.update({
          where: { id: existant.id },
          data: { contenu, statut: "SOUMIS", dateDepot: new Date(), alerte: false },
        })
      : await prisma.journalBord.create({
          data: {
            stageId: Number(stageId),
            semaine: Number(semaine),
            contenu,
            statut: "SOUMIS",
            dateDepot: new Date(),
          },
        });

    return NextResponse.json(journal, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// GET /api/journal?stageId=... — historique des rapports d'un stage
export async function GET(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const stageId = req.nextUrl.searchParams.get("stageId");
  if (!stageId) {
    return NextResponse.json({ error: "stageId requis" }, { status: 400 });
  }

  const journaux = await prisma.journalBord.findMany({
    where: { stageId: Number(stageId) },
    orderBy: { semaine: "asc" },
  });

  return NextResponse.json(journaux);
}