// app/api/journal/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifierToken } from "@/lib/auth";
import { notifierUtilisateur } from "@/lib/notifications";

const prisma = new PrismaClient();

function getUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];
  if (!token) return null;
  return verifierToken(token);
}

export async function POST(req: NextRequest) {
  try {
    const user = getUser(req);
    if (!user || user.role !== "ETUDIANT") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await req.json();
    const { stageId, semaine, contenu, alerte } = body;

    if (!stageId || !semaine || !contenu) {
      return NextResponse.json(
        { error: "Champs requis: stageId, semaine, contenu" },
        { status: 400 }
      );
    }

    const stage = await prisma.stage.findFirst({
      where: { id: Number(stageId), etudiantId: user.userId },
      include: { candidature: { include: { offre: true } } },
    });
    if (!stage) {
      return NextResponse.json({ error: "Stage introuvable" }, { status: 404 });
    }

    const existant = await prisma.journalBord.findFirst({
      where: { stageId: Number(stageId), semaine: Number(semaine) },
    });

    const journal = existant
      ? await prisma.journalBord.update({
          where: { id: existant.id },
          data: { contenu, statut: "EN_ATTENTE", dateDepot: new Date(), alerte: Boolean(alerte) },
        })
      : await prisma.journalBord.create({
          data: {
            stageId: Number(stageId),
            semaine: Number(semaine),
            contenu,
            statut: "EN_ATTENTE",
            dateDepot: new Date(),
            alerte: Boolean(alerte),
          },
        });

    const studentUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { nom: true, prenom: true },
    });
    const studentName = studentUser
      ? `${studentUser.prenom} ${studentUser.nom}`
      : "Un étudiant";

    const entrepriseId = stage.candidature?.offre?.entrepriseId;
    if (entrepriseId) {
      await notifierUtilisateur(
        entrepriseId,
        `${studentName} a soumis son rapport de stage de la semaine ${semaine}. En attente de votre validation.`,
        "RAPPORT_SOUMIS"
      );
    }

    if (stage.encadreurId && stage.encadreurId !== user.userId) {
      await notifierUtilisateur(
        stage.encadreurId,
        `${studentName} a déposé son rapport de stage de la semaine ${semaine}.`,
        "RAPPORT_DEPOSE"
      );
    }

    return NextResponse.json(journal, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

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