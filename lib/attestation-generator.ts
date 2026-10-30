// lib/attestation-generator.ts
// Génère le PDF d'attestation de fin de stage avec QR Code

import puppeteer from 'puppeteer'

interface DonneesAttestation {
  documentId: string
  qrCodeDataUrl: string
  etudiant: { nom: string; prenom: string; classe: string | null; filiere: string | null }
  encadreur: { nom: string; prenom: string } | null
  offre: { titre: string; duree: string; localisation: string }
  entreprise: { nom: string; prenom: string }
  stage: { dateDebut: Date; dateFin: Date; note: number | null }
}

const formatDate = (d: Date) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

export async function generateAttestationPDF(donnees: DonneesAttestation): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()

    const noteAffichee = donnees.stage.note !== null
      ? `${donnees.stage.note.toFixed(2)} / 20`
      : 'Non encore évaluée'

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            color: #1a1a2e;
            padding: 50px 60px;
            background: #fff;
          }
          .entete {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 3px solid #0b2f7a;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .entete-gauche h1 {
            font-size: 15px;
            color: #0b2f7a;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .entete-gauche p {
            font-size: 11px;
            color: #6b7a99;
            margin-top: 2px;
          }
          .ref {
            font-size: 10px;
            color: #6b7a99;
            text-align: right;
          }
          .titre-doc {
            text-align: center;
            margin: 30px 0 36px;
          }
          .titre-doc h2 {
            font-size: 26px;
            font-weight: 800;
            color: #0b2f7a;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .titre-doc .sous-titre {
            font-size: 13px;
            color: #6b7a99;
            margin-top: 6px;
          }
          .corps {
            font-size: 14px;
            line-height: 2;
            color: #222;
            margin-bottom: 30px;
          }
          .corps strong { color: #0b2f7a; }
          .tableau {
            width: 100%;
            border-collapse: collapse;
            margin: 24px 0;
            font-size: 13px;
          }
          .tableau td {
            padding: 10px 14px;
            border: 1px solid #dde4f0;
          }
          .tableau td:first-child {
            background: #f0f4fc;
            font-weight: 700;
            color: #0b2f7a;
            width: 40%;
          }
          .note-bloc {
            background: #f0f4fc;
            border-left: 4px solid #1d6fe8;
            border-radius: 6px;
            padding: 16px 20px;
            margin: 24px 0;
            font-size: 14px;
          }
          .note-bloc .note-val {
            font-size: 22px;
            font-weight: 800;
            color: #0b2f7a;
          }
          .pied {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 50px;
          }
          .signature {
            text-align: center;
            font-size: 13px;
            font-weight: 700;
            color: #0b2f7a;
          }
          .signature .ligne {
            margin-top: 40px;
            border-top: 1px solid #0b2f7a;
            width: 160px;
            margin-left: auto;
            margin-right: auto;
          }
          .qr-bloc {
            text-align: center;
            border: 1px dashed #1d6fe8;
            border-radius: 8px;
            padding: 10px 14px;
            background: #f8fbff;
          }
          .qr-bloc img { width: 90px; height: 90px; }
          .qr-label {
            font-size: 9px;
            color: #6b7a99;
            margin-top: 4px;
          }
          .separateur {
            border: none;
            border-top: 1px solid #eef2fa;
            margin: 28px 0;
          }
        </style>
      </head>
      <body>
        <div class="entete">
          <div class="entete-gauche">
            <h1>Institut Polytechnique de Dakar</h1>
            <p>Thomas Sankara — Plateforme de Gestion des Stages</p>
          </div>
          <div class="ref">
            <div>Réf : ATT-${donnees.documentId.substring(0, 8).toUpperCase()}</div>
            <div>Date : ${formatDate(new Date())}</div>
          </div>
        </div>

        <div class="titre-doc">
          <h2>Attestation de Fin de Stage</h2>
          <div class="sous-titre">Document officiel délivré par l'IPD Thomas Sankara</div>
        </div>

        <div class="corps">
          <p>
            Nous soussignés, l'<strong>Institut Polytechnique de Dakar Thomas Sankara</strong>,
            attestons par la présente que l'étudiant(e) :
          </p>
        </div>

        <table class="tableau">
          <tr>
            <td>Nom complet</td>
            <td><strong>${donnees.etudiant.prenom} ${donnees.etudiant.nom}</strong></td>
          </tr>
          <tr>
            <td>Classe / Filière</td>
            <td>${donnees.etudiant.classe ?? '—'} ${donnees.etudiant.filiere ? `· ${donnees.etudiant.filiere}` : ''}</td>
          </tr>
          <tr>
            <td>A effectué un stage</td>
            <td><strong>${donnees.offre.titre}</strong></td>
          </tr>
          <tr>
            <td>Entreprise d'accueil</td>
            <td>${donnees.entreprise.prenom} ${donnees.entreprise.nom}</td>
          </tr>
          <tr>
            <td>Lieu</td>
            <td>${donnees.offre.localisation}</td>
          </tr>
          <tr>
            <td>Durée</td>
            <td>${donnees.offre.duree}</td>
          </tr>
          <tr>
            <td>Période</td>
            <td>Du ${formatDate(donnees.stage.dateDebut)} au ${formatDate(donnees.stage.dateFin)}</td>
          </tr>
          <tr>
            <td>Encadreur académique</td>
            <td>${donnees.encadreur ? `${donnees.encadreur.prenom} ${donnees.encadreur.nom}` : 'À assigner'}</td>
          </tr>
        </table>

        <div class="note-bloc">
          <div style="font-size:12px; color:#6b7a99; margin-bottom:4px;">Note finale obtenue</div>
          <div class="note-val">${noteAffichee}</div>
        </div>

        <hr class="separateur" />

        <div class="corps" style="font-size:13px; color:#444;">
          Cette attestation est délivrée pour servir et valoir ce que de droit.
        </div>

        <div class="pied">
          <div class="signature">
            <div>Le Directeur de l'IPD</div>
            <div class="ligne"></div>
          </div>
          <div class="signature">
            <div>Cachet de l'établissement</div>
            <div class="ligne"></div>
          </div>
          <div class="qr-bloc">
            <img src="${donnees.qrCodeDataUrl}" alt="QR Code de vérification" />
            <div class="qr-label">Scannez pour vérifier<br />l'authenticité du document</div>
          </div>
        </div>
      </body>
      </html>
    `

    await page.setContent(htmlContent, { waitUntil: 'load' })
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true })

    return Buffer.from(pdfBuffer)
  } finally {
    await browser.close()
  }
}