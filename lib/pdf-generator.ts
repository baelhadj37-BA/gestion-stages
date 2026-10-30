// lib/pdf-generator.ts
import puppeteer from 'puppeteer'
import { genererQrCode } from './qrcode'

export type DonneesConvention = {
  uuid: string
  etudiant: { nom: string; prenom: string; matricule?: string | null; filiere?: string | null; classe?: string | null }
  entreprise: { nom: string; prenom: string; secteur?: string | null }
  encadreur: { nom: string; prenom: string }
  offre: { titre: string; duree: string }
  stage: { dateDebut: Date; dateFin: Date }
  dateValidation: Date
}

export type DonneesAttestation = {
  uuid: string
  etudiant: { nom: string; prenom: string; matricule?: string | null; filiere?: string | null; classe?: string | null }
  entreprise: { nom: string; prenom: string; secteur?: string | null }
  stage: { dateDebut: Date; dateFin: Date; note?: number | null }
  offre: { titre: string }
}

export type DonneesEvaluation = {
  uuid: string
  etudiant: { nom: string; prenom: string; matricule?: string | null }
  encadreur: { nom: string; prenom: string }
  evaluation: { note: number; commentaire?: string | null }
  stage: { dateDebut: Date; dateFin: Date }
}

function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function entete(titre: string, sousTitre: string): string {
  return `
    <div style="text-align:center;border-bottom:2px solid #111;padding-bottom:14px;margin-bottom:24px;">
      <div style="font-family:'Times New Roman',Times,serif;font-size:17pt;font-weight:bold;letter-spacing:0.5px;">Institut Polytechnique de Dakar (IPD)</div>
      <div style="font-family:'Times New Roman',Times,serif;font-size:10pt;color:#444;margin-top:4px;">${sousTitre}</div>
    </div>
    <div style="text-align:center;font-family:'Times New Roman',Times,serif;font-size:15pt;font-weight:bold;text-transform:uppercase;letter-spacing:1px;border-top:1.5px solid #111;border-bottom:1.5px solid #111;padding:10px 0;margin-bottom:28px;">
      ${titre}
    </div>
  `
}

function pied(uuid: string, qrBase64: string): string {
  return `
    <div style="margin-top:50px;display:flex;justify-content:space-between;align-items:flex-end;">
      <div style="text-align:center;min-width:180px;">
        <div style="font-family:'Times New Roman',Times,serif;font-size:10pt;font-weight:bold;margin-bottom:44px;">La Direction des Stages (IPD)</div>
        <div style="border-top:1px solid #111;width:150px;margin:0 auto;"></div>
      </div>
      <div style="text-align:center;">
        <img src="${qrBase64}" width="90" height="90" style="display:block;margin:0 auto;"/>
        <div style="font-family:'Times New Roman',Times,serif;font-size:8pt;color:#666;margin-top:4px;">Réf. ${uuid.substring(0, 13).toUpperCase()}</div>
      </div>
    </div>
  `
}

function ligne(label: string, valeur: string): string {
  return `
    <div style="font-family:'Times New Roman',Times,serif;margin-bottom:10px;font-size:11pt;">
      <strong>${label} :</strong> ${valeur}
    </div>
  `
}

async function htmlVersPDF(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'load' })
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' },
    })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}

