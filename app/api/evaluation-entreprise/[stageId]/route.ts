import { NextRequest, NextResponse } from 'next/server'
import { verifierToken } from '@/lib/auth'
import prisma from '@/lib/prisma'

type Params = { params: Promise<{ stageId: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { stageId: stageIdStr } = await params
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ message: 'Token manquant' }, { status: 401 })
    const utilisateur = verifierToken(token)
    if (!utilisateur) return NextResponse.json({ message: 'Token invalide' }, { status: 401 })
    const stageId = Number(stageIdStr)
    if (isNaN(stageId)) return NextResponse.json({ message: 'ID invalide' }, { status: 400 })
    const evaluation = await prisma.evaluationEntreprise.findUnique({ where: { stageId } })
    return NextResponse.json({ data: evaluation }, { status: 200 })
  } catch (error) {
    console.error('[GET /api/evaluation-entreprise/[stageId]]', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { stageId: stageIdStr } = await params
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ message: 'Token manquant' }, { status: 401 })
    const utilisateur = verifierToken(token)
    if (!utilisateur) return NextResponse.json({ message: 'Token invalide' }, { status: 401 })
    if (utilisateur.role !== 'ENTREPRISE') {
      return NextResponse.json({ message: 'Réservé aux entreprises' }, { status: 403 })
    }
    const stageId = Number(stageIdStr)
    if (isNaN(stageId)) return NextResponse.json({ message: 'ID invalide' }, { status: 400 })

    const stage = await prisma.stage.findUnique({
      where: { id: stageId },
      include: {
        candidature: {
          include: {
            offre: { select: { entrepriseId: true } },
          },
        },
      },
    })
    if (!stage) return NextResponse.json({ message: 'Stage introuvable' }, { status: 404 })
    if (stage.candidature.offre.entrepriseId !== utilisateur.userId) {
      return NextResponse.json({ message: 'Accès non autorisé' }, { status: 403 })
    }
    if (stage.statut !== 'TERMINE') {
      return NextResponse.json({ message: 'Le stage doit être terminé' }, { status: 400 })
    }

    const body = await request.json()
    const { note, commentaire, attestation } = body
    if (note === undefined || note < 0 || note > 20) {
      return NextResponse.json({ message: 'Note invalide (0-20)' }, { status: 400 })
    }

    // Récupérer l'évaluation existante
    const evalExistante = await prisma.evaluationEntreprise.findUnique({ where: { stageId } })
    const attestationNouvelleSignature = (attestation === true) && (evalExistante?.attestation !== true)

    const evaluation = await prisma.evaluationEntreprise.upsert({
      where: { stageId },
      update: { note, commentaire: commentaire ?? null, attestation: attestation ?? false },
      create: { stageId, note, commentaire: commentaire ?? null, attestation: attestation ?? false },
    })

    // Notification de note (seulement à la première évaluation)
    if (!evalExistante) {
      await prisma.notification.create({
        data: {
          userId: stage.etudiantId,
          message: `Votre entreprise vous a attribué une note de ${note}/20 pour votre stage.`,
          type: 'EVALUATION_ENTREPRISE',
        },
      })
    }

    // Notification attestation (seulement quand elle passe de false → true)
    if (attestationNouvelleSignature) {
      await prisma.notification.create({
        data: {
          userId: stage.etudiantId,
          message: `🎓 Votre attestation de fin de stage a été signée par votre entreprise. Elle est maintenant disponible.`,
          type: 'ATTESTATION_DISPONIBLE',
        },
      })
    }

    return NextResponse.json({ message: 'Évaluation enregistrée', data: evaluation }, { status: 200 })
  } catch (error) {
    console.error('[POST /api/evaluation-entreprise/[stageId]]', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}