// app/api/admin/offres/route.ts
// Route GET — Lister les offres en attente de validation
// Route PATCH — Valider ou rejeter une offre
// URL : /api/admin/offres
// Accès : ADMIN uniquement

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifierToken } from '@/lib/auth'

// ─────────────────────────────────────────
// GET — Lister les offres en attente
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

    // 2. Récupérer les offres en attente de validation
    const offresEnAttente = await prisma.offre.findMany({
      where: { statut: 'EN_ATTENTE' },
      include: {
        entreprise: {
          select: { nom: true, prenom: true, secteur: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      message: 'Offres en attente récupérées',
      total: offresEnAttente.length,
      offres: offresEnAttente
    })

  } catch (error) {
    console.error('Erreur admin offres GET:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────
// PATCH — Valider ou rejeter une offre
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
    const { offreId, action } = body

    // 3. Vérifier que les données sont valides
    if (!offreId || !action) {
      return NextResponse.json(
        { message: 'offreId et action sont obligatoires' },
        { status: 400 }
      )
    }

    if (!['VALIDER', 'REJETER'].includes(action)) {
      return NextResponse.json(
        { message: 'Action invalide — utilisez VALIDER ou REJETER' },
        { status: 400 }
      )
    }

    // 4. Mettre à jour le statut de l'offre
    const nouveauStatut = action === 'VALIDER' ? 'PUBLIEE' : 'FERMEE'

    const offre = await prisma.offre.update({
      where: { id: offreId },
      data: { statut: nouveauStatut }
    })

    return NextResponse.json({
      message: action === 'VALIDER'
        ? 'Offre validée et publiée avec succès'
        : 'Offre rejetée avec succès',
      offre
    })

  } catch (error) {
    console.error('Erreur admin offres PATCH:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}