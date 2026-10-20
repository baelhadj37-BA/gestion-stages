// app/api/candidatures/[id]/route.ts
// GET   — Détail d'une candidature
// PATCH — Accepter ou refuser une candidature (entreprise uniquement)
//         Accepter crée automatiquement un Stage

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifierToken } from '@/lib/auth'

type Params = { params: { id: string } }

// ─── GET /api/candidatures/[id] ────────────────────────────────
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const tokenData = verifierToken(token || '')
    if (!tokenData) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

    const candidature = await prisma.candidature.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        offre: {
          select: {
            id: true, titre: true, domaine: true, duree: true,
            entreprise: { select: { id: true, nom: true } },
          }
        },
        etudiant: { select: { id: true, nom: true, prenom: true, email: true } },
      }
    })

    if (!candidature) {
      return NextResponse.json({ message: 'Candidature introuvable' }, { status: 404 })
    }

    // Contrôle d'accès
    const estEtudiant    = tokenData.role === 'ETUDIANT' && candidature.etudiantId === tokenData.userId
    const estEntreprise  = tokenData.role === 'ENTREPRISE' && candidature.offre.entreprise.id === tokenData.userId
    const estAdmin       = tokenData.role === 'ADMIN'

    if (!estEtudiant && !estEntreprise && !estAdmin) {
      return NextResponse.json({ message: 'Accès non autorisé' }, { status: 403 })
    }

    return NextResponse.json({ message: 'Candidature récupérée', candidature })

  } catch (error) {
    console.error('Erreur GET /api/candidatures/[id]:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}

// ─── PATCH /api/candidatures/[id] ─────────────────────────────
// Body : { action: 'ACCEPTER' | 'REFUSER', dateDebut?: string, dateFin?: string }
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const tokenData = verifierToken(token || '')
    if (!tokenData) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

    const candidature = await prisma.candidature.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        offre: {
          select: { id: true, titre: true, duree: true, entreprise: { select: { id: true } } }
        }
      }
    })

    if (!candidature) {
      return NextResponse.json({ message: 'Candidature introuvable' }, { status: 404 })
    }

    // Seule l'entreprise propriétaire de l'offre peut décider
    if (
      tokenData.role !== 'ENTREPRISE' ||
      candidature.offre.entreprise.id !== tokenData.userId
    ) {
      return NextResponse.json(
        { message: 'Seule l\'entreprise concernée peut traiter cette candidature' },
        { status: 403 }
      )
    }

    if (candidature.statut !== 'EN_ATTENTE') {
      return NextResponse.json(
        { message: 'Cette candidature a déjà été traitée' },
        { status: 400 }
      )
    }

    const { action, dateDebut, dateFin } = await request.json()

    if (!['ACCEPTER', 'REFUSER'].includes(action)) {
      return NextResponse.json(
        { message: 'Action invalide. Valeurs acceptées : ACCEPTER, REFUSER' },
        { status: 400 }
      )
    }

    if (action === 'REFUSER') {
      const maj = await prisma.candidature.update({
        where: { id: parseInt(params.id) },
        data:  { statut: 'REFUSEE' }
      })
      return NextResponse.json({ message: 'Candidature refusée', candidature: maj })
    }

    // ── ACCEPTER : créer le Stage automatiquement ──
    if (!dateDebut || !dateFin) {
      return NextResponse.json(
        { message: 'dateDebut et dateFin sont obligatoires pour accepter une candidature' },
        { status: 400 }
      )
    }

    const debut = new Date(dateDebut)
    const fin   = new Date(dateFin)

    if (isNaN(debut.getTime()) || isNaN(fin.getTime())) {
      return NextResponse.json({ message: 'Dates invalides' }, { status: 400 })
    }
    if (fin <= debut) {
      return NextResponse.json(
        { message: 'La date de fin doit être après la date de début' },
        { status: 400 }
      )
    }

    // Transaction : mettre à jour la candidature + créer le stage
    const [candidatureMaj, stage] = await prisma.$transaction([
      prisma.candidature.update({
        where: { id: parseInt(params.id) },
        data:  { statut: 'ACCEPTEE' }
      }),
      prisma.stage.create({
        data: {
          etudiantId:    candidature.etudiantId,
          candidatureId: candidature.id,
          dateDebut:     debut,
          dateFin:       fin,
          statut:        'EN_COURS',
        }
      })
    ])

    return NextResponse.json({
      message: 'Candidature acceptée — Stage créé avec succès',
      candidature: candidatureMaj,
      stage,
    }, { status: 201 })

  } catch (error) {
    console.error('Erreur PATCH /api/candidatures/[id]:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}
