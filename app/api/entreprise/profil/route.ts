// app/api/entreprise/profil/route.ts
// GET  — Récupérer le profil de l'entreprise connectée
// PUT  — Mettre à jour le profil

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifierToken } from '@/lib/auth'

// ─── GET /api/entreprise/profil ───────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const tokenData = verifierToken(token || '')

    if (!tokenData || tokenData.role !== 'ENTREPRISE') {
      return NextResponse.json({ message: 'Accès réservé aux entreprises' }, { status: 403 })
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(tokenData.userId) },
      select: {
        id:         true,
        nom:        true,
        prenom:     true,
        email:      true,
        telephone:  true,
        secteur:    true,
        competences: true,
        createdAt:  true,
      },
    })

    if (!user) {
      return NextResponse.json({ message: 'Entreprise introuvable' }, { status: 404 })
    }

    return NextResponse.json({ profil: user })

  } catch (error) {
    console.error('Erreur GET /api/entreprise/profil:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}

// ─── PUT /api/entreprise/profil ───────────────────────────────
export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const tokenData = verifierToken(token || '')

    if (!tokenData || tokenData.role !== 'ENTREPRISE') {
      return NextResponse.json({ message: 'Accès réservé aux entreprises' }, { status: 403 })
    }

    const body = await request.json()
    const { nom, prenom, email, telephone, secteur, competences } = body

    if (!nom || !email) {
      return NextResponse.json({ message: 'Nom et email sont obligatoires' }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id: Number(tokenData.userId) },
      data: {
        nom:         nom.trim(),
        prenom:      prenom?.trim() ?? '',
        email:       email.trim(),
        telephone:   telephone?.trim() ?? null,
        secteur:     secteur?.trim() ?? null,
        competences: competences?.trim() ?? null,
      },
      select: {
        id:         true,
        nom:        true,
        prenom:     true,
        email:      true,
        telephone:  true,
        secteur:    true,
        competences: true,
      },
    })

    return NextResponse.json({ message: 'Profil mis à jour', profil: updated })

  } catch (error) {
    console.error('Erreur PUT /api/entreprise/profil:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}