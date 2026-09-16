import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifierToken } from "@/lib/auth";
import { creerDocumentSecurise } from "@/lib/documents";
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
    if (!user || user.role !== "ADMIN") {
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
      include: { stage: true },
    });
    if (!convention) {
      return NextResponse.json({ error: "Convention introuvable" }, { status: 404 });
    }

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
        `Votre convention a été rejetée par l'administration. Motif : ${motifRejet}`,
        "CONVENTION_REJETEE"
      );

      return NextResponse.json(rejetee);
    }

    // Validation finale : crée le Document, génère le QR Code, puis le PDF avec Khady
    const document = await creerDocumentSecurise(convention.stageId, "CONVENTION");

    const validee = await prisma.convention.update({
      where: { id },
      data: {
        statut: "VALIDEE",
        pdfUrl: document.pdfUrl,
        dateValidation: new Date(),
      },
    });

    await notifierUtilisateur(
      convention.stage.etudiantId,
      "Votre convention est validée ! Le document officiel est disponible.",
      "CONVENTION_VALIDEE"
    );

    return NextResponse.json(validee);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}