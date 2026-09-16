import { PrismaClient } from "@prisma/client";
import { genererQrCode } from "./qrcode";
import fs from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

type TypeDocument = "CONVENTION" | "ATTESTATION" | "FICHE_EVALUATION";

// Placeholder en attendant l'intégration réelle des générateurs PDF de Khady
// (convention-generator.ts, attestation-generator.ts, evaluation-generator.ts)
async function genererPdfPlaceholder(type: TypeDocument, documentId: number, qrCodeUrl: string): Promise<Buffer> {
  console.log(`[TODO Khady] Générer le PDF ${type} #${documentId} avec QR Code : ${qrCodeUrl}`);
  return Buffer.from(`PDF placeholder pour ${type} #${documentId}`);
}

// Fonction générique de sécurisation d'un document : crée l'enregistrement Document
// avec un UUID unique, génère son QR Code, génère le PDF (Khady), et retourne le document complet.
export async function creerDocumentSecurise(stageId: number, type: TypeDocument) {
  // 1. Créer le Document (génère l'uuid automatiquement), pdfUrl provisoire
  const document = await prisma.document.create({
    data: { stageId, type, pdfUrl: "" },
  });

  // 2. Générer le QR Code à partir de cet uuid précis
  const qrCodeUrl = await genererQrCode(document.uuid);
  const qrCodeUrlComplete = `${process.env.APP_URL}${qrCodeUrl}`;

  // 3. Générer le PDF (placeholder pour l'instant — à remplacer par les fonctions de Khady
  //    une fois convention-generator.ts, attestation-generator.ts, evaluation-generator.ts fusionnés)
  const pdfBuffer = await genererPdfPlaceholder(type, document.id, qrCodeUrlComplete);

  // 4. Sauvegarder le PDF sur le disque
  const dossier = path.join(process.cwd(), "public", "documents");
  await fs.mkdir(dossier, { recursive: true });
  const cheminPdf = path.join(dossier, `${document.uuid}.pdf`);
  await fs.writeFile(cheminPdf, pdfBuffer);
  const pdfUrl = `/documents/${document.uuid}.pdf`;

  // 5. Mettre à jour le Document avec les URLs finales
  return prisma.document.update({
    where: { id: document.id },
    data: { pdfUrl, qrCodeUrl },
  });
}