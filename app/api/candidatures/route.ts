// app/api/candidatures/route.ts
// GET  — Mes candidatures (étudiant) ou candidatures reçues (entreprise)
// POST — Postuler à une offre (étudiant uniquement)

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifierToken } from '@/lib/auth'

// ─── GET /api/candidatures ─────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const tokenData = verifierToken(token || '')

    if (!tokenData) {
      return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })
    }

    let candidatures

    if (tokenData.role === 'ETUDIANT') {
      // L'étudiant voit ses propres candidatures
      candidatures = await prisma.candidature.findMany({
        where: { etudiantId: tokenData.userId },
        orderBy: { createdAt: 'desc' },
        include: {
          offre: {
            select: {
              id: true,
              titre: true,
              domaine: true,
              duree: true,
              entreprise: { select: { id: true, nom: true } },
            }
          }
        }
      })
    } else if (tokenData.role === 'ENTREPRISE') {
      // L'entreprise voit les candidatures sur ses offres
      candidatures = await prisma.candidature.findMany({
        where: { offre: { entrepriseId: tokenData.userId } },
        orderBy: { createdAt: 'desc' },
        include: {
          offre: { select: { id: true, titre: true } },
          etudiant: { select: { id: true, nom: true, prenom: true, email: true } },
        }
      })
    } else if (tokenData.role === 'ADMIN') {
      // L'admin voit toutes les candidatures
      candidatures = await prisma.candidature.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          offre: {
            select: {
              id: true,
              titre: true,
              entreprise: { select: { id: true, nom: true } },
            }
          },
          etudiant: { select: { id: true, nom: true, prenom: true, email: true } },
        }
      })
    } else {
      return NextResponse.json({ message: 'Accès non autorisé' }, { status: 403 })
    }

    return NextResponse.json({
      message: 'Candidatures récupérées avec succès',
      candidatures,
      total: candidatures.length,
    })

  } catch (error) {
    console.error('Erreur GET /api/candidatures:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}

// ─── POST /api/candidatures ────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const tokenData = verifierToken(token || '')

    if (!tokenData || tokenData.role !== 'ETUDIANT') {
      return NextResponse.json(
        { message: 'Réservé aux étudiants' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { offreId, lettreMotivation, cv } = body

    if (!offreId || !lettreMotivation) {
      return NextResponse.json(
        { message: 'offreId et lettreMotivation sont obligatoires' },
        { status: 400 }
      )
    }

    // Vérifier que l'offre existe et est publiée
    const offre = await prisma.offre.findUnique({ where: { id: parseInt(offreId) } })
    if (!offre) {
      return NextResponse.json({ message: 'Offre introuvable' }, { status: 404 })
    }
    if (offre.statut !== 'PUBLIEE') {
      return NextResponse.json({ message: 'Cette offre n\'est plus disponible' }, { status: 400 })
    }

    // Vérifier que l'étudiant n'a pas déjà postulé
    const dejaPostule = await prisma.candidature.findFirst({
      where: { offreId: parseInt(offreId), etudiantId: tokenData.userId }
    })
    if (dejaPostule) {
      return NextResponse.json(
        { message: 'Vous avez déjà postulé à cette offre' },
        { status: 409 }
      )
    }

    const candidature = await prisma.candidature.create({
      data: {
        offreId:          parseInt(offreId),
        etudiantId:       tokenData.userId,
        lettreMotivation: lettreMotivation.trim(),
        cv:               cv?.trim() || null,
        statut:           'EN_ATTENTE',
      },
      include: {
        offre: { select: { titre: true, entreprise: { select: { nom: true } } } }
      }
    })

    return NextResponse.json(
      { message: 'Candidature envoyée avec succès', candidature },
      { status: 201 }
    )

  } catch (error) {
    console.error('Erreur POST /api/candidatures:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}
