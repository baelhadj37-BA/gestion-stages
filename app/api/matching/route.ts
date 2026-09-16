import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { trierOffresParScore } from '@/lib/matching'
import { verifierToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // 1. Récupérer le token depuis les headers
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    // 2. Vérifier le token
    if (!token) {
      return NextResponse.json(
        { message: 'Token manquant' },
        { status: 401 }
      )
    }

    const tokenData = verifierToken(token)

    if (!tokenData) {
      return NextResponse.json(
        { message: 'Token invalide' },
        { status: 401 }
      )
    }

    // 3. Vérifier que c'est bien un étudiant
    if (tokenData.role !== 'ETUDIANT') {
      return NextResponse.json(
        { message: 'Accès réservé aux étudiants' },
        { status: 403 }
      )
    }

    // 4. Récupérer le profil de l'étudiant
    const etudiant = await prisma.user.findUnique({
      where: { id: tokenData.userId },
      select: {
        id: true,
        nom: true,
        prenom: true,
        competences: true
      }
    })

    if (!etudiant) {
      return NextResponse.json(
        { message: 'Étudiant introuvable' },
        { status: 404 }
      )
    }

    // 5. Récupérer toutes les offres publiées
    const offres = await prisma.offre.findMany({
      where: { statut: 'PUBLIEE' },
      select: {
        id: true,
        titre: true,
        description: true,
        duree: true,
        localisation: true,
        tags: true,
        entreprise: {
          select: {
            nom: true,
            secteur: true
          }
        }
      }
    })

    // 6. Si pas de compétences renseignées
    if (!etudiant.competences) {
      return NextResponse.json({
        message: 'Renseignez vos compétences pour obtenir des suggestions personnalisées',
        competencesManquantes: true,
        offres: offres.map(o => ({ ...o, score: 0, recommande: false }))
      })
    }

    // 7. Calculer les scores et trier
    const offresTriees = trierOffresParScore(offres, etudiant.competences)

    // 8. Retourner le résultat
    return NextResponse.json({
      message: 'Offres récupérées avec succès',
      etudiant: {
        nom: etudiant.nom,
        competences: etudiant.competences
      },
      totalOffres: offresTriees.length,
      offresRecommandees: offresTriees.filter(o => o.recommande).length,
      offres: offresTriees
    })

  } catch (error) {
    console.error('Erreur matching:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}