import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifierToken } from "@/lib/auth";
import { genererPdfConvention } from "@/lib/documents";


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
    const { action, motifRejet } = body; // action: "VALIDER" | "REJETER"

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

    const convention = await prisma.convention.findUnique({ where: { id } });
    if (!convention) {
      return NextResponse.json({ error: "Convention introuvable" }, { status: 404 });
    }

    // Machine à états : l'admin ne peut agir qu'à l'étape ETAPE_ENTREPRISE
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
      // TODO (Astou) : notifier l'entreprise du motif de rejet
      return NextResponse.json(rejetee);
    }

    // Validation finale : déclenche la génération du PDF
    const pdfUrl = await genererPdfConvention(id);

    const validee = await prisma.convention.update({
      where: { id },
      data: {
        statut: "VALIDEE",
        pdfUrl,
        dateValidation: new Date(),
      },
    });

    // TODO (Astou) : notifier l'étudiant que sa convention est validée + PDF disponible

    return NextResponse.json(validee);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}