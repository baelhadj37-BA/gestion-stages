// app/api/encadreur/journal/route.ts
// GET — Liste de tous les journaux des stagiaires de l'encadreur
// URL : /api/encadreur/journal

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

    const stages = await prisma.stage.findMany({
      where: { encadreurId },
      select: { id: true },
    })
    const stageIds = stages.map(s => s.id)

    const journauxRaw = await prisma.journalBord.findMany({
      where: { stageId: { in: stageIds } },
      orderBy: { dateDepot: 'desc' },
      select: {
        id: true,
        semaine: true,
        contenu: true,
        statut: true,
        commentaire: true,
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

    const journaux = journauxRaw.map(j => ({
      id: j.id,
      semaine: j.semaine,
      contenu: j.contenu,
      statut: j.statut,
      commentaire: j.commentaire,
      createdAt: j.dateDepot.toISOString(),
      etudiant: j.stage.etudiant,
    }))

    return NextResponse.json({ journaux })
  } catch (error) {
    console.error('Erreur journaux encadreur:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}