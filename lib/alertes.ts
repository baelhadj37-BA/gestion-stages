import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SEPT_JOURS_MS = 7 * 24 * 60 * 60 * 1000;

function calculerSemaineActuelle(dateDebut: Date): number {
  const joursEcoules = (Date.now() - dateDebut.getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(1, Math.floor(joursEcoules / 7) + 1);
}

export async function detecterRetardsJournaux() {
  const maintenant = new Date();

  const stages = await prisma.stage.findMany({
    where: { statut: "EN_COURS" },
    include: {
      journaux: { orderBy: { dateDepot: "desc" }, take: 1 },
    },
  });

  let alertesDeclenchees = 0;

  for (const stage of stages) {
    const dernierJournal = stage.journaux[0];
    const dateReference = dernierJournal?.dateDepot ?? stage.dateDebut;
    const enRetard = maintenant.getTime() - new Date(dateReference).getTime() > SEPT_JOURS_MS;

    if (!enRetard) continue;

    const semaineActuelle = calculerSemaineActuelle(stage.dateDebut);

    const journalCourant = await prisma.journalBord.findFirst({
      where: { stageId: stage.id, semaine: semaineActuelle },
    });

    if (journalCourant) {
      if (!journalCourant.alerte) {
        await prisma.journalBord.update({
          where: { id: journalCourant.id },
          data: { alerte: true },
        });
        alertesDeclenchees++;
      }
    } else {
      await prisma.journalBord.create({
        data: {
          stageId: stage.id,
          semaine: semaineActuelle,
          contenu: "",
          statut: "EN_ATTENTE",
          alerte: true,
        },
      });
      alertesDeclenchees++;
    }

    // Notification uniquement si encadreur assigné
    if (stage.encadreurId !== null) {
      await prisma.notification.create({
        data: {
          userId: stage.encadreurId,
          type: "ALERTE_JOURNAL",
          message: `Aucun rapport soumis depuis plus de 7 jours pour le stage #${stage.id}.`,
        },
      });
    }
  }

  console.log(`[Alertes] Vérification terminée : ${alertesDeclenchees} alerte(s) déclenchée(s).`);
  return alertesDeclenchees;
}