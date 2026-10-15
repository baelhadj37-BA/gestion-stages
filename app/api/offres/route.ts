/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifierToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const tokenData = verifierToken(token || '')
    if (!tokenData) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || undefined

    const whereClause: any = {}

    if (tokenData.role === 'ETUDIANT') {
      whereClause.statut = 'PUBLIEE'
    } else if (tokenData.role === 'ENTREPRISE') {
      whereClause.entrepriseId = tokenData.userId
    }

    if (search) {
      whereClause.OR = [
        { titre: { contains: search } },
        { description: { contains: search } },
        { tags: { contains: search } },
      ]
    }

    const offres = await (prisma.offre as any).findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        entreprise: { select: { id: true, nom: true, prenom: true, secteur: true } },
        _count: { select: { candidatures: true } },
      },
    })

    return NextResponse.json({ offres, total: offres.length })
  } catch (error) {
    console.error('Erreur GET /api/offres:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const tokenData = verifierToken(token || '')
    if (!tokenData || tokenData.role !== 'ENTREPRISE')
      return NextResponse.json({ message: 'Réservé aux entreprises' }, { status: 403 })

    const body = await request.json()
    const { titre, description, duree, localisation, tags } = body

    if (!titre || !description || !duree || !localisation)
      return NextResponse.json(
        { message: 'Champs obligatoires : titre, description, duree, localisation' },
        { status: 400 }
      )

    const offre = await (prisma.offre as any).create({
      data: {
        titre,
        description,
        duree,
        localisation,
        tags: tags || null,
        statut: 'EN_ATTENTE',
        entrepriseId: tokenData.userId,
      },
    })

    await (prisma as any).notification.create({
      data: {
        type: 'NOUVELLE_OFFRE',
        message: `Nouvelle offre en attente de validation : "${titre}"`,
        userId: tokenData.userId,
        lu: false,
      },
    }).catch(() => {})

    return NextResponse.json(
      { message: 'Offre soumise, en attente de validation', offre },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erreur POST /api/offres:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}