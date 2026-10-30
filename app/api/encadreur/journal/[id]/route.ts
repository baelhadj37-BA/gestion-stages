// app/api/encadreur/journal/[id]/route.ts
// PATCH — Valider ou rejeter un journal

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifierToken } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const tokenData = verifierToken(token || '')

    if (!tokenData || tokenData.role !== 'ENCADREUR') {
      return NextResponse.json(
        { message: 'Accès réservé aux encadreurs' },
        { status: 403 }
      )
    }

    const { id } = await params
    const journalId = parseInt(id)
    if (isNaN(journalId)) {
      return NextResponse.json({ message: 'ID invalide' }, { status: 400 })
    }

    const body = await request.json()
    const { statut, commentaire } = body

    if (!['VALIDE', 'REJETE'].includes(statut)) {
      return NextResponse.json({ message: 'Statut invalide' }, { status: 400 })
    }

    // Vérifier que ce journal appartient bien à un stage de cet encadreur
    const journal = await prisma.journalBord.findFirst({
      where: {
        id: journalId,
        stage: { encadreurId: tokenData.userId },
      },
      include: {
        stage: true,
      },
    })

    if (!journal) {
      return NextResponse.json(
        { message: 'Journal introuvable ou accès non autorisé' },
        { status: 404 }
      )
    }

    const journalMaj = await prisma.journalBord.update({
      where: { id: journalId },
      data: {
        statut,
        commentaire: commentaire ?? null,
        dateValidation: new Date(),
      },
    })

    // Notifier l'étudiant
    const message = statut === 'VALIDE'
      ? `Votre journal de bord (Semaine ${journal.semaine}) a été validé par votre encadreur.`
      : `Votre journal de bord (Semaine ${journal.semaine}) a été rejeté. ${commentaire ? 'Motif : ' + commentaire : ''}`

    await prisma.notification.create({
      data: {
        userId: journal.stage.etudiantId,
        message,
        type: statut === 'VALIDE' ? 'SUCCES' : 'ALERTE',
        lu: false,
      },
    })

    return NextResponse.json({
      message: statut === 'VALIDE' ? 'Journal validé' : 'Journal rejeté',
      journal: journalMaj,
    })
  } catch (error) {
    console.error('Erreur validation journal:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}