import puppeteer from 'puppeteer';
import QRCode from 'qrcode';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function generateConventionPDF(conventionId: string): Promise<Buffer> {
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
  const etudiant   = stage.etudiant;
  const encadreur  = stage.encadreur;
  const offre      = stage.candidature.offre;
  const entreprise = offre.entreprise;

  const verificationUrl = `${BASE_URL}/verify/${convention.uuid}`;

  const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 150,
  });

  const fmt = (d: Date) =>
    new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const ref = `CONV-IPD-${convention.id.toString().padStart(4, '0')}`;
  const annee = new Date().getFullYear();
  const nomEntreprise = entreprise.nom ?? '';
  const nomEncadreur = encadreur ? `${encadreur.prenom} ${encadreur.nom}` : 'À assigner';

  // Logo IPD en base64
  const logoPath = path.join(process.cwd(), 'public', 'logo-ipd.jpg');
  let logoDataUrl = '';
  try {
    const logoBuffer = fs.readFileSync(logoPath);
    logoDataUrl = `data:image/jpeg;base64,${logoBuffer.toString('base64')}`;
  } catch {
    logoDataUrl = '';
  }

  // Chercher Chrome installé sur le système Windows
  const chromeExecutable =
    process.env.CHROME_EXECUTABLE_PATH ||
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: chromeExecutable,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });

  const page = await browser.newPage();

  const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 297mm; width: 210mm; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #1a2340;
      background: #fff;
      font-size: 11px;
      display: flex;
      flex-direction: column;
      min-height: 297mm;
    }
    .main-content { flex: 1; display: flex; flex-direction: column; }

    /* BANNER */
    .banner {
      background: linear-gradient(135deg, #0b2f7a 0%, #1d6fe8 100%);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 24px;
      color: #fff;
    }
    .banner-left { display: flex; align-items: center; gap: 12px; }
    .banner-title { font-size: 13px; font-weight: 700; line-height: 1.2; }
    .banner-sub   { font-size: 10px; opacity: 0.85; margin-top: 2px; }
    .banner-right { text-align: right; font-style: italic; font-size: 12px; font-weight: 600; opacity: 0.92; line-height: 1.4; }

    /* TITLE CARD */
    .title-card {
      background: #f0f6ff;
      border: 1px solid #c7dafb;
      border-radius: 8px;
      margin: 10px 20px 0;
      padding: 10px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .title-card-left { display: flex; align-items: center; gap: 12px; }
    .title-main  { font-size: 17px; font-weight: 800; color: #0b2f7a; }
    .title-year  { font-size: 11px; color: #5a7ab5; margin-top: 2px; }
    .badge-officiel {
      background: #fff;
      border: 1.5px solid #1d6fe8;
      color: #1d6fe8;
      border-radius: 20px;
      padding: 4px 12px;
      font-size: 10px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .ref-line { text-align: center; font-size: 10px; color: #7a90b8; margin: 8px 0 10px; letter-spacing: 0.5px; }

    /* SECTIONS */
    .content { padding: 0 20px; flex: 1; display: flex; flex-direction: column; }
    .section { background: #fff; border: 1px solid #dce8fb; border-radius: 7px; margin-bottom: 8px; overflow: hidden; }
    .section-objet { flex: 1; }
    .objet-body { padding: 8px 14px; font-size: 11px; line-height: 1.8; color: #2a3a5c; flex: 1; }
    .section-head { display: flex; align-items: center; gap: 8px; padding: 6px 14px; background: #f5f9ff; border-bottom: 1px solid #dce8fb; }
    .section-num { width: 20px; height: 20px; background: #1d6fe8; border-radius: 50%; color: #fff; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .section-icon { font-size: 13px; }
    .section-title { font-size: 12px; font-weight: 700; color: #0b2f7a; }

    table.info { width: 100%; border-collapse: collapse; }
    table.info tr { border-bottom: 1px solid #eef3fb; }
    table.info tr:last-child { border-bottom: none; }
    table.info th { width: 38%; padding: 5px 14px; font-weight: 600; color: #4a6fa5; background: #fafcff; text-align: left; font-size: 10px; }
    table.info td { padding: 5px 14px; color: #1a2340; font-size: 11px; }

    /* objet-body already defined above */
    .objet-body strong { color: #0b2f7a; }

    /* FOOTER */
    .footer { margin: 10px 20px 0; border: 1px solid #dce8fb; border-radius: 7px; overflow: hidden; }
    .footer-sigs { display: flex; }
    .sig-col { flex: 1; border-right: 1px solid #dce8fb; padding: 10px 10px; text-align: center; }
    .sig-col:last-child { border-right: none; }
    .sig-col-qr { width: 120px; flex-shrink: 0; border-right: 1px solid #dce8fb; padding: 10px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .sig-icon { width: 28px; height: 28px; background: #e8f0fe; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 6px; font-size: 13px; }
    .sig-label { font-size: 10px; font-weight: 700; color: #0b2f7a; margin-bottom: 20px; }
    .sig-line  { border-top: 1px solid #a0b4d6; margin: 0 auto; width: 80%; }
    .sig-name  { font-size: 9px; color: #5a7ab5; margin-top: 4px; }
    .qr-img    { width: 72px; height: 72px; }
    .qr-label  { font-size: 9px; color: #7a90b8; margin-top: 4px; }

    /* BOTTOM BAR */
    .bottom-bar { background: #0b2f7a; color: rgba(255,255,255,0.85); display: flex; align-items: center; justify-content: space-between; padding: 7px 20px; font-size: 10px; margin-top: 10px; }
    .bottom-bar-left { display: flex; align-items: center; gap: 6px; font-weight: 600; }
    .bottom-bar-right { opacity: 0.75; }
  </style>
</head>
<body>

  <!-- BANNER -->
  <div class="banner">
    <div class="banner-left">
      ${logoDataUrl
        ? `<img src="${logoDataUrl}" alt="Logo IPD" style="width:46px;height:46px;object-fit:contain;border-radius:50%;background:#fff;padding:2px;">`
        : `<div style="width:46px;height:46px;border-radius:50%;background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:900;border:2px solid rgba(255,255,255,0.4);">IPD</div>`
      }
      <div>
        <div class="banner-title">INSTITUT POLYTECHNIQUE<br>DE DAKAR</div>
        <div class="banner-sub">Plateforme de gestion des stages</div>
      </div>
    </div>
    <div class="banner-right">Former aujourd'hui<br>les talents de demain</div>
  </div>

  <!-- TITLE CARD -->
  <div class="title-card">
    <div class="title-card-left">
      ${logoDataUrl
        ? `<img src="${logoDataUrl}" alt="Logo IPD" style="width:42px;height:42px;object-fit:contain;">`
        : `<div style="width:42px;height:42px;background:#1d6fe8;border-radius:10px;display:flex;align-items:center;justify-content:center;"><svg width='22' height='22' viewBox='0 0 24 24' fill='white'><path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'/><polyline points='14 2 14 8 20 8' style='fill:none;stroke:#fff;stroke-width:2'/></svg></div>`
      }
      <div>
        <div class="title-main">Convention de stage</div>
        <div class="title-year">Convention de Stage Officielle — Année ${annee}</div>
      </div>
    </div>
    <div class="badge-officiel">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1d6fe8" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      Document officiel
    </div>
  </div>

  <div class="ref-line">Référence : ${ref}</div>

  <div class="main-content">
  <div class="content">

    <div class="section">
      <div class="section-head">
        <div class="section-num">1</div>
        <span class="section-icon">👤</span>
        <div class="section-title">Informations de l'étudiant(e)</div>
      </div>
      <table class="info">
        <tr><th>Nom complet</th><td>${etudiant.prenom} ${etudiant.nom}</td></tr>
        <tr><th>Email</th><td>${etudiant.email}</td></tr>
        <tr><th>Classe</th><td>${etudiant.classe ?? '—'}</td></tr>
        <tr><th>Filière</th><td>${etudiant.filiere ?? '—'}</td></tr>
        <tr><th>Matricule</th><td>${etudiant.matricule ?? '—'}</td></tr>
      </table>
    </div>

    <div class="section">
      <div class="section-head">
        <div class="section-num">2</div>
        <span class="section-icon">🏢</span>
        <div class="section-title">Entreprise d'accueil</div>
      </div>
      <table class="info">
        <tr><th>Nom de l'entreprise</th><td>${nomEntreprise}</td></tr>
        <tr><th>Email</th><td>${entreprise.email}</td></tr>
        <tr><th>Secteur</th><td>${entreprise.secteur ?? '—'}</td></tr>
      </table>
    </div>

    <div class="section">
      <div class="section-head">
        <div class="section-num">3</div>
        <span class="section-icon">📅</span>
        <div class="section-title">Détails du stage</div>
      </div>
      <table class="info">
        <tr><th>Poste</th><td>${offre.titre}</td></tr>
        <tr><th>Durée</th><td>${offre.duree}</td></tr>
        <tr><th>Localisation</th><td>${offre.localisation}</td></tr>
        <tr><th>Date de début</th><td>${fmt(stage.dateDebut)}</td></tr>
        <tr><th>Date de fin</th><td>${fmt(stage.dateFin)}</td></tr>
        <tr><th>Encadreur académique</th><td>${nomEncadreur}</td></tr>
      </table>
    </div>

    <div class="section section-objet">
      <div class="section-head">
        <div class="section-num">4</div>
        <span class="section-icon">📄</span>
        <div class="section-title">Objet de la convention</div>
      </div>
      <div class="objet-body">
        La présente convention régit les conditions d'accueil, de suivi et d'encadrement de l'étudiant(e)
        <strong>${etudiant.prenom} ${etudiant.nom}</strong> au sein de <strong>${nomEntreprise}</strong>
        dans le cadre de sa formation en <strong>${etudiant.filiere ?? 'Informatique'}</strong>
        à l'Institut Polytechnique de Dakar (IPD Thomas Sankara), du <strong>${fmt(stage.dateDebut)}</strong>
        au <strong>${fmt(stage.dateFin)}</strong>.
      </div>
    </div>

  </div>
  </div>

  <!-- SIGNATURES -->
  <div class="footer">
    <div class="footer-sigs">
      <div class="sig-col-qr">
        <img class="qr-img" src="${qrCodeDataUrl}" alt="QR Code">
        <div class="qr-label">Scannez pour vérifier<br>la convention</div>
      </div>
      <div class="sig-col">
        <div class="sig-icon">🏛️</div>
        <div class="sig-label">Cachet &amp; Signature IPD</div>
        <div class="sig-line"></div>
        <div class="sig-name">Institut Polytechnique de Dakar<br>(IPD Thomas Sankara)</div>
      </div>
      <div class="sig-col">
        <div class="sig-icon">👤</div>
        <div class="sig-label">Signature de l'étudiant(e)</div>
        <div class="sig-line"></div>
        <div class="sig-name">${etudiant.prenom} ${etudiant.nom}</div>
      </div>
      <div class="sig-col">
        <div class="sig-icon">📋</div>
        <div class="sig-label">Cachet de l'entreprise</div>
        <div class="sig-line"></div>
        <div class="sig-name">${nomEntreprise}</div>
      </div>
    </div>
  </div>

  <!-- BOTTOM BAR -->
  <div class="bottom-bar">
    <div class="bottom-bar-left">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
      Ensemble pour l'avenir des talents
    </div>
    <div class="bottom-bar-right">IPD Thomas Sankara &bull; Plateforme de gestion des stages</div>
  </div>

</body>
</html>`;

  try {
    await page.setContent(htmlContent, { waitUntil: 'load' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close().catch(() => {});
  }
}