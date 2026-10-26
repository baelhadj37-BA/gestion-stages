// app/api/dashboard/encadreur/route.ts
// GET — Données du tableau de bord encadreur
// URL : /api/dashboard/encadreur

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifierToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const tokenData = verifierToken(token || '')

    if (!tokenData || tokenData.role !== 'ENCADREUR') {
      return NextResponse.json(
        { message: 'Accès réservé aux encadreurs' },
        { status: 403 }
      )
    }

    const encadreurId = tokenData.userId

    // Stages dont cet encadreur est responsable
    const stages = await prisma.stage.findMany({
      where: { encadreurId },
      select: { id: true },
    })
    const stageIds = stages.map(s => s.id)
    const totalStagiaires = stages.length

    // Stats journaux
    const [journauxEnAttente, journauxValides, journauxRejetes] = await Promise.all([
      prisma.journalBord.count({ where: { stageId: { in: stageIds }, statut: 'EN_ATTENTE' } }),
      prisma.journalBord.count({ where: { stageId: { in: stageIds }, statut: 'VALIDE' } }),
      prisma.journalBord.count({ where: { stageId: { in: stageIds }, statut: 'REJETE' } }),
    ])

    // 5 journaux les plus récents avec infos étudiant
    const journauxRecentsRaw = await prisma.journalBord.findMany({
      where: { stageId: { in: stageIds } },
      orderBy: { dateDepot: 'desc' },
      take: 5,
      select: {
        id: true,
        semaine: true,
        statut: true,
        dateDepot: true,
        stage: {
          select: {
            etudiant: {
              select: { nom: true, prenom: true, email: true },
            },
          },
        },
      },
    })

    const journauxRecents = journauxRecentsRaw.map(j => ({
      id: j.id,
      semaine: j.semaine,
      statut: j.statut,
      createdAt: j.dateDepot.toISOString(),
      etudiant: j.stage.etudiant,
    }))

    return NextResponse.json({
      stats: { totalStagiaires, journauxEnAttente, journauxValides, journauxRejetes },
      journauxRecents,
    })
  } catch (error) {
    console.error('Erreur dashboard encadreur:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}