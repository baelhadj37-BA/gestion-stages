// lib/matching.ts
// Algorithme de matching automatique
// Calcule un score de correspondance entre le profil d'un étudiant et une offre de stage

// ─────────────────────────────────────────
// FONCTION 1 — Calculer le score
// ─────────────────────────────────────────
export function calculerScore(
  competencesEtudiant: string, // Ex: "React,MySQL,Git,Next.js"
  tagsOffre: string            // Ex: "React,MySQL,Git,Tailwind"
): {
  score: number
  exactes: string[]
  partielles: string[]
  manquantes: string[]
} {
  // Si les données sont vides → score 0
  if (!competencesEtudiant || !tagsOffre) {
    return { score: 0, exactes: [], partielles: [], manquantes: [] }
  }

  // Normaliser — tout en minuscules sans espaces
  // React = react = REACT → traités pareil
  const competences = competencesEtudiant
    .split(',')
    .map(c => c.trim().toLowerCase())
    .filter(c => c.length > 0)

  const tags = tagsOffre
    .split(',')
    .map(t => t.trim().toLowerCase())
    .filter(t => t.length > 0)

  // Correspondances exactes — "react" === "react"
  const exactes = tags.filter(tag =>
    competences.includes(tag)
  )

  // Correspondances partielles — "react" dans "react native"
  const partielles = tags.filter(tag =>
    !exactes.includes(tag) &&
    competences.some(c => c.includes(tag) || tag.includes(c))
  )

  // Compétences manquantes
  const manquantes = tags.filter(tag =>
    !exactes.includes(tag) && !partielles.includes(tag)
  )

  // Score pondéré
  // Exacte = 1 point | Partielle = 0.5 point
  const points = exactes.length + partielles.length * 0.5
  const score = Math.round((points / tags.length) * 100)

  return {
    score: Math.min(score, 100),
    exactes,
    partielles,
    manquantes
  }
}


// FONCTION 2 — Trier les offres par score

export function trierOffresParScore(
  offres: Array<{ id: number; titre: string; tags: string; [key: string]: unknown }>,
  competencesEtudiant: string
) {
  // Calculer le score pour chaque offre
  const offresAvecScore = offres.map(offre => {
    const resultat = calculerScore(competencesEtudiant, offre.tags)
    return {
      ...offre,
      score: resultat.score,
      exactes: resultat.exactes,
      partielles: resultat.partielles,
      manquantes: resultat.manquantes,
      // Badge Recommandé si score > 70%
      recommande: resultat.score >= 70
    }
  })

  // Trier par score décroissant (meilleur en premier)
  return offresAvecScore.sort((a, b) => b.score - a.score)
}