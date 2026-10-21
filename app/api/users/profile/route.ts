import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifierToken } from "@/lib/auth";

function getUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];
  if (!token) return null;
  return verifierToken(token);
}

// GET /api/users/profile — Profil de l'utilisateur connecté
export async function GET(req: NextRequest) {
  try {
    const auth = getUser(req);
    if (!auth) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
        matricule: true,
        classe: true,
        secteur: true,
        competences: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Erreur GET /api/users/profile:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT /api/users/profile — Mettre à jour le profil
export async function PUT(req: NextRequest) {
  try {
    const auth = getUser(req);
    if (!auth) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const { nom, prenom, matricule, classe, competences, secteur } = body;

    const dataToUpdate: any = {};
    if (nom !== undefined) dataToUpdate.nom = nom.trim();
    if (prenom !== undefined) dataToUpdate.prenom = prenom.trim();
    if (matricule !== undefined) dataToUpdate.matricule = matricule.trim();
    if (classe !== undefined) dataToUpdate.classe = classe.trim();
    if (competences !== undefined) dataToUpdate.competences = competences.trim();
    if (secteur !== undefined) dataToUpdate.secteur = secteur.trim();

    const updatedUser = await prisma.user.update({
      where: { id: auth.userId },
      data: dataToUpdate,
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
        matricule: true,
        classe: true,
        secteur: true,
        competences: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Erreur PUT /api/users/profile:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
