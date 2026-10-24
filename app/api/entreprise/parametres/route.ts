// app/api/entreprise/parametres/route.ts
// PATCH — Changer le mot de passe
// DELETE — Supprimer le compte

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifierToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// ─── PATCH /api/entreprise/parametres ─────────────────────────
// Body: { ancienMotDePasse, nouveauMotDePasse }
export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const tokenData = verifierToken(token || '')

    if (!tokenData || tokenData.role !== 'ENTREPRISE') {
      return NextResponse.json({ message: 'Accès réservé aux entreprises' }, { status: 403 })
    }

    const body = await request.json()
    const { ancienMotDePasse, nouveauMotDePasse } = body

    if (!ancienMotDePasse || !nouveauMotDePasse) {
      return NextResponse.json({ message: 'Ancien et nouveau mot de passe requis' }, { status: 400 })
    }

    if (nouveauMotDePasse.length < 8) {
      return NextResponse.json({ message: 'Le nouveau mot de passe doit contenir au moins 8 caractères' }, { status: 400 })
    }

    // Récupérer l'utilisateur avec son mot de passe hashé
    const user = await prisma.user.findUnique({
      where: { id: Number(tokenData.userId) },
      select: { id: true, motDePasse: true },
    })

    if (!user) {
      return NextResponse.json({ message: 'Utilisateur introuvable' }, { status: 404 })
    }

    // Vérifier l'ancien mot de passe
    const mdpValide = await bcrypt.compare(ancienMotDePasse, user.motDePasse)
    if (!mdpValide) {
      return NextResponse.json({ message: 'Ancien mot de passe incorrect' }, { status: 401 })
    }

    // Hasher et sauvegarder le nouveau mot de passe
    const nouveauHash = await bcrypt.hash(nouveauMotDePasse, 12)
    await prisma.user.update({
      where: { id: user.id },
      data: { motDePasse: nouveauHash },
    })

    return NextResponse.json({ message: 'Mot de passe mis à jour avec succès' })
  } catch (error) {
    console.error('Erreur PATCH /api/entreprise/parametres:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}

// ─── DELETE /api/entreprise/parametres ────────────────────────
// Body: { motDePasse } — confirmation avant suppression
export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const tokenData = verifierToken(token || '')

    if (!tokenData || tokenData.role !== 'ENTREPRISE') {
      return NextResponse.json({ message: 'Accès réservé aux entreprises' }, { status: 403 })
    }

    const body = await request.json()
    const { motDePasse } = body

    if (!motDePasse) {
      return NextResponse.json({ message: 'Mot de passe requis pour supprimer le compte' }, { status: 400 })
    }

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: Number(tokenData.userId) },
      select: { id: true, motDePasse: true },
    })

    if (!user) {
      return NextResponse.json({ message: 'Utilisateur introuvable' }, { status: 404 })
    }

    // Vérifier le mot de passe
    const mdpValide = await bcrypt.compare(motDePasse, user.motDePasse)
    if (!mdpValide) {
      return NextResponse.json({ message: 'Mot de passe incorrect' }, { status: 401 })
    }

    // Supprimer le compte (Prisma cascade selon le schéma)
    await prisma.user.delete({
      where: { id: user.id },
    })

    return NextResponse.json({ message: 'Compte supprimé avec succès' })
  } catch (error) {
    console.error('Erreur DELETE /api/entreprise/parametres:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}