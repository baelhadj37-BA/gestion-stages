import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifierToken } from "@/lib/auth";
import { notifierUtilisateur } from "@/lib/notifications";

function getUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];
  if (!token) return null;
  return verifierToken(token);
}

// GET /api/candidatures — Récupérer les candidatures de l'étudiant connecté ou de l'entreprise
export async function GET(req: NextRequest) {
  try {
    const user = getUser(req);
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (user.role === "ETUDIANT") {
      const candidatures = await prisma.candidature.findMany({
        where: { etudiantId: user.userId },
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
          stage: {
            select: {
              id: true,
              statut: true,
              dateDebut: true,
              dateFin: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json(candidatures);
    }

    if (user.role === "ENTREPRISE") {
      const candidatures = await prisma.candidature.findMany({
        where: {
          offre: {
            entrepriseId: user.userId,
          },
        },
        include: {
          etudiant: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true,
              matricule: true,
              classe: true,
              competences: true,
            },
          },
          offre: true,
          stage: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json(candidatures);
    }

    return NextResponse.json({ error: "Rôle non pris en charge" }, { status: 403 });
  } catch (error) {
    console.error("Erreur GET /api/candidatures:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/candidatures — L'étudiant postule à une offre de stage
export async function POST(req: NextRequest) {
  try {
    const user = getUser(req);
    if (!user || user.role !== "ETUDIANT") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await req.json();
    const { offreId, cvUrl, lettreUrl } = body;

    if (!offreId) {
      return NextResponse.json({ error: "L'identifiant de l'offre est requis" }, { status: 400 });
    }

    const offre = await prisma.offre.findUnique({
      where: { id: Number(offreId) },
      include: { entreprise: true },
    });

    if (!offre) {
      return NextResponse.json({ error: "Offre introuvable" }, { status: 404 });
    }

    // Vérifier si l'étudiant a déjà postulé à cette offre
    const existante = await prisma.candidature.findFirst({
      where: {
        etudiantId: user.userId,
        offreId: Number(offreId),
      },
    });

    if (existante) {
      return NextResponse.json(
        { error: "Vous avez déjà soumis une candidature pour cette offre." },
        { status: 400 }
      );
    }

    const nouvelleCandidature = await prisma.candidature.create({
      data: {
        etudiantId: user.userId,
        offreId: Number(offreId),
        cvUrl: cvUrl || "/uploads/cv-default.pdf",
        lettreUrl: lettreUrl || null,
        statut: "EN_ATTENTE",
      },
      include: {
        offre: {
          include: {
            entreprise: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Notifier l'entreprise
    const etudiantUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { nom: true, prenom: true },
    });
    const etudiantNom = etudiantUser ? `${etudiantUser.prenom} ${etudiantUser.nom}` : "Un étudiant";

    await notifierUtilisateur(
      offre.entrepriseId,
      `${etudiantNom} a postulé à votre offre "${offre.titre}".`,
      "NOUVELLE_CANDIDATURE"
    );

    return NextResponse.json(nouvelleCandidature, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/candidatures:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
