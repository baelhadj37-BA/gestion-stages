import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifierToken } from "@/lib/auth";

function getUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];
  if (!token) return null;
  return verifierToken(token);
}

export async function GET(req: NextRequest) {
  try {
    const user = getUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const jours = parseInt(searchParams.get("jours") || "7", 10);

    const maintenant = new Date();
    const ilYaUnMois = new Date(maintenant.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ilYaUneSemaine = new Date(maintenant.getTime() - 7 * 24 * 60 * 60 * 1000);
    const debutPeriode = new Date(maintenant.getTime() - jours * 24 * 60 * 60 * 1000);
    const debutPeriodePrecedente = new Date(maintenant.getTime() - jours * 2 * 24 * 60 * 60 * 1000);

    // Cartes statistiques
    const [
      totalEtudiants,
      etudiantsMois,
      totalEntreprises,
      entreprisesMois,
      totalOffres,
      offresSemaine,
      candidaturesEnAttente,
      candidaturesEnAttenteSemaine,
      offresEnAttente,
      conventionsEnAttente,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "ETUDIANT" } }),
      prisma.user.count({ where: { role: "ETUDIANT", createdAt: { gte: ilYaUnMois } } }),
      prisma.user.count({ where: { role: "ENTREPRISE" } }),
      prisma.user.count({ where: { role: "ENTREPRISE", createdAt: { gte: ilYaUnMois } } }),
      prisma.offre.count(),
      prisma.offre.count({ where: { createdAt: { gte: ilYaUneSemaine } } }),
      prisma.candidature.count({ where: { statut: "EN_ATTENTE" } }),
      prisma.candidature.count({ where: { statut: "EN_ATTENTE", createdAt: { gte: ilYaUneSemaine } } }),
      prisma.offre.count({ where: { statut: "EN_ATTENTE" } }),
      prisma.convention.count({ where: { statut: { in: ["ETAPE_ETUDIANT", "ETAPE_ENTREPRISE"] } } }),
    ]);

    // Évolution des candidatures sur la période demandée
    const candidaturesPeriode = await prisma.candidature.findMany({
      where: { createdAt: { gte: debutPeriode } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const candidaturesPeriodePrecedente = await prisma.candidature.count({
      where: {
        createdAt: {
          gte: debutPeriodePrecedente,
          lt: debutPeriode,
        },
      },
    });

    // Construire la série par date (YYYY-MM-DD)
    const statsParJour: Record<string, number> = {};
    for (let i = 0; i < jours; i++) {
      const d = new Date(debutPeriode.getTime() + i * 24 * 60 * 60 * 1000);
      const cle = d.toISOString().split("T")[0];
      statsParJour[cle] = 0;
    }

    candidaturesPeriode.forEach((c) => {
      const cle = c.createdAt.toISOString().split("T")[0];
      if (statsParJour[cle] !== undefined) {
        statsParJour[cle]++;
      }
    });

    const serie = Object.entries(statsParJour).map(([date, total]) => ({
      date,
      total,
    }));

    const totalCandidaturesPeriode = candidaturesPeriode.length;
    let variation: number | null = null;
    if (candidaturesPeriodePrecedente > 0) {
      variation = Math.round(
        ((totalCandidaturesPeriode - candidaturesPeriodePrecedente) / candidaturesPeriodePrecedente) * 100
      );
    }

    // Dernières candidatures
    const dernieresCandidatures = await prisma.candidature.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        etudiant: { select: { nom: true, prenom: true } },
        offre: {
          select: {
            titre: true,
            entreprise: { select: { nom: true, prenom: true } },
          },
        },
      },
    });

    const dernieres = dernieresCandidatures.map((c) => ({
      id: c.id,
      etudiant: `${c.etudiant.prenom} ${c.etudiant.nom}`,
      offre: c.offre.titre,
      entreprise: `${c.offre.entreprise.prenom} ${c.offre.entreprise.nom}`.trim(),
      date: c.createdAt.toISOString(),
      statut: c.statut,
    }));

    return NextResponse.json({
      dateServeur: maintenant.toISOString(),
      cartes: {
        etudiants: totalEtudiants,
        etudiantsMois,
        entreprises: totalEntreprises,
        entreprisesMois,
        offres: totalOffres,
        offresSemaine,
        candidaturesEnAttente,
        candidaturesEnAttenteSemaine,
        conventionsEnAttente,
      },
      alertes: {
        offresEnAttente,
        conventionsEnAttente,
      },
      evolution: {
        jours,
        total: totalCandidaturesPeriode,
        variation,
        serie,
      },
      dernieres,
    });
  } catch (error) {
    console.error("Erreur GET /api/admin/dashboard:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
