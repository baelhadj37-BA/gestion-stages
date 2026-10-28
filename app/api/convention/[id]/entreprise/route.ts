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

    let body: { action?: string; motifRejet?: string } = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const action = body?.action || "VALIDER";
    const motifRejet = body?.motifRejet;

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

    // L'entreprise signe à l'étape ETAPE_ENTREPRISE
    if (convention.statut !== "ETAPE_ENTREPRISE") {
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
        `Votre convention a été rejetée par l'entreprise. Motif : ${motifRejet}`,
        "CONVENTION_REJETEE"
      );

      return NextResponse.json(rejetee);
    }

    // Valider : ETAPE_ENTREPRISE → ETAPE_ADMIN
    const updated = await prisma.convention.update({
      where: { id },
      data: { statut: "ETAPE_ADMIN", dateValidation: new Date() },
    });

    // Notifier l'étudiant
    await notifierUtilisateur(
      convention.stage.etudiantId,
      "L'entreprise a signé votre convention. Elle passe maintenant en validation administrative.",
      "CONVENTION_ETAPE_SUIVANTE"
    );

    // Notifier tous les admins
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
    for (const admin of admins) {
      await notifierUtilisateur(
        admin.id,
        `La convention du stage #${convention.stageId} a été signée par l'entreprise et attend votre visa.`,
        "CONVENTION_A_VALIDER"
      );
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}