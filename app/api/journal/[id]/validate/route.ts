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
    const { statut, commentaire } = body;

    if (!["VALIDE", "REJETE"].includes(statut)) {
      return NextResponse.json(
        { error: "Statut invalide (VALIDE ou REJETE attendu)" },
        { status: 400 }
      );
    }

    const journal = await prisma.journalBord.findUnique({
      where: { id },
      include: {
        stage: { include: { candidature: { include: { offre: true } } } },
      },
    });
    if (!journal) {
      return NextResponse.json({ error: "Journal introuvable" }, { status: 404 });
    }

    const entrepriseId = journal.stage.candidature.offre.entrepriseId;
    if (entrepriseId !== user.userId) {
      return NextResponse.json({ error: "Non autorisé sur ce stage" }, { status: 403 });
    }

    const updated = await prisma.journalBord.update({
      where: { id },
      data: { statut, commentaire: commentaire ?? null, dateValidation: new Date() },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}