import QRCode from "qrcode";
import fs from "fs/promises";
import path from "path";

export async function genererQrCode(uuid: string): Promise<string> {
  const baseUrl = process.env.APP_URL || "http://localhost:3000";
  const urlVerification = `${baseUrl}/verify/${uuid}`;

  const dossier = path.join(process.cwd(), "public", "qrcodes");
  await fs.mkdir(dossier, { recursive: true });

  const cheminFichier = path.join(dossier, `${uuid}.png`);
  await QRCode.toFile(cheminFichier, urlVerification, {
    width: 300,
    margin: 2,
  });

  return `/qrcodes/${uuid}.png`;
}