export async function genererPDFConvention(donnees: DonneesConvention): Promise<Buffer> {
  const qrBase64 = await genererQrCode(donnees.uuid)
  const annee = new Date().getFullYear()
  const convRef = `STAGE-IPD-${annee}-${donnees.uuid.substring(0, 6).toUpperCase()}`
  const nomEntreprise = `${donnees.entreprise.prenom || ''} ${donnees.entreprise.nom}`.trim()
  const nomEncadreur = `${donnees.encadreur.prenom} ${donnees.encadreur.nom}`
  const nomEtudiant = `${donnees.etudiant.prenom} ${donnees.etudiant.nom}`

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8"/>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Times New Roman',Times,serif; font-size:12pt; color:#111; background:#fff; padding:40px 50px; }
      </style>
    </head>
    <body>
      ${entete('Convention de Stage Professionnel', `Plateforme de Gestion des Stages — Année Académique ${annee}`)}

      <div style="background:#f5f5f5;border:1px solid #ccc;border-radius:6px;padding:14px 18px;margin-bottom:24px;line-height:2;">
        <div style="font-size:11pt;"><strong>Référence :</strong> ${convRef}</div>
        <div style="font-size:11pt;"><strong>Étudiant(e) :</strong> ${nomEtudiant}${donnees.etudiant.classe ? ` (Classe : ${donnees.etudiant.classe})` : ''}</div>
        <div style="font-size:11pt;"><strong>Entreprise d'accueil :</strong> ${nomEntreprise}</div>
        <div style="font-size:11pt;"><strong>Encadreur / Tuteur :</strong> ${nomEncadreur}</div>
      </div>

      <p style="font-size:11pt;margin-bottom:16px;line-height:1.8;">Entre les soussignés :</p>

      <p style="font-size:11pt;margin-bottom:16px;line-height:1.8;">
        <strong>L'Institut Polytechnique de Dakar (IPD)</strong>, représenté par la direction des stages,<br/>
        Et l'entreprise <strong>${nomEntreprise}</strong>${donnees.entreprise.secteur ? ` (secteur : ${donnees.entreprise.secteur})` : ''},<br/>
        Et l'étudiant(e) <strong>${nomEtudiant}</strong>${donnees.etudiant.classe ? `, inscrit(e) en classe de <strong>${donnees.etudiant.classe}</strong>` : ''}.
      </p>

      <p style="font-size:11pt;margin-bottom:16px;line-height:1.8;">
        Il a été convenu ce qui suit : un stage pratique portant sur <strong>« ${donnees.offre.titre} »</strong>,
        d'une durée de <strong>${donnees.offre.duree}</strong>, allant du <strong>${formatDate(donnees.stage.dateDebut)}</strong>
        au <strong>${formatDate(donnees.stage.dateFin)}</strong>, est accordé à l'étudiant(e) afin de mettre
        en pratique ses compétences dans le cadre de sa formation.
      </p>

      <p style="font-size:11pt;margin-bottom:16px;line-height:1.8;">
        L'encadreur pédagogique désigné par l'IPD est <strong>${nomEncadreur}</strong>.
        Chaque partie s'engage à respecter les obligations définies dans le règlement de stage de l'IPD.
      </p>

      <div style="margin-top:50px;display:flex;justify-content:space-between;align-items:flex-end;">
        <div style="text-align:center;min-width:180px;">
          <div style="font-size:10pt;font-weight:bold;margin-bottom:44px;">Cachet et Signature de l'IPD</div>
          <div style="border-top:1px solid #111;width:160px;margin:0 auto;"></div>
        </div>
        <div style="text-align:center;">
          <img src="${qrBase64}" width="90" height="90" style="display:block;margin:0 auto;"/>
          <div style="font-size:8pt;color:#666;margin-top:4px;">Réf. ${convRef}</div>
        </div>
        <div style="text-align:center;min-width:180px;">
          <div style="font-size:10pt;font-weight:bold;margin-bottom:44px;">Cachet et Signature de l'Entreprise</div>
          <div style="border-top:1px solid #111;width:160px;margin:0 auto;"></div>
        </div>
      </div>
    </body>
    </html>
  `

  return htmlVersPDF(html)
}

export async function genererPDFAttestation(donnees: DonneesAttestation): Promise<Buffer> {
  const qrBase64 = await genererQrCode(donnees.uuid)
  const nomEntreprise = `${donnees.entreprise.prenom || ''} ${donnees.entreprise.nom}`.trim()
  const nomEtudiant = `${donnees.etudiant.prenom} ${donnees.etudiant.nom}`

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8"/>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Times New Roman',Times,serif; font-size:12pt; color:#111; background:#fff; padding:40px 50px; }
      </style>
    </head>
    <body>
      ${entete('Attestation de Fin de Stage', 'Direction des Stages et des Relations Entreprises')}

      <p style="font-size:11pt;margin-bottom:18px;line-height:1.9;">
        Nous soussignés, <strong>Institut Polytechnique de Dakar (IPD)</strong>, certifions par la présente que :
      </p>

      <p style="font-size:11pt;margin-bottom:14px;line-height:1.8;">
        <strong>Étudiant(e) :</strong> ${nomEtudiant}${donnees.etudiant.classe ? ` (Classe : ${donnees.etudiant.classe})` : ''}
      </p>

      <p style="font-size:11pt;margin-bottom:18px;line-height:1.9;">
        A accompli avec succès un stage obligatoire au sein de l'entreprise d'accueil <strong>${nomEntreprise}</strong>.
      </p>

      <p style="font-size:11pt;margin-bottom:14px;line-height:1.8;">
        <strong>Poste occupé :</strong> ${donnees.offre.titre}
      </p>

      <p style="font-size:11pt;margin-bottom:28px;line-height:1.8;">
        <strong>Période du stage :</strong> Du ${formatDate(donnees.stage.dateDebut)} au ${formatDate(donnees.stage.dateFin)}
      </p>

      <p style="font-size:11pt;line-height:1.8;">
        Cette attestation lui est délivrée pour servir et valoir ce que de droit, suite à la validation de son rapport de stage et de sa soutenance.
      </p>

      ${pied(donnees.uuid, qrBase64)}
    </body>
    </html>
  `

  return htmlVersPDF(html)
}

export async function genererPDFEvaluation(donnees: DonneesEvaluation): Promise<Buffer> {
  const qrBase64 = await genererQrCode(donnees.uuid)
  const etoiles = '★'.repeat(donnees.evaluation.note) + '☆'.repeat(5 - donnees.evaluation.note)

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8"/>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Times New Roman',Times,serif; font-size:12pt; color:#111; background:#fff; padding:40px 50px; }
      </style>
    </head>
    <body>
      ${entete("Fiche d'Évaluation de Stage", `Générée le ${formatDate(new Date())}`)}

      ${ligne('Étudiant(e)', `${donnees.etudiant.prenom} ${donnees.etudiant.nom}${donnees.etudiant.matricule ? ` — Matricule : ${donnees.etudiant.matricule}` : ''}`)}
      ${ligne('Encadreur pédagogique', `${donnees.encadreur.prenom} ${donnees.encadreur.nom}`)}
      ${ligne('Période du stage', `Du ${formatDate(donnees.stage.dateDebut)} au ${formatDate(donnees.stage.dateFin)}`)}
      ${ligne('Note', `${donnees.evaluation.note} / 5 — ${etoiles}`)}

      ${donnees.evaluation.commentaire ? `
      <div style="margin-top:24px;">
        <p style="font-size:11pt;font-weight:bold;margin-bottom:8px;">Commentaire de l'encadreur :</p>
        <p style="font-size:11pt;line-height:1.8;font-style:italic;">"${donnees.evaluation.commentaire}"</p>
      </div>
      ` : ''}

      ${pied(donnees.uuid, qrBase64)}
    </body>
    </html>
  `

  return htmlVersPDF(html)
}