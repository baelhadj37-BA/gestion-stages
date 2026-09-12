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

function calculerSemaineActuelle(dateDebut: Date): number {
  const joursEcoules = (Date.now() - dateDebut.getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(1, Math.floor(joursEcoules / 7) + 1);
}

// GET /api/dashboard/encadreur — jauge de progression de tous les stagiaires de l'encadreur connecté
export async function GET(req: NextRequest) {
  const user = getUser(req);
  if (!user || user.role !== "ENCADREUR") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const stages = await prisma.stage.findMany({
    where: { encadreurId: user.userId, statut: "EN_COURS" },
    include: {
      etudiant: { select: { id: true, nom: true, prenom: true } },
      journaux: true,
    },
  });

  const progression = stages.map((stage) => {
    const semaineActuelle = calculerSemaineActuelle(stage.dateDebut);
    const soumis = stage.journaux.filter((j) => j.statut !== "EN_ATTENTE").length;
    const valides = stage.journaux.filter((j) => j.statut === "VALIDE").length;
    const enRetard = stage.journaux.filter((j) => j.alerte).length;
    const pourcentage = semaineActuelle > 0
      ? Math.round((soumis / semaineActuelle) * 100)
      : 0;

    return {
      stageId: stage.id,
      etudiant: stage.etudiant,
      semaineActuelle,
      rapportsSoumis: soumis,
      rapportsValides: valides,
      rapportsEnRetard: enRetard,
      pourcentageProgression: Math.min(pourcentage, 100),
    };
  });

  return NextResponse.json(progression);
}