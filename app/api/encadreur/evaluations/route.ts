// app/api/encadreur/evaluations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifierToken } from '@/lib/auth'

function getToken(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  return verifierToken(token || '')
}

export async function GET(request: NextRequest) {
  const tokenData = getToken(request)
  if (!tokenData || tokenData.role !== 'ENCADREUR') {
    return NextResponse.json({ message: 'Accès réservé aux encadreurs' }, { status: 403 })
  }
  const stagiaireId = Number(request.nextUrl.searchParams.get('stagiaireId'))
  if (!stagiaireId) {
    return NextResponse.json({ message: 'stagiaireId requis' }, { status: 400 })
  }
  try {
    const stage = await prisma.stage.findFirst({
      where: { etudiantId: stagiaireId, encadreurId: tokenData.userId },
    })
    if (!stage) return NextResponse.json({ evaluation: null })
    const evaluation = await prisma.evaluation.findFirst({ where: { stageId: stage.id } })
    return NextResponse.json({ evaluation: evaluation ?? null })
  } catch (error) {
    console.error('Erreur GET evaluations encadreur:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const tokenData = getToken(request)
  if (!tokenData || tokenData.role !== 'ENCADREUR') {
    return NextResponse.json({ message: 'Accès réservé aux encadreurs' }, { status: 403 })
  }
  try {
    const { stagiaireId, note, commentaire } = await request.json()
    if (!stagiaireId || note === undefined) {
      return NextResponse.json({ message: 'stagiaireId et note requis' }, { status: 400 })
    }
    if (note < 0 || note > 20) {
      return NextResponse.json({ message: 'La note doit être entre 0 et 20' }, { status: 400 })
    }
    const stage = await prisma.stage.findFirst({
      where: { etudiantId: stagiaireId, encadreurId: tokenData.userId },
    })
    if (!stage) {
      return NextResponse.json({ message: 'Stage introuvable' }, { status: 404 })
    }
    const evaluation = await prisma.evaluation.create({
      data: { stageId: stage.id, note, commentaire: commentaire ?? null },
    })
    // Mettre à jour la note ET passer le statut à TERMINE
    await prisma.stage.update({
      where: { id: stage.id },
      data: { note, statut: 'TERMINE' },
    })
    await prisma.notification.create({
      data: {
        userId: stagiaireId,
        message: `Votre encadreur vous a attribué la note de ${note}/20. Votre stage est maintenant terminé.`,
        type: 'SUCCES',
        lu: false,
      },
    })
    return NextResponse.json({ evaluation }, { status: 201 })
  } catch (error) {
    console.error('Erreur POST evaluations encadreur:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const tokenData = getToken(request)
  if (!tokenData || tokenData.role !== 'ENCADREUR') {
    return NextResponse.json({ message: 'Accès réservé aux encadreurs' }, { status: 403 })
  }
  try {
    const { stagiaireId, note, commentaire } = await request.json()
    if (!stagiaireId || note === undefined) {
      return NextResponse.json({ message: 'stagiaireId et note requis' }, { status: 400 })
    }
    if (note < 0 || note > 20) {
      return NextResponse.json({ message: 'La note doit être entre 0 et 20' }, { status: 400 })
    }
    const stage = await prisma.stage.findFirst({
      where: { etudiantId: stagiaireId, encadreurId: tokenData.userId },
    })
    if (!stage) {
      return NextResponse.json({ message: 'Stage introuvable' }, { status: 404 })
    }
    const evaluation = await prisma.evaluation.update({
      where: { stageId: stage.id },
      data: { note, commentaire: commentaire ?? null },
    })
    // Mettre à jour la note ET garder le statut TERMINE
    await prisma.stage.update({
      where: { id: stage.id },
      data: { note, statut: 'TERMINE' },
    })
    return NextResponse.json({ evaluation })
  } catch (error) {
    console.error('Erreur PUT evaluations encadreur:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}