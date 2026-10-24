// app/api/entreprise/stats/route.ts
// GET — Stats du dashboard entreprise (offres, candidatures, etc.)

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifierToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const tokenData = verifierToken(token || '')

    if (!tokenData || tokenData.role !== 'ENTREPRISE') {
      return NextResponse.json({ message: 'Accès réservé aux entreprises' }, { status: 403 })
    }

    const entrepriseId = Number(tokenData.userId)

    // Offres de l'entreprise
    const offres = await prisma.offre.findMany({
      where: { entrepriseId },
      include: {
        candidatures: { select: { id: true, statut: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    const offresPubliees  = offres.filter(o => o.statut === 'PUBLIEE').length
    const offresEnAttente = offres.filter(o => o.statut === 'EN_ATTENTE').length

    // Total candidatures reçues sur toutes les offres de l'entreprise
    const totalCandidatures = offres.reduce((sum, o) => sum + o.candidatures.length, 0)
    const candidaturesEnAttente = offres.reduce(
      (sum, o) => sum + o.candidatures.filter(c => c.statut === 'EN_ATTENTE').length, 0
    )

    // Offres récentes (5 dernières) avec comptage candidatures
    const offresRecentes = offres.slice(0, 5).map(o => ({
      id: o.id,
      titre: o.titre,
      statut: o.statut,
      duree: o.duree,
      localisation: o.localisation,
      createdAt: o.createdAt,
      nbCandidatures: o.candidatures.length,
    }))

    return NextResponse.json({
      stats: {
        offresPubliees,
        offresEnAttente,
        totalCandidatures,
        candidaturesEnAttente,
      },
      offresRecentes,
    })

  } catch (error) {
    console.error('Erreur stats entreprise:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}