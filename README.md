This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

lib/documents.ts
import { PrismaClient } from "@prisma/client";
import { genererQrCode } from "./qrcode";
import { generateConventionPDF } from "./convention-generator";
import { generateAttestationPDF } from "./attestation-generator";
import { generateEvaluationPDF } from "./evaluation-generator";
import fs from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

type TypeDocument = "CONVENTION" | "ATTESTATION" | "FICHE_EVALUATION";

// Fonction générique de sécurisation d'un document : crée l'enregistrement Document
// avec un UUID unique, génère son QR Code, génère le PDF correspondant (Khady) avec
// ce QR Code intégré, et retourne le document complet.
export async function creerDocumentSecurise(stageId: number, type: TypeDocument) {
  // 1. Créer le Document (uuid généré automatiquement par Prisma), pdfUrl provisoire
  const document = await prisma.document.create({
    data: { stageId, type, pdfUrl: "" },
  });

  // 2. Générer le QR Code à partir de CET uuid précis
  const qrCodeUrl = await genererQrCode(document.uuid);
  const qrCodeUrlComplete = `${process.env.APP_URL}${qrCodeUrl}`;

  // 3. Générer le PDF correspondant, avec ce QR Code intégré (fonctions de Khady)
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