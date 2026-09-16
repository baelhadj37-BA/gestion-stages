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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);

    const user = getUser(req);
    if (!user || user.role !== "ENTREPRISE") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await req.json();
    const { action, motifRejet } = body;

    if (!["VALIDER", "REJETER"].includes(action)) {
      return NextResponse.json(
        { error: "Action invalide (VALIDER ou REJETER attendu)" },
        { status: 400 }
      );
    }
    if (action === "REJETER" && !motifRejet) {
      return NextResponse.json(
        { error: "motifRejet requis pour un rejet" },
        { status: 400 }
      );
    }

    const convention = await prisma.convention.findUnique({
      where: { id },
      include: {
        stage: { include: { candidature: { include: { offre: true } } } },
      },
    });
    if (!convention) {
      return NextResponse.json({ error: "Convention introuvable" }, { status: 404 });
    }

    const entrepriseId = convention.stage.candidature.offre.entrepriseId;
    if (entrepriseId !== user.userId) {
      return NextResponse.json({ error: "Non autorisé sur ce stage" }, { status: 403 });
    }

    if (convention.statut !== "ETAPE_ETUDIANT") {
      return NextResponse.json(
        { error: `Action impossible depuis le statut actuel: ${convention.statut}` },
        { status: 409 }
      );
    }

    if (action === "REJETER") {
      const rejetee = await prisma.convention.update({
        where: { id },
        data: { statut: "REJETEE", motifRejet },
      });

      await notifierUtilisateur(
        convention.stage.etudiantId,
        `Votre convention a été rejetée. Motif : ${motifRejet}`,
        "CONVENTION_REJETEE"
      );

      return NextResponse.json(rejetee);
    }

    const updated = await prisma.convention.update({
      where: { id },
      data: { statut: "ETAPE_ENTREPRISE" },
    });

    await notifierUtilisateur(
      convention.stage.etudiantId,
      "Votre convention a été validée par l'entreprise, elle passe en validation administrative.",
      "CONVENTION_ETAPE_SUIVANTE"
    );

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}