// app/api/conventions/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { verifierToken } from '@/lib/auth'
import prisma from '@/lib/prisma'

/* ── GET /api/conventions ──────────────────────────────────────────
   - ETUDIANT   : ses propres conventions (via stage → candidature)
   - ENTREPRISE : conventions liées à ses offres
   - ENCADREUR  : conventions où il est encadreur
   - ADMIN      : toutes les conventions
──────────────────────────────────────────────────────────────────── */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ message: 'Token manquant' }, { status: 401 })
    }

    const utilisateur = verifierToken(token)
    if (!utilisateur) {
      return NextResponse.json({ message: 'Token invalide' }, { status: 401 })
    }

    let conventions

    const includeBase = {
      stage: {
        include: {
         
          candidature: {
            include: {
              offre: {
                include: {
                  entreprise: { select: { id: true, nom: true, prenom: true, secteur: true } },
                },
              },
              etudiant: {
                select: { id: true, nom: true, prenom: true, email: true, filiere: true, classe: true },
              },
            },
          },
        },
      },
    }

    if (utilisateur.role === 'ETUDIANT') {
      conventions = await prisma.convention.findMany({
        where: { stage: { candidature: { etudiantId: utilisateur.userId } } },
        include: includeBase,
        orderBy: { createdAt: 'desc' },
      })
    } else if (utilisateur.role === 'ENTREPRISE') {
      conventions = await prisma.convention.findMany({
        where: { stage: { candidature: { offre: { entrepriseId: utilisateur.userId } } } },
        include: includeBase,
        orderBy: { createdAt: 'desc' },
      })
    } else if (utilisateur.role === 'ENCADREUR') {
      conventions = await prisma.convention.findMany({
        where: { stage: { encadreurId: utilisateur.userId } },
        include: includeBase,
        orderBy: { createdAt: 'desc' },
      })
    } else if (utilisateur.role === 'ADMIN') {
      conventions = await prisma.convention.findMany({
        include: includeBase,
        orderBy: { createdAt: 'desc' },
      })
    } else {
      return NextResponse.json({ message: 'Accès non autorisé' }, { status: 403 })
    }

    return NextResponse.json({ data: conventions }, { status: 200 })
  } catch (error) {
    console.error('[GET /api/conventions]', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}

/* ── POST /api/conventions ─────────────────────────────────────────
   ADMIN seulement — crée une convention pour un stage existant
   Body: { stageId, encadreurId, dateSignature? }
──────────────────────────────────────────────────────────────────── */
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ message: 'Token manquant' }, { status: 401 })
    }

    const utilisateur = verifierToken(token)
    if (!utilisateur) {
      return NextResponse.json({ message: 'Token invalide' }, { status: 401 })
    }

    if (utilisateur.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Réservé à l\'administrateur' }, { status: 403 })
    }

    const body = await request.json()
    const { stageId } = body

    if (!stageId) {
      return NextResponse.json({ message: 'stageId est obligatoire' }, { status: 400 })
    }

    // Vérifier que le stage existe
    const stage = await prisma.stage.findUnique({ where: { id: Number(stageId) } })
    if (!stage) {
      return NextResponse.json({ message: 'Stage introuvable' }, { status: 404 })
    }

    // Vérifier qu'une convention n'existe pas déjà pour ce stage
    const existe = await prisma.convention.findFirst({ where: { stageId: Number(stageId) } })
    if (existe) {
      return NextResponse.json({ message: 'Une convention existe déjà pour ce stage' }, { status: 409 })
    }

    const convention = await prisma.convention.create({
      data: {
        stageId: Number(stageId),
        statut: 'ETAPE_ETUDIANT',
      },
      include: { stage: true },
    })

    return NextResponse.json(
      { message: 'Convention créée avec succès', data: convention },
      { status: 201 }
    )
  } catch (error) {
    console.error('[POST /api/conventions]', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}