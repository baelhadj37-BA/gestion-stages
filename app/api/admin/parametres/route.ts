// app/api/admin/parametres/route.ts
// GET  — Récupérer le profil de l'admin connecté
// PUT  — Mettre à jour le profil (nom, prénom, email, téléphone)
// PATCH — Changer le mot de passe

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifierToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// ─── GET /api/admin/parametres ────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const tokenData = verifierToken(token || '')

    if (!tokenData || tokenData.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Accès non autorisé' }, { status: 403 })
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(tokenData.userId) },
      select: {
        id:        true,
        nom:       true,
        prenom:    true,
        email:     true,
        telephone: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ message: 'Utilisateur introuvable' }, { status: 404 })
    }

    return NextResponse.json({ profil: user })
  } catch (error) {
    console.error('Erreur GET /api/admin/parametres:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}

// ─── PUT /api/admin/parametres ────────────────────────────────
// Body: { nom, prenom, email, telephone }
export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const tokenData = verifierToken(token || '')

    if (!tokenData || tokenData.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Accès non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const { nom, prenom, email, telephone } = body

    if (!nom || !prenom || !email) {
      return NextResponse.json({ message: 'Nom, prénom et email sont requis' }, { status: 400 })
    }

    // Vérifier que l'email n'est pas déjà utilisé par un autre compte
    const emailExistant = await prisma.user.findFirst({
      where: { email, id: { not: Number(tokenData.userId) } },
    })
    if (emailExistant) {
      return NextResponse.json({ message: 'Cet email est déjà utilisé' }, { status: 409 })
    }

    const userMaj = await prisma.user.update({
      where: { id: Number(tokenData.userId) },
      data: { nom: nom.trim(), prenom: prenom.trim(), email: email.trim(), telephone: telephone?.trim() || null },
      select: { id: true, nom: true, prenom: true, email: true, telephone: true },
    })

    return NextResponse.json({ message: 'Profil mis à jour', profil: userMaj })
  } catch (error) {
    console.error('Erreur PUT /api/admin/parametres:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}

// ─── PATCH /api/admin/parametres ──────────────────────────────
// Body: { ancienMotDePasse, nouveauMotDePasse }
export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const tokenData = verifierToken(token || '')

    if (!tokenData || tokenData.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Accès non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const { ancienMotDePasse, nouveauMotDePasse } = body

    if (!ancienMotDePasse || !nouveauMotDePasse) {
      return NextResponse.json({ message: 'Ancien et nouveau mot de passe requis' }, { status: 400 })
    }

    if (nouveauMotDePasse.length < 8) {
      return NextResponse.json({ message: 'Le nouveau mot de passe doit contenir au moins 8 caractères' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(tokenData.userId) },
      select: { id: true, motDePasse: true },
    })

    if (!user) {
      return NextResponse.json({ message: 'Utilisateur introuvable' }, { status: 404 })
    }

    const mdpValide = await bcrypt.compare(ancienMotDePasse, user.motDePasse)
    if (!mdpValide) {
      return NextResponse.json({ message: 'Ancien mot de passe incorrect' }, { status: 401 })
    }

    const nouveauHash = await bcrypt.hash(nouveauMotDePasse, 12)
    await prisma.user.update({
      where: { id: user.id },
      data: { motDePasse: nouveauHash },
    })

    return NextResponse.json({ message: 'Mot de passe mis à jour avec succès' })
  } catch (error) {
    console.error('Erreur PATCH /api/admin/parametres:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}