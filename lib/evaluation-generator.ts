// lib/evaluation-generator.ts
// Génère le PDF de la fiche d'évaluation du stagiaire (remplie par l'encadreur)

import puppeteer from 'puppeteer'

interface DonneesEvaluation {
  documentId: string
  qrCodeDataUrl: string
  etudiant: { nom: string; prenom: string; classe: string | null; filiere: string | null }
  encadreur: { nom: string; prenom: string } | null
  offre: { titre: string; duree: string }
  entreprise: { nom: string; prenom: string }
  stage: { dateDebut: Date; dateFin: Date }
  evaluation: { note: number; commentaire: string | null }
}

const formatDate = (d: Date) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

// Convertit une note /5 en étoiles texte
const etoiles = (n: number) => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n))

// Convertit note /5 en note /20
const sur20 = (n: number) => (n * 4).toFixed(2)

// Appréciation selon la note
const appreciation = (n: number) => {
  if (n >= 5) return { texte: 'Excellent', couleur: '#15803d' }
  if (n >= 4) return { texte: 'Très bien', couleur: '#1d6fe8' }
  if (n >= 3) return { texte: 'Bien', couleur: '#7c3aed' }
  if (n >= 2) return { texte: 'Assez bien', couleur: '#d97706' }
  return { texte: 'Insuffisant', couleur: '#b91c1c' }
}

export async function generateEvaluationPDF(donnees: DonneesEvaluation): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const page = await browser.newPage()
  const appre = appreciation(donnees.evaluation.note)

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
        .entete h1 {
          font-size: 15px;
          color: #0b2f7a;
          font-weight: 800;
          text-transform: uppercase;
        }
        .entete p { font-size: 11px; color: #6b7a99; margin-top: 2px; }
        .ref { font-size: 10px; color: #6b7a99; text-align: right; }

        .titre-doc {
          text-align: center;
          margin: 28px 0 32px;
        }
        .titre-doc h2 {
          font-size: 24px;
          font-weight: 800;
          color: #0b2f7a;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .titre-doc .sous-titre {
          font-size: 12px;
          color: #6b7a99;
          margin-top: 6px;
        }

        .tableau {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
          font-size: 13px;
        }
        .tableau td {
          padding: 9px 14px;
          border: 1px solid #dde4f0;
        }
        .tableau td:first-child {
          background: #f0f4fc;
          font-weight: 700;
          color: #0b2f7a;
          width: 40%;
        }

        .section-titre {
          font-size: 13px;
          font-weight: 800;
          color: #0b2f7a;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 24px 0 12px;
          padding-bottom: 6px;
          border-bottom: 2px solid #eef2fa;
        }

        .note-globale {
          display: flex;
          align-items: center;
          gap: 24px;
          background: #f0f4fc;
          border-radius: 10px;
          padding: 20px 24px;
          margin-bottom: 20px;
        }
        .note-chiffre {
          font-size: 42px;
          font-weight: 900;
          color: #0b2f7a;
          line-height: 1;
        }
        .note-detail { flex: 1; }
        .note-sur20 { font-size: 16px; color: #6b7a99; }
        .note-etoiles { font-size: 22px; color: #f59e0b; letter-spacing: 2px; margin: 4px 0; }
        .note-appre {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          background: ${appre.couleur};
        }

        .commentaire-bloc {
          background: #fffbf0;
          border: 1px solid #fde68a;
          border-left: 4px solid #f59e0b;
          border-radius: 6px;
          padding: 16px 20px;
          font-size: 13px;
          line-height: 1.7;
          color: #444;
          margin-bottom: 24px;
          min-height: 80px;
        }

        .pied {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 40px;
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
        .qr-label { font-size: 9px; color: #6b7a99; margin-top: 4px; }
      </style>
    </head>
    <body>

      <div class="entete">
        <div>
          <h1>Institut Polytechnique de Dakar</h1>
          <p>Thomas Sankara — Plateforme de Gestion des Stages</p>
        </div>
        <div class="ref">
          <div>Réf : EVAL-${donnees.documentId.substring(0, 8).toUpperCase()}</div>
          <div>Date : ${formatDate(new Date())}</div>
        </div>
      </div>

      <div class="titre-doc">
        <h2>Fiche d'Évaluation du Stagiaire</h2>
        <div class="sous-titre">Établie par l'encadreur académique — IPD Thomas Sankara</div>
      </div>

      <div class="section-titre">Informations du stage</div>
      <table class="tableau">
        <tr>
          <td>Étudiant(e)</td>
          <td><strong>${donnees.etudiant.prenom} ${donnees.etudiant.nom}</strong></td>
        </tr>
        <tr>
          <td>Classe / Filière</td>
          <td>${donnees.etudiant.classe ?? '—'} ${donnees.etudiant.filiere ? `· ${donnees.etudiant.filiere}` : ''}</td>
        </tr>
        <tr>
          <td>Encadreur académique</td>
          <td>${donnees.encadreur ? `${donnees.encadreur.prenom} ${donnees.encadreur.nom}` : 'À assigner'}</td>
        </tr>
        <tr>
          <td>Poste de stage</td>
          <td>${donnees.offre.titre}</td>
        </tr>
        <tr>
          <td>Entreprise</td>
          <td>${donnees.entreprise.prenom} ${donnees.entreprise.nom}</td>
        </tr>
        <tr>
          <td>Période</td>
          <td>Du ${formatDate(donnees.stage.dateDebut)} au ${formatDate(donnees.stage.dateFin)}</td>
        </tr>
        <tr>
          <td>Durée</td>
          <td>${donnees.offre.duree}</td>
        </tr>
      </table>

      <div class="section-titre">Évaluation globale</div>

      <div class="note-globale">
        <div class="note-chiffre">${donnees.evaluation.note}<span style="font-size:20px;color:#6b7a99;">/5</span></div>
        <div class="note-detail">
          <div class="note-etoiles">${etoiles(donnees.evaluation.note)}</div>
          <div class="note-sur20">Soit <strong>${sur20(donnees.evaluation.note)} / 20</strong></div>
          <div style="margin-top:8px;"><span class="note-appre">${appre.texte}</span></div>
        </div>
      </div>

      <div class="section-titre">Commentaire de l'encadreur</div>
      <div class="commentaire-bloc">
        ${donnees.evaluation.commentaire ?? '<em style="color:#aaa;">Aucun commentaire renseigné.</em>'}
      </div>

      <div class="pied">
        <div class="signature">
          <div>Signature de l'encadreur</div>
          <div style="font-size:11px;color:#6b7a99;margin-top:4px;">${donnees.encadreur ? `${donnees.encadreur.prenom} ${donnees.encadreur.nom}` : 'À assigner'}</div>
          <div class="ligne"></div>
        </div>
        <div class="signature">
          <div>Cachet de l'IPD</div>
          <div class="ligne"></div>
        </div>
        <div class="qr-bloc">
          <img src="${donnees.qrCodeDataUrl}" alt="QR Code" />
          <div class="qr-label">Scannez pour vérifier<br />l'authenticité</div>
        </div>
      </div>

    </body>
    </html>
  `

  await page.setContent(htmlContent, { waitUntil: 'load' })
  const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true })
  await browser.close()

  return Buffer.from(pdfBuffer)
}