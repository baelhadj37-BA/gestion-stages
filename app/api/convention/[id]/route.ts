import { NextRequest, NextResponse } from 'next/server'
import { verifierToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id: idStr } = await params
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ message: 'Token manquant' }, { status: 401 })
    }
    const utilisateur = verifierToken(token)
    if (!utilisateur) {
      return NextResponse.json({ message: 'Token invalide' }, { status: 401 })
    }
    const id = Number(idStr)
    if (isNaN(id)) {
      return NextResponse.json({ message: 'ID invalide' }, { status: 400 })
    }
    const convention = await prisma.convention.findUnique({
      where: { id },
      include: {
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
      },
    })
    if (!convention) {
      return NextResponse.json({ message: 'Convention introuvable' }, { status: 404 })
    }
    const etudiantId  = convention.stage.candidature.etudiantId
    const entrepriseId = convention.stage.candidature.offre.entrepriseId
    const encadreurId = convention.stage.encadreurId
    const autorise =
      utilisateur.role === 'ADMIN' ||
      (utilisateur.role === 'ETUDIANT'   && utilisateur.userId === etudiantId) ||
      (utilisateur.role === 'ENTREPRISE' && utilisateur.userId === entrepriseId) ||
      (utilisateur.role === 'ENCADREUR'  && utilisateur.userId === encadreurId)
    if (!autorise) {
      return NextResponse.json({ message: 'Accès non autorisé' }, { status: 403 })
    }
    return NextResponse.json({ data: convention }, { status: 200 })
  } catch (error) {
    console.error('[GET /api/conventions/[id]]', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id: idStr } = await params
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ message: 'Token manquant' }, { status: 401 })
    }
    const utilisateur = verifierToken(token)
    if (!utilisateur) {
      return NextResponse.json({ message: 'Token invalide' }, { status: 401 })
    }
    const id = Number(idStr)
    if (isNaN(id)) {
      return NextResponse.json({ message: 'ID invalide' }, { status: 400 })
    }
    const body = await request.json()
    const { action, fichier } = body
    if (!action) {
      return NextResponse.json({ message: 'Action requise' }, { status: 400 })
    }
    const convention = await prisma.convention.findUnique({
      where: { id },
      include: { stage: { include: { candidature: { include: { offre: true } } } } },
    })
    if (!convention) {
      return NextResponse.json({ message: 'Convention introuvable' }, { status: 404 })
    }
    if (action === 'SIGNER') {
      const etudiantId   = convention.stage.candidature.etudiantId
      const entrepriseId = convention.stage.candidature.offre.entrepriseId
      if (utilisateur.role === 'ETUDIANT' && utilisateur.userId === etudiantId) {
        if (convention.statut !== 'ETAPE_ETUDIANT') {
          return NextResponse.json({ message: "Ce n'est pas votre étape" }, { status: 400 })
        }
        const conventionMaj = await prisma.convention.update({
          where: { id },
          data: { statut: 'ETAPE_ENTREPRISE', pdfUrl: fichier ?? null },
        })
        return NextResponse.json({ message: "Convention transmise à l'entreprise", data: conventionMaj })
      }
      if (utilisateur.role === 'ENTREPRISE' && utilisateur.userId === entrepriseId) {
        if (convention.statut !== 'ETAPE_ENTREPRISE') {
          return NextResponse.json({ message: "Ce n'est pas votre étape" }, { status: 400 })
        }
        const conventionMaj = await prisma.convention.update({
          where: { id },
          data: { statut: 'ETAPE_ADMIN' },
        })
        return NextResponse.json({ message: "Convention transmise à l'admin", data: conventionMaj })
      }
      return NextResponse.json({ message: 'Action non autorisée' }, { status: 403 })
    }
    if (action === 'VALIDER' || action === 'REJETER') {
      if (utilisateur.role !== 'ADMIN') {
        return NextResponse.json({ message: "Réservé à l'administrateur" }, { status: 403 })
      }
      if (action === 'VALIDER' && convention.statut !== 'ETAPE_ADMIN') {
        return NextResponse.json({ message: 'La convention doit être à l\'étape admin pour être validée' }, { status: 400 })
      }
      const conventionMaj = await prisma.convention.update({
        where: { id },
        data: {
          statut: action === 'VALIDER' ? 'VALIDEE' : 'REJETEE',
          ...(action === 'VALIDER' ? { dateValidation: new Date() } : {}),
        },
      })
      return NextResponse.json({
        message: `Convention ${action === 'VALIDER' ? 'validée' : 'rejetée'}`,
        data: conventionMaj,
      })
    }
    return NextResponse.json({ message: 'Action non reconnue' }, { status: 400 })
  } catch (error) {
    console.error('[PATCH /api/conventions/[id]]', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}