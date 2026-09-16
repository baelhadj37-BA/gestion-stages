// app/api/admin/encadreurs/route.ts
// Route GET — Lister les encadreurs disponibles
// Route PATCH — Affecter un encadreur à un stagiaire
// URL : /api/admin/encadreurs
// Accès : ADMIN uniquement

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifierToken } from '@/lib/auth'

// ─────────────────────────────────────────
// GET — Lister tous les encadreurs
// ─────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    // 1. Vérifier le token et le rôle ADMIN
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const tokenData = verifierToken(token || '')

    if (!tokenData || tokenData.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Accès réservé aux administrateurs' },
        { status: 403 }
      )
    }

    // 2. Récupérer tous les encadreurs
    const encadreurs = await prisma.user.findMany({
      where: { role: 'ENCADREUR' },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        // Compter les stagiaires sous leur supervision
        stagesEncadreur: {
          select: {
            id: true,
            statut: true,
            etudiant: {
              select: {
                nom: true,
                prenom: true,
                email: true
              }
            }
          }
        }
      }
    })

    // 3. Formater les données
    const encadreursFormates = encadreurs.map(e => ({
      id: e.id,
      nom: e.nom,
      prenom: e.prenom,
      email: e.email,
      nombreStagiaires: e.stagesEncadreur.length,
      stagiaires: e.stagesEncadreur.map(s => ({
        stageId: s.id,
        statut: s.statut,
        etudiant: s.etudiant
      }))
    }))

    return NextResponse.json({
      message: 'Encadreurs récupérés avec succès',
      total: encadreursFormates.length,
      encadreurs: encadreursFormates
    })

  } catch (error) {
    console.error('Erreur admin encadreurs GET:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────
// PATCH — Affecter un encadreur à un stage
// ─────────────────────────────────────────
export async function PATCH(request: NextRequest) {
  try {
    // 1. Vérifier le token et le rôle ADMIN
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const tokenData = verifierToken(token || '')

    if (!tokenData || tokenData.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Accès réservé aux administrateurs' },
        { status: 403 }
      )
    }

    // 2. Récupérer les données
    const body = await request.json()
    const { stageId, encadreurId } = body

    // 3. Vérifier que les données sont valides
    if (!stageId || !encadreurId) {
      return NextResponse.json(
        { message: 'stageId et encadreurId sont obligatoires' },
        { status: 400 }
      )
    }

    // 4. Vérifier que l'encadreur existe et a le bon rôle
    const encadreur = await prisma.user.findFirst({
      where: { id: encadreurId, role: 'ENCADREUR' }
    })

    if (!encadreur) {
      return NextResponse.json(
        { message: 'Encadreur introuvable' },
        { status: 404 }
      )
    }

    // 5. Affecter l'encadreur au stage
    const stage = await prisma.stage.update({
      where: { id: stageId },
      data: { encadreurId },
      include: {
        etudiant: { select: { nom: true, prenom: true } },
        encadreur: { select: { nom: true, prenom: true } }
      }
    })

    // 6. Créer une notification pour l'étudiant
    await prisma.notification.create({
      data: {
        message: `Votre encadreur ${encadreur.prenom} ${encadreur.nom} a été affecté à votre stage`,
        type: 'ENCADREUR',
        userId: stage.etudiantId
      }
    })

    return NextResponse.json({
      message: 'Encadreur affecté avec succès',
      stage: {
        id: stage.id,
        etudiant: stage.etudiant,
        encadreur: stage.encadreur
      }
    })

  } catch (error) {
    console.error('Erreur admin encadreurs PATCH:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}