// app/api/offres/[id]/route.ts
// GET    — Détail d'une offre
// PATCH  — Modifier une offre (entreprise propriétaire ou admin)
// DELETE — Supprimer une offre (entreprise propriétaire ou admin)

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifierToken } from '@/lib/auth'

type Params = { params: { id: string } }

// ─── GET /api/offres/[id] ──────────────────────────────────────
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const tokenData = verifierToken(token || '')
    if (!tokenData) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

    const offre = await prisma.offre.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        entreprise: { select: { id: true, nom: true } },
        _count:     { select: { candidatures: true } }
      }
    })

    if (!offre) {
      return NextResponse.json({ message: 'Offre introuvable' }, { status: 404 })
    }

    // Étudiant : ne peut voir que les offres publiées
    if (tokenData.role === 'ETUDIANT' && offre.statut !== 'PUBLIEE') {
      return NextResponse.json({ message: 'Offre non disponible' }, { status: 403 })
    }

    return NextResponse.json({ message: 'Offre récupérée', offre })

  } catch (error) {
    console.error('Erreur GET /api/offres/[id]:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}

// ─── PATCH /api/offres/[id] ────────────────────────────────────
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const tokenData = verifierToken(token || '')
    if (!tokenData) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

    const offre = await prisma.offre.findUnique({ where: { id: parseInt(params.id) } })
    if (!offre) return NextResponse.json({ message: 'Offre introuvable' }, { status: 404 })

    // Seule l'entreprise propriétaire ou l'admin peut modifier
    const estProprietaire = tokenData.role === 'ENTREPRISE' && offre.entrepriseId === tokenData.userId
    const estAdmin        = tokenData.role === 'ADMIN'

    if (!estProprietaire && !estAdmin) {
      return NextResponse.json({ message: 'Non autorisé à modifier cette offre' }, { status: 403 })
    }

    const body = await request.json()
    const { titre, description, domaine, duree, competences, remuneration, statut } = body

    // L'entreprise ne peut pas changer le statut elle-même (c'est l'admin)
    if (tokenData.role === 'ENTREPRISE' && statut) {
      return NextResponse.json(
        { message: 'Seul l\'admin peut changer le statut d\'une offre' },
        { status: 403 }
      )
    }

    const offreMaj = await prisma.offre.update({
      where: { id: parseInt(params.id) },
      data: {
        ...(titre        && { titre }),
        ...(description  && { description }),
        ...(domaine      && { domaine }),
        ...(duree        && { duree: parseInt(duree) }),
        ...(competences  !== undefined && { competences }),
        ...(remuneration !== undefined && { remuneration }),
        ...(statut       && estAdmin && { statut }),
      }
    })

    return NextResponse.json({ message: 'Offre mise à jour', offre: offreMaj })

  } catch (error) {
    console.error('Erreur PATCH /api/offres/[id]:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}

// ─── DELETE /api/offres/[id] ───────────────────────────────────
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const tokenData = verifierToken(token || '')
    if (!tokenData) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

    const offre = await prisma.offre.findUnique({ where: { id: parseInt(params.id) } })
    if (!offre) return NextResponse.json({ message: 'Offre introuvable' }, { status: 404 })

    const estProprietaire = tokenData.role === 'ENTREPRISE' && offre.entrepriseId === tokenData.userId
    const estAdmin        = tokenData.role === 'ADMIN'

    if (!estProprietaire && !estAdmin) {
      return NextResponse.json({ message: 'Non autorisé' }, { status: 403 })
    }

    // Vérifier qu'il n'y a pas de candidatures acceptées sur cette offre
    const candidaturesAcceptees = await prisma.candidature.count({
      where: { offreId: parseInt(params.id), statut: 'ACCEPTEE' }
    })

    if (candidaturesAcceptees > 0) {
      return NextResponse.json(
        { message: 'Impossible de supprimer : des candidatures ont déjà été acceptées' },
        { status: 400 }
      )
    }

    await prisma.offre.delete({ where: { id: parseInt(params.id) } })

    return NextResponse.json({ message: 'Offre supprimée avec succès' })

  } catch (error) {
    console.error('Erreur DELETE /api/offres/[id]:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}
