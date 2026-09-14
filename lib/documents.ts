import { PrismaClient } from "@prisma/client";
import { genererQrCode } from "./qrcode";

const prisma = new PrismaClient();

export async function genererPdfConvention(conventionId: number): Promise<string> {
  console.log(`[TODO Khady] Générer le PDF de la convention #${conventionId}`);
  return `/documents/convention-${conventionId}.pdf`;
}

export async function creerDocumentSecurise(
  stageId: number,
  type: string,
  pdfUrl: string
) {
  const document = await prisma.document.create({
    data: { stageId, type, pdfUrl },
  });

  const qrCodeUrl = await genererQrCode(document.uuid);

  return prisma.document.update({
    where: { id: document.id },
    data: { qrCodeUrl },
  });
}