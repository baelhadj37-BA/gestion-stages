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
    const { action, fichier, motifRejet } = body
    if (!action) {
      return NextResponse.json({ message: 'Action requise' }, { status: 400 })
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
                    entreprise: { select: { id: true } },
                  },
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

    // ── SIGNER (étudiant ou entreprise) ──
    if (action === 'SIGNER') {
      const etudiantId   = convention.stage.candidature.etudiantId
      // entrepriseId peut être l'id du User OU l'id du profil Entreprise selon le schéma
      // On compare avec les deux pour être sûr
      const entrepriseUserId  = convention.stage.candidature.offre.entrepriseId
      const entrepriseProfilId = convention.stage.candidature.offre.entreprise?.id ?? null

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
      if (
        utilisateur.role === 'ENTREPRISE' &&
        (utilisateur.userId === entrepriseUserId || utilisateur.userId === entrepriseProfilId)
      ) {
        if (convention.statut !== 'ETAPE_ENTREPRISE') {
          return NextResponse.json({ message: "Ce n'est pas votre étape" }, { status: 400 })
        }
        const conventionMaj = await prisma.convention.update({
          where: { id },
          data: { statut: 'ETAPE_ADMIN' },
        })
        return NextResponse.json({ message: "Convention transmise à l'admin", data: conventionMaj })
      }
      return NextResponse.json({ message: 'Action non autorisée', debug: { userId: utilisateur.userId, entrepriseUserId, entrepriseProfilId, statut: convention.statut } }, { status: 403 })
    }

    // ── VALIDER ou REJETER (admin) ──
    if (action === 'VALIDER' || action === 'REJETER') {
      if (utilisateur.role !== 'ADMIN') {
        return NextResponse.json({ message: "Réservé à l'administrateur" }, { status: 403 })
      }
      if (action === 'VALIDER' && convention.statut !== 'ETAPE_ADMIN') {
        return NextResponse.json({ message: "La convention doit être à l'étape admin pour être validée" }, { status: 400 })
      }

      if (action === 'REJETER') {
        const conventionMaj = await prisma.convention.update({
          where: { id },
          data: { statut: 'REJETEE' },
        })
        // Notifier l'étudiant
        await prisma.notification.create({
          data: {
            userId: convention.stage.candidature.etudiantId,
            message: `Votre convention a été rejetée par l'administration${motifRejet ? ` : ${motifRejet}` : ''}.`,
            type: 'CONVENTION_REJETEE',
          },
        })
        return NextResponse.json({ message: 'Convention rejetée', data: conventionMaj })
      }

      // VALIDER — assigner automatiquement l'encadreur le moins chargé
      const encadreurs = await prisma.user.findMany({
        where: { role: 'ENCADREUR' },
        include: { _count: { select: { stagesEncadreur: true } } },
        orderBy: { stagesEncadreur: { _count: 'asc' } },
      })
      const encadreurAuto = encadreurs[0] ?? null

      // Mettre à jour le stage : encadreur + statut EN_COURS
      await prisma.stage.update({
        where: { id: convention.stageId },
        data: {
          statut: 'EN_COURS',
          ...(encadreurAuto ? { encadreurId: encadreurAuto.id } : {}),
        },
      })

      // Valider la convention
      const conventionMaj = await prisma.convention.update({
        where: { id },
        data: { statut: 'VALIDEE', dateValidation: new Date() },
      })

      // Notifier l'étudiant
      const msgEtudiant = encadreurAuto
        ? `Votre convention est validée ! Votre encadreur pédagogique est ${encadreurAuto.prenom} ${encadreurAuto.nom}.`
        : 'Votre convention est validée !'
      await prisma.notification.create({
        data: {
          userId: convention.stage.candidature.etudiantId,
          message: msgEtudiant,
          type: 'CONVENTION_VALIDEE',
        },
      })

      // Notifier l'encadreur assigné
      if (encadreurAuto) {
        await prisma.notification.create({
          data: {
            userId: encadreurAuto.id,
            message: `Un nouveau stagiaire vous a été assigné pour le stage "${convention.stage.candidature.offre.titre}".`,
            type: 'ENCADREUR_ASSIGNE',
          },
        })
      }

      return NextResponse.json({
        message: 'Convention validée',
        data: conventionMaj,
        encadreurAssigne: encadreurAuto
          ? { id: encadreurAuto.id, nom: encadreurAuto.nom, prenom: encadreurAuto.prenom }
          : null,
      })
    }

    return NextResponse.json({ message: 'Action non reconnue' }, { status: 400 })
  } catch (error) {
    console.error('[PATCH /api/conventions/[id]]', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}