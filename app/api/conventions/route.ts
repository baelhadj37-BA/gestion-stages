import { NextRequest, NextResponse } from 'next/server'
import { verifierToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type ConventionPrisma = {
  id: number
  statut: string
  pdfUrl: string | null
  motifRejet: string | null
  dateValidation: Date | null
  createdAt: Date
  stage: {
    id: number
    dateDebut: Date
    dateFin: Date
    encadreur: { id: number; nom: string; prenom: string; email: string } | null
    candidature: {
      offre: {
        titre: string
        duree: string
        entreprise: { id: number; nom: string; prenom: string; secteur: string | null; email: string } | null
      }
      etudiant: { id: number; nom: string; prenom: string; email: string; filiere: string | null; classe: string | null }
    }
  }
}

// Injecte `stage.etudiant` directement depuis `stage.candidature.etudiant`
// pour que tous les dashboards puissent utiliser conv.stage.etudiant
function normaliserConventions(conventions: ConventionPrisma[]) {
  return conventions.map((conv) => ({
    ...conv,
    stage: {
      ...conv.stage,
      etudiant: conv.stage?.candidature?.etudiant ?? null,
    },
  }))
}

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

    const include = {
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
              etudiant: {
                select: { id: true, nom: true, prenom: true, email: true, filiere: true, classe: true },
              },
            },
          },
        },
      },
    }

    let conventions

    if (utilisateur.role === 'ETUDIANT') {
      conventions = await prisma.convention.findMany({
        where: {
          stage: {
            candidature: {
              etudiantId: utilisateur.userId,
            },
          },
        },
        include,
        orderBy: { createdAt: 'desc' },
      })
    } else if (utilisateur.role === 'ENTREPRISE') {
      conventions = await prisma.convention.findMany({
        where: {
          stage: {
            candidature: {
              offre: {
                entrepriseId: utilisateur.userId,
              },
            },
          },
        },
        include,
        orderBy: { createdAt: 'desc' },
      })
    } else if (utilisateur.role === 'ADMIN') {
      conventions = await prisma.convention.findMany({
        include,
        orderBy: { createdAt: 'desc' },
      })
    } else {
      return NextResponse.json({ message: 'Accès non autorisé' }, { status: 403 })
    }

    return NextResponse.json({ data: normaliserConventions(conventions) }, { status: 200 })
  } catch (error) {
    console.error('[GET /api/conventions]', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}