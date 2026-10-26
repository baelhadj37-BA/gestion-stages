// app/api/encadreur/evaluations/route.ts
// GET  — Récupérer l'évaluation d'un stagiaire
// POST — Créer une évaluation
// PUT  — Mettre à jour une évaluation existante

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifierToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const tokenData = verifierToken(token || '')
  if (!tokenData || tokenData.role !== 'ENCADREUR') {
    return NextResponse.json({ message: 'Accès réservé aux encadreurs' }, { status: 403 })
  }

  const stagiaireId = Number(request.nextUrl.searchParams.get('stagiaireId'))
  if (!stagiaireId) {
    return NextResponse.json({ message: 'stagiaireId requis' }, { status: 400 })
  }

  try {
    // Trouver le stage de cet étudiant encadré par cet encadreur
    const stage = await prisma.stage.findFirst({
      where: { etudiantId: stagiaireId, encadreurId: tokenData.userId },
    })
    if (!stage) {
      return NextResponse.json({ evaluation: null })
    }

    const evaluation = await prisma.evaluation.findFirst({
      where: { stageId: stage.id },
    })

    return NextResponse.json({ evaluation: evaluation ?? null })
  } catch (error) {
    console.error('Erreur GET evaluations:', error)
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
    const { stagiaireId, note, commentaire } = await request.json()

    if (!stagiaireId || !note || note < 1 || note > 5) {
      return NextResponse.json({ message: 'Données invalides (note 1-5 requise)' }, { status: 400 })
    }

    const stage = await prisma.stage.findFirst({
      where: { etudiantId: stagiaireId, encadreurId: tokenData.userId },
    })
    if (!stage) {
      return NextResponse.json({ message: 'Stage introuvable' }, { status: 404 })
    }

    // Vérifier si une évaluation existe déjà
    const existante = await prisma.evaluation.findFirst({ where: { stageId: stage.id } })
    if (existante) {
      return NextResponse.json({ message: 'Évaluation déjà existante, utilisez PUT' }, { status: 409 })
    }

    const evaluation = await prisma.evaluation.create({
      data: { stageId: stage.id, note, commentaire: commentaire || '' },
    })

    return NextResponse.json({ message: 'Évaluation créée', evaluation }, { status: 201 })
  } catch (error) {
    console.error('Erreur POST evaluations:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const tokenData = verifierToken(token || '')
  if (!tokenData || tokenData.role !== 'ENCADREUR') {
    return NextResponse.json({ message: 'Accès réservé aux encadreurs' }, { status: 403 })
  }

  try {
    const { stagiaireId, note, commentaire } = await request.json()

    if (!stagiaireId || !note || note < 1 || note > 5) {
      return NextResponse.json({ message: 'Données invalides (note 1-5 requise)' }, { status: 400 })
    }

    const stage = await prisma.stage.findFirst({
      where: { etudiantId: stagiaireId, encadreurId: tokenData.userId },
    })
    if (!stage) {
      return NextResponse.json({ message: 'Stage introuvable' }, { status: 404 })
    }

    const existante = await prisma.evaluation.findFirst({ where: { stageId: stage.id } })
    if (!existante) {
      return NextResponse.json({ message: 'Aucune évaluation à mettre à jour, utilisez POST' }, { status: 404 })
    }

    const evaluation = await prisma.evaluation.update({
      where: { id: existante.id },
      data: { note, commentaire: commentaire || '' },
    })

    return NextResponse.json({ message: 'Évaluation mise à jour', evaluation })
  } catch (error) {
    console.error('Erreur PUT evaluations:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}