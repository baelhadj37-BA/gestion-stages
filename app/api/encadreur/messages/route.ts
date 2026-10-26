// app/api/encadreur/messages/route.ts
// GET  — Récupérer les messages avec un étudiant
// POST — Envoyer un message à un étudiant

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifierToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const tokenData = verifierToken(token || '')
  if (!tokenData || tokenData.role !== 'ENCADREUR') {
    return NextResponse.json({ message: 'Accès réservé aux encadreurs' }, { status: 403 })
  }

  const avecId = Number(request.nextUrl.searchParams.get('avecId'))
  if (!avecId) {
    return NextResponse.json({ message: 'avecId requis' }, { status: 400 })
  }

  try {
    // Marquer les messages reçus comme lus
    await prisma.message.updateMany({
      where: {
        expediteurId: avecId,
        destinataireId: tokenData.userId,
        lu: false,
      },
      data: { lu: true },
    })

    // Récupérer la conversation (dans les deux sens)
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { expediteurId: tokenData.userId, destinataireId: avecId },
          { expediteurId: avecId, destinataireId: tokenData.userId },
        ],
      },
      include: {
        expediteur: { select: { nom: true, prenom: true, role: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 100, // 100 derniers messages
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Erreur GET messages:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const tokenData = verifierToken(token || '')
  if (!tokenData || tokenData.role !== 'ENCADREUR') {
    return NextResponse.json({ message: 'Accès réservé aux encadreurs' }, { status: 403 })
  }

  try {
    const { destinataireId, contenu } = await request.json()

    if (!destinataireId || !contenu?.trim()) {
      return NextResponse.json({ message: 'destinataireId et contenu requis' }, { status: 400 })
    }

    // Vérifier que le destinataire est bien un stagiaire de cet encadreur
    const stage = await prisma.stage.findFirst({
      where: { etudiantId: destinataireId, encadreurId: tokenData.userId },
    })
    if (!stage) {
      return NextResponse.json({ message: 'Destinataire non autorisé' }, { status: 403 })
    }

    const message = await prisma.message.create({
      data: {
        expediteurId: tokenData.userId,
        destinataireId,
        contenu: contenu.trim(),
        lu: false,
      },
      include: {
        expediteur: { select: { nom: true, prenom: true, role: true } },
      },
    })

    return NextResponse.json({ message: 'Message envoyé', data: message }, { status: 201 })
  } catch (error) {
    console.error('Erreur POST messages:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}