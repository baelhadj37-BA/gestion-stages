import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifierToken } from "@/lib/auth";

function getUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];
  if (!token) return null;
  return verifierToken(token);
}

// GET /api/admin/offres — Liste des offres en attente de validation
export async function GET(req: NextRequest) {
  try {
    const user = getUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const offres = await prisma.offre.findMany({
      where: { statut: "EN_ATTENTE" },
      include: {
        entreprise: {
          select: {
            nom: true,
            prenom: true,
            secteur: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      offres: offres.map((o) => ({
        id: o.id,
        titre: o.titre,
        localisation: o.localisation,
        duree: o.duree,
        createdAt: o.createdAt.toISOString(),
        entreprise: o.entreprise,
      })),
    });
  } catch (error) {
    console.error("Erreur GET /api/admin/offres:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH /api/admin/offres — Valider ou rejeter une offre
export async function PATCH(req: NextRequest) {
  try {
    const user = getUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await req.json();
    const { offreId, action } = body;

    if (!offreId || !action || !["VALIDER", "REJETER"].includes(action)) {
      return NextResponse.json(
        { error: "offreId et action ('VALIDER' ou 'REJETER') requis" },
        { status: 400 }
      );
    }

    const statut = action === "VALIDER" ? "PUBLIEE" : "FERMEE";

    const offre = await prisma.offre.update({
      where: { id: Number(offreId) },
      data: { statut },
    });

    return NextResponse.json({
      message: `Offre ${action === "VALIDER" ? "validée" : "rejetée"} avec succès`,
      offre,
    });
  } catch (error) {
    console.error("Erreur PATCH /api/admin/offres:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
