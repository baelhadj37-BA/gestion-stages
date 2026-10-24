// app/api/entreprise/offres/route.ts
// GET  — Liste toutes les offres de l'entreprise connectée
// POST — Créer une nouvelle offre de stage

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifierToken } from '@/lib/auth'

// ─── GET /api/entreprise/offres ───────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const tokenData = verifierToken(token || '')

    if (!tokenData || tokenData.role !== 'ENTREPRISE') {
      return NextResponse.json({ message: 'Accès réservé aux entreprises' }, { status: 403 })
    }

    const offres = await prisma.offre.findMany({
      where: { entrepriseId: Number(tokenData.userId) },
      include: {
        _count: { select: { candidatures: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const formattees = offres.map((o) => ({
      id:             o.id,
      titre:          o.titre,
      statut:         o.statut,
      duree:          o.duree,
      localisation:   o.localisation,
      tags:           o.tags,
      createdAt:      o.createdAt.toISOString(),
      nbCandidatures: o._count.candidatures,
    }))

    return NextResponse.json({ offres: formattees, total: formattees.length })

  } catch (error) {
    console.error('Erreur GET /api/entreprise/offres:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}

// ─── POST /api/entreprise/offres ──────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const tokenData = verifierToken(token || '')

    if (!tokenData || tokenData.role !== 'ENTREPRISE') {
      return NextResponse.json({ message: 'Accès réservé aux entreprises' }, { status: 403 })
    }

    const body = await request.json()
    const { titre, duree, localisation, description, tags } = body

    if (!titre?.trim() || !duree?.trim()) {
      return NextResponse.json({ message: 'Titre et durée sont obligatoires' }, { status: 400 })
    }

    const offre = await prisma.offre.create({
      data: {
        titre:        titre.trim(),
        duree:        duree.trim(),
        localisation: localisation?.trim() || '',
        description:  description?.trim()  || '',
        tags:         tags?.trim()          || null,
        statut:       'EN_ATTENTE',
        entrepriseId: Number(tokenData.userId),
      },
    })

    return NextResponse.json({
      message: 'Offre créée avec succès',
      offre: {
        id:             offre.id,
        titre:          offre.titre,
        statut:         offre.statut,
        duree:          offre.duree,
        localisation:   offre.localisation,
        tags:           offre.tags,
        createdAt:      offre.createdAt.toISOString(),
        nbCandidatures: 0,
      },
    }, { status: 201 })

  } catch (error) {
    console.error('Erreur POST /api/entreprise/offres:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}