import { PrismaClient } from "@prisma/client";
import { genererQrCode } from "./qrcode";
import { generateConventionPDF } from "./convention-generator";
import { generateAttestationPDF } from "./attestation-generator";
import { generateEvaluationPDF } from "./evaluation-generator";
import fs from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

type TypeDocument = "CONVENTION" | "ATTESTATION" | "FICHE_EVALUATION";

export async function creerDocumentSecurise(stageId: number, type: TypeDocument) {
  // 1. Créer le Document (génère l'uuid automatiquement), pdfUrl provisoire
  const document = await prisma.document.create({
    data: { stageId, type, pdfUrl: "" },
  });

  // 2. Générer le QR Code à partir de CET uuid précis
  const qrCodeUrl = await genererQrCode(document.uuid); // ex: /qrcodes/uuid.png
  const qrCodeUrlComplete = `${process.env.APP_URL}${qrCodeUrl}`;

  // 3. Générer le PDF correspondant, avec CE QR Code intégré
  let pdfBuffer: Buffer;
  switch (type) {
    case "CONVENTION":
      pdfBuffer = await generateConventionPDF(String(document.id), qrCodeUrlComplete);
      break;
    case "ATTESTATION":
      pdfBuffer = await generateAttestationPDF(String(document.id), qrCodeUrlComplete);
      break;
    case "FICHE_EVALUATION":
      pdfBuffer = await generateEvaluationPDF(String(document.id), qrCodeUrlComplete);
      break;
  }

  // 4. Sauvegarder le PDF généré sur le disque
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