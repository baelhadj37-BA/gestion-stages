import { PrismaClient } from "@prisma/client";
import { genererQrCode } from "./qrcode";
// import { generateConventionPDF } from "./convention-generator";
// import { generateAttestationPDF } from "./attestation-generator";
// import { generateEvaluationPDF } from "./evaluation-generator";
import fs from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

type TypeDocument = "CONVENTION" | "ATTESTATION" | "FICHE_EVALUATION";

export async function creerDocumentSecurise(stageId: number, type: TypeDocument) {
  const document = await prisma.document.create({
    data: { stageId, type, pdfUrl: "" },
  });

  const qrCodeUrl = await genererQrCode(document.uuid);
  // const qrCodeUrlComplete = `${process.env.APP_URL}${qrCodeUrl}`;
  const pdfBuffer: Buffer = Buffer.from("");

  // TODO: décommenter quand Lamine push ses fichiers
  // switch (type) {
  //   case "CONVENTION":
  //     pdfBuffer = await generateConventionPDF(String(document.id), qrCodeUrlComplete);
  //     break;
  //   case "ATTESTATION":
  //     pdfBuffer = await generateAttestationPDF(String(document.id), qrCodeUrlComplete);
  //     break;
  //   case "FICHE_EVALUATION":
  //     pdfBuffer = await generateEvaluationPDF(String(document.id), qrCodeUrlComplete);
  //     break;
  // }

  const dossier = path.join(process.cwd(), "public", "documents");
  await fs.mkdir(dossier, { recursive: true });
  const cheminPdf = path.join(dossier, `${document.uuid}.pdf`);
  await fs.writeFile(cheminPdf, pdfBuffer);
  const pdfUrl = `/documents/${document.uuid}.pdf`;

  return prisma.document.update({
    where: { id: document.id },
    data: { pdfUrl, qrCodeUrl },
  });
}