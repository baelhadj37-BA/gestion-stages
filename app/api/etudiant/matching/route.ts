// app/api/etudiant/matching/route.ts
// GET — retourne les offres PUBLIEES avec score de matching pour l'étudiant connecté

import { NextRequest, NextResponse } from 'next/server'
import { verifierToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function calculerScore(competencesEtudiant: string[], tagsOffre: string[]): number {
  if (tagsOffre.length === 0) return 0
  const etudiantSet = new Set(competencesEtudiant.map(c => c.toLowerCase().trim()))
  const communes = tagsOffre.filter(t => etudiantSet.has(t.toLowerCase().trim()))
  return Math.round((communes.length / tagsOffre.length) * 100)
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ message: 'Token manquant' }, { status: 401 })

    const utilisateur = verifierToken(token)
    if (!utilisateur || utilisateur.role !== 'ETUDIANT') {
      return NextResponse.json({ message: 'Accès non autorisé' }, { status: 403 })
    }

    const etudiant = await prisma.user.findUnique({
      where: { id: utilisateur.userId },
      select: { competences: true },
    })

    const competencesEtudiant: string[] = etudiant?.competences
      ? etudiant.competences.split(',').map(c => c.trim()).filter(Boolean)
      : []

    const offres = await prisma.offre.findMany({
      where: { statut: 'PUBLIEE' },
      include: {
        entreprise: { select: { id: true, nom: true, prenom: true, secteur: true } },
        candidatures: { where: { etudiantId: utilisateur.userId }, select: { id: true, statut: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const offresAvecScore = offres.map(offre => {
      const tagsOffre: string[] = offre.tags
        ? offre.tags.split(',').map(t => t.trim()).filter(Boolean)
        : []
      const score = calculerScore(competencesEtudiant, tagsOffre)
      const dejaPostule = offre.candidatures.length > 0
      return {
        id: offre.id,
        titre: offre.titre,
        description: offre.description,
        duree: offre.duree,
        localisation: offre.localisation,
        tags: tagsOffre,
        createdAt: offre.createdAt,
        entreprise: offre.entreprise,
        score,
        recommande: score >= 70,
        dejaPostule,
        candidatureStatut: dejaPostule ? offre.candidatures[0].statut : null,
      }
    })

    // Trier par score décroissant
    offresAvecScore.sort((a, b) => b.score - a.score)

    return NextResponse.json({ data: offresAvecScore })
  } catch (error) {
    console.error('[GET /api/etudiant/matching]', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}