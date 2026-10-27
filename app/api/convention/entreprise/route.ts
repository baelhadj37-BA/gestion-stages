// app/api/convention/entreprise/route.ts
// GET — liste toutes les conventions de l'entreprise connectée

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

    const conventions = await prisma.convention.findMany({
      where: {
        stage: {
          candidature: {
            offre: { entrepriseId: utilisateur.userId },
          },
        },
      },
      include: {
        stage: {
          include: {
            etudiant: {
              select: { nom: true, prenom: true, email: true },
            },
            candidature: {
              include: {
                offre: {
                  select: { titre: true, duree: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Reformater pour le frontend
    const result = conventions.map((conv) => ({
      id: conv.id,
      statut: conv.statut,
      createdAt: conv.createdAt.toISOString(),
      etudiant: {
        nom: conv.stage.etudiant.nom,
        prenom: conv.stage.etudiant.prenom,
        email: conv.stage.etudiant.email,
      },
      offre: {
        titre: conv.stage.candidature.offre.titre,
        duree: conv.stage.candidature.offre.duree,
      },
    }))

    return NextResponse.json({ conventions: result, total: result.length })
  } catch (error) {
    console.error('[GET /api/convention/entreprise]', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}