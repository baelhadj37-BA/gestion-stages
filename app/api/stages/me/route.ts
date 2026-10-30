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
  if (!user || user.role !== "ETUDIANT") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  let stage = await prisma.stage.findFirst({
    where: { etudiantId: user.userId },
    include: {
      encadreur: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
        },
      },
      candidature: {
        include: {
          offre: {
            include: {
              entreprise: {
                select: {
                  id: true,
                  nom: true,
                  prenom: true,
                  email: true,
                  secteur: true,
                },
              },
            },
          },
        },
      },
      convention: true,
      evaluation: true,
    },
    orderBy: { dateDebut: "desc" },
  });

  // Si aucun stage direct n'est trouvé, vérifier s'il existe une candidature acceptée
  if (!stage) {
    const candidatureAcceptee = await prisma.candidature.findFirst({
      where: { etudiantId: user.userId, statut: "ACCEPTEE" },
      include: {
        offre: {
          include: {
            entreprise: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                email: true,
                secteur: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (candidatureAcceptee) {
      // Trouver un encadreur existant ou assigner le premier disponible
      const encadreur = await prisma.user.findFirst({
        where: { role: "ENCADREUR" },
      });

      const encadreurId = encadreur ? encadreur.id : user.userId;

      stage = await prisma.stage.create({
        data: {
          etudiantId: user.userId,
          encadreurId,
          candidatureId: candidatureAcceptee.id,
          dateDebut: new Date(),
          dateFin: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          statut: "EN_COURS",
        },
        include: {
          encadreur: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true,
            },
          },
          candidature: {
            include: {
              offre: {
                include: {
                  entreprise: {
                    select: {
                      id: true,
                      nom: true,
                      prenom: true,
                      email: true,
                      secteur: true,
                    },
                  },
                },
              },
            },
          },
          convention: true,
          evaluation: true,
        },
      });
    }
  }

  if (!stage) {
    return NextResponse.json({ error: "Aucun stage trouvé" }, { status: 404 });
  }

  return NextResponse.json(stage);
}