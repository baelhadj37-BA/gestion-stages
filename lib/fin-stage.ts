import { PrismaClient } from "@prisma/client";
import { creerDocumentSecurise } from "./documents";

const prisma = new PrismaClient();

// Détecte automatiquement les stages dont la date de fin est dépassée,
// les marque comme "TERMINE", et déclenche la génération de l'attestation
// (sécurisée par QR Code) pour chacun.
export async function detecterFinsDeStage() {
  const maintenant = new Date();

  const stagesTermines = await prisma.stage.findMany({
    where: {
      statut: "EN_COURS",
      dateFin: { lt: maintenant },
    },
  });

  let attestationsGenerees = 0;

  for (const stage of stagesTermines) {
    try {
      await prisma.stage.update({
        where: { id: stage.id },
        data: { statut: "TERMINE" },
      });

      // Déclenche la génération de l'attestation, sécurisée par QR Code
      await creerDocumentSecurise(stage.id, "ATTESTATION");

      attestationsGenerees++;
    } catch (err) {
      console.error(`[Fin de stage] Erreur pour le stage #${stage.id} :`, err);
    }
  }

  console.log(
    `[Fin de stage] Vérification terminée : ${stagesTermines.length} stage(s) marqué(s) terminé(s), ${attestationsGenerees} attestation(s) générée(s).`
  );
  return { stagesTraites: stagesTermines.length, attestationsGenerees };
}