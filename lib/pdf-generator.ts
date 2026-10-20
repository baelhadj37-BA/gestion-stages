import puppeteer from 'puppeteer';
import QRCode from 'qrcode';
import { randomUUID } from 'crypto';

/**
 * Génère un fichier PDF de convention de stage officielle avec QR Code anti-falsification.
 * @param conventionId - L'identifiant unique de la convention (ex: STAGE-IPD-2026-001)
 * @returns Un Buffer contenant le PDF généré
 */
export async function generateConventionPDF(conventionId: string): Promise<Buffer> {
  // 1. Génération d'un UUID unique et sécurisé pour le QR Code
  const documentUuid = randomUUID();
  const verificationUrl = `http://localhost:3000/verify/${documentUuid}`;

  // 2. Génération du QR Code sous forme d'image data URL (base64)
  const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 120,
  });

  // 3. Lancement de Puppeteer en mode headless
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // 4. Contenu HTML stylisé avec le bloc QR Code officiel
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Helvetica', Arial, sans-serif; margin: 40px; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #db2777; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #db2777; font-size: 24px; margin: 0; }
        .header p { color: #666; font-size: 14px; margin-top: 5px; }
        .info-block { margin-bottom: 20px; font-size: 14px; line-height: 1.6; }
        .info-block strong { color: #111; }
        .footer-container { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 50px; }
        .signatures { display: flex; justify-content: space-between; width: 65%; font-weight: bold; font-size: 14px; }
        .qrcode-box { text-align: center; border: 1px dashed #db2777; padding: 10px; border-radius: 8px; width: 130px; background: #fffdfd; }
        .qrcode-box img { width: 100px; height: 100px; }
        .uuid-text { font-size: 9px; color: #777; margin-top: 4px; word-break: break-all; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Institut Polytechnique de Dakar (IPD)</h1>
        <p>Convention de Stage Officielle - Année 2026</p>
      </div>

      <div class="info-block">
        <p><strong>Référence du document :</strong> ${conventionId}</p>
        <p><strong>Étudiante :</strong> Khady Tall</p>
        <p><strong>Classe :</strong> STI3</p>
        <p><strong>Entreprise d'accueil :</strong> Tech Solutions Senegal</p>
        <p><strong>Période :</strong> Du 01/07/2026 au 30/11/2026</p>
      </div>

      <div class="info-block">
        <h3>Objet de la convention :</h3>
        <p>La présente convention régit les conditions d'accueil, de suivi et d'encadrement du stagiaire au sein de l'entreprise partenaire dans le cadre de sa formation en STI3 à l'IPD.</p>
      </div>

      <div class="footer-container">
        <div class="signatures">
          <div>Cachet de l'IPD<br><br><br>____________________</div>
          <div>Signature de l'Étudiante<br><br><br>____________________</div>
        </div>
        
        <div class="qrcode-box">
          <img src="${qrCodeDataUrl}" alt="QR Code de Vérification" />
          <div class="uuid-text">UUID: ${documentUuid.substring(0, 8)}...</div>
        </div>
      </div>
    </body>
    </html>
  `;

  await page.setContent(htmlContent);
  const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });

  await browser.close();
  return Buffer.from(pdfBuffer);
}