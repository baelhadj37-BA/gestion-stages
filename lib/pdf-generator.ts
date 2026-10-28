import puppeteer from 'puppeteer';
import QRCode from 'qrcode';
import { prisma } from '@/lib/prisma';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Génère un PDF de convention avec les vraies données depuis la base.
 * @param conventionId - L'id de la convention (string → converti en Int)
 */
export async function generateConventionPDF(conventionId: string): Promise<Buffer> {
  // 1. Récupérer la convention depuis la base
  const convention = await prisma.convention.findUnique({
    where: { id: Number(conventionId) },
    include: {
      stage: {
        include: {
          etudiant: true,
          encadreur: true,
          candidature: {
            include: {
              offre: {
                include: {
                  entreprise: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!convention) {
    throw new Error(`Convention #${conventionId} introuvable`);
  }

  const { stage } = convention;
  const etudiant  = stage.etudiant;
  const encadreur = stage.encadreur;
  const offre     = stage.candidature.offre;
  const entreprise = offre.entreprise;

  // 2. URL de vérification basée sur l'UUID Prisma (déjà en base)
  const verificationUrl = `${BASE_URL}/verify/${convention.uuid}`;

  // 3. Générer le QR Code
  const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 120,
  });

  // 4. Formater les dates
  const fmt = (d: Date) =>
    new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // 5. Lancer Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Helvetica', Arial, sans-serif; margin: 40px; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #0b2f7a; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #0b2f7a; font-size: 22px; margin: 0; }
        .header p  { color: #666; font-size: 13px; margin-top: 5px; }
        .ref       { text-align: center; font-size: 12px; color: #888; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px; }
        table th { background: #f0f4fb; color: #0b2f7a; padding: 8px 12px; text-align: left; border: 1px solid #d1d9f0; width: 35%; }
        table td { padding: 8px 12px; border: 1px solid #d1d9f0; }
        .section-title { font-size: 14px; font-weight: bold; color: #0b2f7a; margin: 24px 0 8px; border-left: 4px solid #1d6fe8; padding-left: 10px; }
        .objet { font-size: 13px; line-height: 1.7; padding: 14px 16px; background: #f8faff; border-radius: 6px; margin-bottom: 24px; }
        .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 48px; }
        .signatures { display: flex; gap: 60px; font-size: 13px; font-weight: bold; }
        .sig-block  { text-align: center; }
        .sig-line   { margin-top: 48px; border-top: 1px solid #333; width: 160px; }
        .qrcode-box { text-align: center; border: 1px dashed #0b2f7a; padding: 10px 14px; border-radius: 8px; background: #f8faff; }
        .qrcode-box img { width: 100px; height: 100px; }
        .uuid-text  { font-size: 9px; color: #888; margin-top: 4px; word-break: break-all; max-width: 120px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Institut Polytechnique de Dakar (IPD Thomas Sankara)</h1>
        <p>Convention de Stage Officielle — Année ${new Date().getFullYear()}</p>
      </div>

      <p class="ref">Référence : CONV-IPD-${convention.id.toString().padStart(4, '0')}</p>

      <div class="section-title">Informations de l'étudiant(e)</div>
      <table>
        <tr><th>Nom complet</th><td>${etudiant.prenom} ${etudiant.nom}</td></tr>
        <tr><th>Email</th><td>${etudiant.email}</td></tr>
        <tr><th>Classe</th><td>${etudiant.classe ?? '—'}</td></tr>
        <tr><th>Filière</th><td>${etudiant.filiere ?? '—'}</td></tr>
        <tr><th>Matricule</th><td>${etudiant.matricule ?? '—'}</td></tr>
      </table>

      <div class="section-title">Entreprise d'accueil</div>
      <table>
        <tr><th>Nom de l'entreprise</th><td>${entreprise.nom} ${entreprise.prenom}</td></tr>
        <tr><th>Email</th><td>${entreprise.email}</td></tr>
        <tr><th>Secteur</th><td>${entreprise.secteur ?? '—'}</td></tr>
      </table>

      <div class="section-title">Détails du stage</div>
      <table>
        <tr><th>Poste</th><td>${offre.titre}</td></tr>
        <tr><th>Durée</th><td>${offre.duree} semaine(s)</td></tr>
        <tr><th>Localisation</th><td>${offre.localisation}</td></tr>
        <tr><th>Date de début</th><td>${fmt(stage.dateDebut)}</td></tr>
        <tr><th>Date de fin</th><td>${fmt(stage.dateFin)}</td></tr>
        <tr><th>Encadreur académique</th><td>${encadreur ? `${encadreur.prenom} ${encadreur.nom}` : 'À assigner'}</td></tr>
      </table>

      <div class="section-title">Objet de la convention</div>
      <div class="objet">
        La présente convention régit les conditions d'accueil, de suivi et d'encadrement de l'étudiant(e)
        <strong>${etudiant.prenom} ${etudiant.nom}</strong> au sein de <strong>${entreprise.nom}</strong>
        dans le cadre de sa formation en <strong>${etudiant.filiere ?? 'Informatique'}</strong>
        à l'Institut Polytechnique de Dakar (IPD Thomas Sankara), du <strong>${fmt(stage.dateDebut)}</strong>
        au <strong>${fmt(stage.dateFin)}</strong>.
      </div>

      <div class="footer">
        <div class="signatures">
          <div class="sig-block">
            Cachet &amp; Signature IPD
            <div class="sig-line"></div>
          </div>
          <div class="sig-block">
            Signature de l'étudiant(e)
            <div class="sig-line"></div>
          </div>
          <div class="sig-block">
            Cachet de l'entreprise
            <div class="sig-line"></div>
          </div>
        </div>

        <div class="qrcode-box">
          <img src="${qrCodeDataUrl}" alt="QR Code de vérification" />
          <div class="uuid-text">UUID: ${convention.uuid.substring(0, 16)}…</div>
        </div>
      </div>
    </body>
    </html>
  `;

  await page.setContent(htmlContent, { waitUntil: 'load' });
  const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();

  return Buffer.from(pdfBuffer);
}