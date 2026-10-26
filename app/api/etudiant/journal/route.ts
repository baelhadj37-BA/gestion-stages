// app/api/etudiant/journal/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifierToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const tokenData = verifierToken(token || '')
    if (!tokenData || tokenData.role !== 'ETUDIANT') {
      return NextResponse.json({ message: 'Accès réservé aux étudiants' }, { status: 403 })
    }

    const stage = await prisma.stage.findFirst({
      where: { etudiantId: tokenData.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        journaux: { orderBy: { semaine: 'desc' } },
        encadreur: { select: { nom: true, prenom: true, email: true } },
      },
    })

    if (!stage) {
      return NextResponse.json({ journaux: [], stage: null, prochaineSemaine: 1 })
    }

    const semaines = stage.journaux.map((j) => j.semaine)
    const prochaineSemaine = semaines.length > 0 ? Math.max(...semaines) + 1 : 1

    return NextResponse.json({
      stage: {
        id: stage.id,
        dateDebut: stage.dateDebut,
        dateFin: stage.dateFin,
        statut: stage.statut,
        encadreur: stage.encadreur,
      },
      journaux: stage.journaux,
      prochaineSemaine,
    })
  } catch (error) {
    console.error('Erreur GET journal:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const tokenData = verifierToken(token || '')
    if (!tokenData || tokenData.role !== 'ETUDIANT') {
      return NextResponse.json({ message: 'Accès réservé aux étudiants' }, { status: 403 })
    }

    const body = await request.json()
    const { contenu, semaine, dateDebut, dateFin } = body

    if (!contenu?.trim()) {
      return NextResponse.json({ message: 'Le contenu est obligatoire' }, { status: 400 })
    }
    if (!semaine || semaine < 1) {
      return NextResponse.json({ message: 'Numéro de semaine invalide' }, { status: 400 })
    }

    const stage = await prisma.stage.findFirst({
      where: { etudiantId: tokenData.userId, statut: { not: 'ANNULE' } },
      orderBy: { createdAt: 'desc' },
    })

    if (!stage) {
      return NextResponse.json({ message: "Vous n'avez pas de stage actif" }, { status: 404 })
    }

    const existant = await prisma.journalBord.findFirst({
      where: { stageId: stage.id, semaine },
    })
    if (existant) {
      return NextResponse.json({ message: `Un rapport pour la semaine ${semaine} existe déjà` }, { status: 409 })
    }

    const journal = await prisma.journalBord.create({
      data: {
        stageId: stage.id,
        semaine,
        contenu: contenu.trim(),
        statut: 'EN_ATTENTE',
        dateDepot: new Date(),
        dateDebut: dateDebut ? new Date(dateDebut) : new Date(),
        dateFin: dateFin ? new Date(dateFin) : new Date(),
        alerte: false,
      },
    })

    return NextResponse.json({ message: 'Rapport soumis avec succès', journal }, { status: 201 })
  } catch (error) {
    console.error('Erreur POST journal:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}