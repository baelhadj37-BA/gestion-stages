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

// POST /api/convention — l'étudiant initie sa convention (Étape 1)
export async function POST(req: NextRequest) {
  try {
    const user = getUser(req);
    if (!user || user.role !== "ETUDIANT") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await req.json();
    const { stageId } = body;

    if (!stageId) {
      return NextResponse.json({ error: "Champ requis: stageId" }, { status: 400 });
    }

    const stage = await prisma.stage.findFirst({
      where: { id: Number(stageId), etudiantId: user.userId },
      include: { candidature: { include: { offre: true } } },
    });
    if (!stage) {
      return NextResponse.json({ error: "Stage introuvable" }, { status: 404 });
    }

    const existante = await prisma.convention.findUnique({
      where: { stageId: Number(stageId) },
    });
    if (existante) {
      return NextResponse.json(
        { error: "Une convention existe déjà pour ce stage", convention: existante },
        { status: 409 }
      );
    }

    const convention = await prisma.convention.create({
      data: {
        stageId: Number(stageId),
        statut: "ETAPE_ETUDIANT",
      },
    });

    await notifierUtilisateur(
      stage.candidature.offre.entrepriseId,
      `Une nouvelle convention attend votre validation (stage #${stageId}).`,
      "CONVENTION_A_VALIDER"
    );

    return NextResponse.json(convention, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// GET /api/convention?stageId=... — suivi en temps réel du statut
export async function GET(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const stageId = req.nextUrl.searchParams.get("stageId");
  if (!stageId) {
    return NextResponse.json({ error: "stageId requis" }, { status: 400 });
  }

  const convention = await prisma.convention.findUnique({
    where: { stageId: Number(stageId) },
  });

  if (!convention) {
    return NextResponse.json({ error: "Convention introuvable" }, { status: 404 });
  }

  // Récupère le QR Code associé, s'il existe (généré à la validation admin)
  let qrCodeUrl: string | null = null;
  if (convention.statut === "VALIDEE") {
    const document = await prisma.document.findFirst({
      where: { stageId: Number(stageId), type: "CONVENTION" },
      orderBy: { dateGeneration: "desc" },
    });
    qrCodeUrl = document?.qrCodeUrl ?? null;
  }

  return NextResponse.json({ ...convention, qrCodeUrl });
}