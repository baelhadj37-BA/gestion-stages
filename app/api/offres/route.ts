// app/api/offres/route.ts
// GET  — Liste des offres publiées (étudiant) ou toutes les offres (entreprise/admin)
// POST — Créer une nouvelle offre (entreprise uniquement)

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifierToken } from '@/lib/auth'

// ─── GET /api/offres ───────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const tokenData = verifierToken(token || '')

    if (!tokenData) {
      return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const domaine  = searchParams.get('domaine')   || undefined
    const dureeMin = searchParams.get('dureeMin')   ? parseInt(searchParams.get('dureeMin')!) : undefined
    const dureeMax = searchParams.get('dureeMax')   ? parseInt(searchParams.get('dureeMax')!) : undefined
    const search   = searchParams.get('search')     || undefined

    // Les étudiants ne voient que les offres PUBLIEES
    // Les entreprises voient leurs propres offres (tous statuts)
    // L'admin voit tout
    const whereClause: any = {}

    if (tokenData.role === 'ETUDIANT') {
      whereClause.statut = 'PUBLIEE'
    } else if (tokenData.role === 'ENTREPRISE') {
      whereClause.entrepriseId = tokenData.userId
    }
    // ADMIN : pas de filtre sur statut

    if (domaine)  whereClause.domaine  = { contains: domaine,  mode: 'insensitive' }
    if (dureeMin) whereClause.duree    = { ...whereClause.duree, gte: dureeMin }
    if (dureeMax) whereClause.duree    = { ...whereClause.duree, lte: dureeMax }
    if (search)   whereClause.OR = [
      { titre:       { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]

    const offres = await prisma.offre.findMany({
      where:   whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        entreprise: {
          select: { id: true, nom: true }
        },
        _count: { select: { candidatures: true } }
      }
    })

    return NextResponse.json({
      message: 'Offres récupérées avec succès',
      offres,
      total: offres.length
    })

  } catch (error) {
    console.error('Erreur GET /api/offres:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}

// ─── POST /api/offres ──────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const tokenData = verifierToken(token || '')

    if (!tokenData || tokenData.role !== 'ENTREPRISE') {
      return NextResponse.json(
        { message: 'Réservé aux entreprises' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { titre, description, domaine, duree, competences, remuneration } = body

    // Validation
    if (!titre || !description || !domaine || !duree) {
      return NextResponse.json(
        { message: 'Champs obligatoires manquants : titre, description, domaine, duree' },
        { status: 400 }
      )
    }

    if (duree < 1 || duree > 52) {
      return NextResponse.json(
        { message: 'La durée doit être entre 1 et 52 semaines' },
        { status: 400 }
      )
    }

    const offre = await prisma.offre.create({
      data: {
        titre,
        description,
        domaine,
        duree:         parseInt(duree),
        competences:   competences   || '',
        remuneration:  remuneration  || null,
        statut:        'EN_ATTENTE', // l'admin doit valider avant publication
        entrepriseId:  tokenData.userId,
      }
    })

    // Notification pour l'admin
    await prisma.notification.create({
      data: {
        type:     'OFFRE_EN_ATTENTE',
        message:  `Nouvelle offre en attente de validation : "${titre}"`,
        userId:   tokenData.userId,
        lu:       false,
      }
    }).catch(() => {}) // non bloquant si la table notification a un autre schéma

    return NextResponse.json(
      { message: 'Offre soumise avec succès, en attente de validation', offre },
      { status: 201 }
    )

  } catch (error) {
    console.error('Erreur POST /api/offres:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}
