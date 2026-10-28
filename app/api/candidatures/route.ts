/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifierToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const tokenData = verifierToken(token || '')
    if (!tokenData) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

    const where: any = {}

    if (tokenData.role === 'ETUDIANT') {
      where.etudiantId = tokenData.userId
    } else if (tokenData.role === 'ENTREPRISE') {
      where.offre = { entrepriseId: tokenData.userId }
    } else if (tokenData.role === 'ADMIN') {
      // pas de filtre — admin voit tout
    } else {
      return NextResponse.json({ message: 'Accès non autorisé' }, { status: 403 })
    }

    const candidatures = await (prisma.candidature as any).findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        etudiant: { select: { id: true, nom: true, prenom: true, email: true, classe: true, filiere: true } },
        offre: {
          include: {
            entreprise: { select: { id: true, nom: true, prenom: true } },
          },
        },
      },
    })

    return NextResponse.json({ data: candidatures, total: candidatures.length })
  } catch (error) {
    console.error('Erreur GET /api/candidatures:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const tokenData = verifierToken(token || '')
    if (!tokenData || tokenData.role !== 'ETUDIANT')
      return NextResponse.json({ message: 'Réservé aux étudiants' }, { status: 403 })

    const body = await request.json()
    const { offreId, lettreUrl, cvUrl } = body

    if (!offreId || !cvUrl)
      return NextResponse.json({ message: 'offreId et cvUrl sont obligatoires' }, { status: 400 })

    const offre = await (prisma.offre as any).findUnique({ where: { id: Number(offreId) } })
    if (!offre) return NextResponse.json({ message: 'Offre introuvable' }, { status: 404 })
    if (offre.statut !== 'PUBLIEE')
      return NextResponse.json({ message: "Cette offre n'est plus disponible" }, { status: 400 })

    const dejaPostule = await (prisma.candidature as any).findFirst({
      where: { offreId: Number(offreId), etudiantId: tokenData.userId },
    })
    if (dejaPostule)
      return NextResponse.json({ message: 'Vous avez déjà postulé à cette offre' }, { status: 409 })

    const candidature = await (prisma.candidature as any).create({
      data: {
        offreId: Number(offreId),
        etudiantId: tokenData.userId,
        cvUrl: String(cvUrl).trim(),
        lettreUrl: lettreUrl ? String(lettreUrl).trim() : null,
        statut: 'EN_ATTENTE',
      },
    })

    return NextResponse.json({ message: 'Candidature envoyée avec succès', candidature }, { status: 201 })
  } catch (error) {
    console.error('Erreur POST /api/candidatures:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const tokenData = verifierToken(token || '')
    if (!tokenData || !['ENTREPRISE', 'ADMIN'].includes(tokenData.role))
      return NextResponse.json({ message: 'Accès refusé' }, { status: 403 })

    const { id, statut } = await request.json()
    if (!id || !['EN_ATTENTE', 'ACCEPTEE', 'REFUSEE'].includes(statut))
      return NextResponse.json({ message: 'Données invalides' }, { status: 400 })

    const candidature = await (prisma.candidature as any).update({
      where: { id: Number(id) },
      data: { statut },
    })

    return NextResponse.json({ candidature })
  } catch (error) {
    console.error('Erreur PATCH /api/candidatures:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}