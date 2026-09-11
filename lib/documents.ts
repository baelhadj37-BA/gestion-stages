// Point d'intégration avec le module Génération PDF de Khady (section 3.7 du CDC).
// Cette fonction est un placeholder : à remplacer par son vrai code Puppeteer.
export async function genererPdfConvention(conventionId: number): Promise<string> {
  console.log(`[TODO Khady] Générer le PDF de la convention #${conventionId}`);
  // Retourne une URL factice en attendant la vraie implémentation
  return `/documents/convention-${conventionId}.pdf`;
}