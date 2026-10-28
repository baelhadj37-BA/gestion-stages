// app/api/conventions/[id]/route.ts
// GET  — détail d'une convention (étudiant)
// PATCH — signer la convention (ETAPE_ETUDIANT → ETAPE_ENTREPRISE)

import { NextRequest, NextResponse } from 'next/server'
import { verifierToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const conventionId = parseInt(id)
    if (isNaN(conventionId)) {
      return NextResponse.json({ message: 'ID invalide' }, { status: 400 })
    }

    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ message: 'Token manquant' }, { status: 401 })

    const utilisateur = verifierToken(token)
    if (!utilisateur || utilisateur.role !== 'ETUDIANT') {
      return NextResponse.json({ message: 'Accès réservé aux étudiants' }, { status: 403 })
    }

    const convention = await prisma.convention.findUnique({
      where: { id: conventionId },
      include: {
        stage: {
          include: {
            encadreur: {
              select: { id: true, nom: true, prenom: true, email: true },
            },
            candidature: {
              include: {
                offre: {
                  include: {
                    entreprise: {
                      select: { id: true, nom: true, prenom: true, secteur: true, email: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!convention) {
      return NextResponse.json({ message: 'Convention introuvable' }, { status: 404 })
    }

    if (convention.stage.etudiantId !== utilisateur.userId) {
      return NextResponse.json({ message: 'Accès non autorisé' }, { status: 403 })
    }

    return NextResponse.json({ convention })
  } catch (error) {
    console.error('[GET /api/conventions/[id]]', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const conventionId = parseInt(id)
    if (isNaN(conventionId)) {
      return NextResponse.json({ message: 'ID invalide' }, { status: 400 })
    }

    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ message: 'Token manquant' }, { status: 401 })

    const utilisateur = verifierToken(token)
    if (!utilisateur || utilisateur.role !== 'ETUDIANT') {
      return NextResponse.json({ message: 'Accès réservé aux étudiants' }, { status: 403 })
    }

    const convention = await prisma.convention.findUnique({
      where: { id: conventionId },
      include: {
        stage: {
          include: {
            candidature: {
              include: {
                offre: { select: { entrepriseId: true, titre: true } },
              },
            },
          },
        },
      },
    })

    if (!convention) {
      return NextResponse.json({ message: 'Convention introuvable' }, { status: 404 })
    }

    if (convention.stage.etudiantId !== utilisateur.userId) {
      return NextResponse.json({ message: 'Accès non autorisé' }, { status: 403 })
    }

    if (convention.statut !== 'ETAPE_ETUDIANT') {
      return NextResponse.json(
        { message: 'La convention ne peut pas être signée à cette étape' },
        { status: 400 }
      )
    }

    // Signer : ETAPE_ETUDIANT → ETAPE_ENTREPRISE
    const updated = await prisma.convention.update({
      where: { id: conventionId },
      data: {
        statut: 'ETAPE_ENTREPRISE',
        dateValidation: new Date(),
      },
    })

    // Notifier l'entreprise
    const { entrepriseId, titre } = convention.stage.candidature.offre
    await prisma.notification.create({
      data: {
        userId: entrepriseId,
        message: `L'étudiant a signé la convention de stage pour "${titre}". À votre tour de signer.`,
        type: 'CONVENTION_SIGNEE_ETUDIANT',
      },
    })

    return NextResponse.json({
      message: "Convention signée. En attente de la signature de l'entreprise.",
      convention: updated,
    })
  } catch (error) {
    console.error('[PATCH /api/conventions/[id]]', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}