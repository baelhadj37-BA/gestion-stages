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
      statut: { in: ["SOUMIS", "EN_ATTENTE"] },
      contenu: { not: "" },
      stage: { candidature: { offre: { entrepriseId: user.userId } } },
    },
    include: {
      stage: {
        include: {
          etudiant: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true,
              matricule: true,
              classe: true,
            },
          },
          candidature: {
            include: {
              offre: {
                select: {
                  id: true,
                  titre: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { dateDepot: "desc" },
  });

  const parsedJournaux = journaux.map((j) => {
    let activites = j.contenu;
    let heures = 35;
    let date = j.dateDepot ? j.dateDepot.toISOString().split("T")[0] : "";
    let observations = "";

    try {
      if (j.contenu.startsWith("{")) {
        const parsed = JSON.parse(j.contenu);
        activites = parsed.activites ?? j.contenu;
        heures = parsed.heures ?? 35;
        date = parsed.date ?? date;
        observations = parsed.observations ?? "";
      }
    } catch {
      // Si format texte simple
    }

    return {
      id: j.id,
      stageId: j.stageId,
      semaine: j.semaine,
      contenu: j.contenu,
      activites,
      heures,
      date,
      observations,
      statut: j.statut,
      commentaire: j.commentaire,
      dateDepot: j.dateDepot,
      stage: j.stage,
    };
  });

  return NextResponse.json(parsedJournaux);
}