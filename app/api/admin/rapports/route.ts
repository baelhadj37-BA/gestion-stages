// app/api/admin/rapports/route.ts
// GET — Rapports et évaluations (admin uniquement)
// Retourne : stats globales, liste des stages, journaux en alerte

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifierToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const tokenData = verifierToken(token || '')

    if (!tokenData || tokenData.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Accès non autorisé' }, { status: 403 })
    }

    // Tous les stages avec leurs données associées
    const stages = await prisma.stage.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        etudiant: {
          select: { id: true, nom: true, prenom: true, email: true, classe: true, filiere: true },
        },
        encadreur: {
          select: { id: true, nom: true, prenom: true, email: true },
        },
        candidature: {
          include: {
            offre: {
              select: {
                titre: true,
                duree: true,
                localisation: true,
                entreprise: { select: { id: true, nom: true, prenom: true } },
              },
            },
          },
        },
        journaux: {
          orderBy: { semaine: 'asc' },
          select: {
            id: true,
            semaine: true,
            statut: true,
            alerte: true,
            dateDepot: true,
            commentaire: true,
          },
        },
      },
    })

    // Journaux en alerte
    const alertes = await prisma.journalBord.findMany({
      where: { alerte: true },
      orderBy: { dateDepot: 'desc' },
      include: {
        stage: {
          include: {
            etudiant: { select: { id: true, nom: true, prenom: true } },
            candidature: {
              include: {
                offre: { select: { titre: true, entreprise: { select: { nom: true, prenom: true } } } },
              },
            },
          },
        },
      },
    })

    // Stats globales
    const total = stages.length
    const enCours = stages.filter((s) => s.statut === 'EN_COURS').length
    const termines = stages.filter((s) => s.statut === 'TERMINE').length
    const notes = stages.filter((s) => s.note !== null).map((s) => s.note as number)
    const moyenneNote = notes.length > 0 ? notes.reduce((a, b) => a + b, 0) / notes.length : null

    return NextResponse.json({
      stats: { total, enCours, termines, moyenneNote, nbAlertes: alertes.length },
      stages,
      alertes,
    })
  } catch (error) {
    console.error('Erreur GET /api/admin/rapports:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}

// PATCH — Mettre à jour la note d'un stage
export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const tokenData = verifierToken(token || '')

    if (!tokenData || tokenData.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Accès non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const { stageId, note, statut } = body

    if (!stageId) {
      return NextResponse.json({ message: 'stageId requis' }, { status: 400 })
    }

    if (note !== undefined && (typeof note !== 'number' || note < 0 || note > 20)) {
      return NextResponse.json({ message: 'La note doit être entre 0 et 20' }, { status: 400 })
    }

    const stage = await prisma.stage.findUnique({ where: { id: Number(stageId) } })
    if (!stage) {
      return NextResponse.json({ message: 'Stage introuvable' }, { status: 404 })
    }

    const data: { note?: number; statut?: string } = {}
    if (note !== undefined) data.note = note
    if (statut) data.statut = statut

    const stageMaj = await prisma.stage.update({
      where: { id: Number(stageId) },
      data,
    })

    return NextResponse.json({ message: 'Stage mis à jour', stage: stageMaj })
  } catch (error) {
    console.error('Erreur PATCH /api/admin/rapports:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}