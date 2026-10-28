// app/api/entreprise/candidatures/route.ts
// GET   — liste les candidatures reçues pour les offres de l'entreprise
// PATCH — accepter ou refuser une candidature

import { NextRequest, NextResponse } from 'next/server'
import { verifierToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ message: 'Token manquant' }, { status: 401 })
    const utilisateur = verifierToken(token)
    if (!utilisateur || utilisateur.role !== 'ENTREPRISE') {
      return NextResponse.json({ message: 'Accès réservé aux entreprises' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const statut = searchParams.get('statut')
    const offreId = searchParams.get('offreId')

    const candidatures = await prisma.candidature.findMany({
      where: {
        offre: { entrepriseId: utilisateur.userId },
        ...(statut && { statut: statut as 'EN_ATTENTE' | 'ACCEPTEE' | 'REFUSEE' }),
        ...(offreId && { offreId: parseInt(offreId) }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        etudiant: {
          select: {
            nom: true,
            prenom: true,
            email: true,
            telephone: true,
            filiere: true,
            classe: true,
            competences: true,
          },
        },
        offre: { select: { id: true, titre: true, duree: true } },
      },
    })

    return NextResponse.json({ candidatures })
  } catch (error) {
    console.error('[GET /api/entreprise/candidatures]', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ message: 'Token manquant' }, { status: 401 })
    const utilisateur = verifierToken(token)
    if (!utilisateur || utilisateur.role !== 'ENTREPRISE') {
      return NextResponse.json({ message: 'Accès réservé aux entreprises' }, { status: 403 })
    }

    const body = await request.json()
    const { candidatureId, statut } = body

    if (!candidatureId || !statut) {
      return NextResponse.json({ message: 'candidatureId et statut sont requis' }, { status: 400 })
    }
    if (!['ACCEPTEE', 'REFUSEE'].includes(statut)) {
      return NextResponse.json({ message: 'Statut invalide' }, { status: 400 })
    }

    const candidature = await prisma.candidature.findUnique({
      where: { id: candidatureId },
      include: { offre: { select: { entrepriseId: true, duree: true } } },
    })

    if (!candidature) {
      return NextResponse.json({ message: 'Candidature introuvable' }, { status: 404 })
    }
    if (candidature.offre.entrepriseId !== utilisateur.userId) {
      return NextResponse.json({ message: 'Accès non autorisé' }, { status: 403 })
    }

    const updated = await prisma.candidature.update({
      where: { id: candidatureId },
      data: { statut },
    })

    // Créer automatiquement le Stage + Convention quand la candidature est acceptée
    if (statut === 'ACCEPTEE') {
      const stageExistant = await prisma.stage.findUnique({
        where: { candidatureId },
      })

      if (!stageExistant) {
        const dateDebut = new Date()
        const dateFin = new Date()
        const moisMatch = candidature.offre.duree?.match(/(\d+)/)
        const nbMois = moisMatch ? parseInt(moisMatch[1]) : 3
        dateFin.setMonth(dateFin.getMonth() + nbMois)

        const stage = await prisma.stage.create({
          data: {
            etudiantId: candidature.etudiantId,
            candidatureId,
            dateDebut,
            dateFin,
            statut: 'EN_COURS',
          },
        })

        await prisma.convention.create({
          data: {
            stageId: stage.id,
            statut: 'ETAPE_ETUDIANT',
          },
        })
      }
    }

    return NextResponse.json({
      message: statut === 'ACCEPTEE' ? 'Candidature acceptée' : 'Candidature refusée',
      candidature: updated,
    })
  } catch (error) {
    console.error('[PATCH /api/entreprise/candidatures]', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}