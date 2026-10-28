// app/api/conventions/route.ts
// GET — liste les conventions selon le rôle :
//   ETUDIANT  → ses propres conventions
//   ADMIN     → toutes les conventions
//   ENTREPRISE → conventions liées à ses offres

import { NextRequest, NextResponse } from 'next/server'
import { verifierToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ message: 'Token manquant' }, { status: 401 })

    const utilisateur = verifierToken(token)
    if (!utilisateur) {
      return NextResponse.json({ message: 'Token invalide' }, { status: 401 })
    }

    // ── Clause where selon le rôle ──────────────────────────────
    let where = {}

    if (utilisateur.role === 'ETUDIANT') {
      where = { stage: { etudiantId: utilisateur.userId } }
    } else if (utilisateur.role === 'ENTREPRISE') {
      where = {
        stage: {
          candidature: {
            offre: { entrepriseId: utilisateur.userId },
          },
        },
      }
    } else if (utilisateur.role === 'ADMIN' || utilisateur.role === 'ENCADREUR') {
      where = {} // toutes
    } else {
      return NextResponse.json({ message: 'Rôle non autorisé' }, { status: 403 })
    }

    const conventions = await prisma.convention.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        stage: {
          include: {
            etudiant: {
              select: { id: true, nom: true, prenom: true, email: true },
            },
            encadreur: {
              select: { id: true, nom: true, prenom: true, email: true },
            },
            candidature: {
              include: {
                offre: {
                  include: {
                    entreprise: {
                      select: { nom: true, prenom: true, secteur: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ conventions })
  } catch (error) {
    console.error('[GET /api/conventions]', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}