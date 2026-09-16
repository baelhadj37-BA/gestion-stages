// app/api/admin/users/route.ts
// Route GET — Lister tous les utilisateurs
// Route PATCH — Activer ou désactiver un utilisateur
// URL : /api/admin/users
// Accès : ADMIN uniquement

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifierToken } from '@/lib/auth'

// ─────────────────────────────────────────
// GET — Lister tous les utilisateurs
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

    // 2. Récupérer tous les utilisateurs
    const users = await prisma.user.findMany({
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
        competences: true,
        matricule: true,
        classe: true,
        secteur: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    })

    // 3. Compter par rôle
    const stats = {
      total: users.length,
      etudiants: users.filter(u => u.role === 'ETUDIANT').length,
      entreprises: users.filter(u => u.role === 'ENTREPRISE').length,
      encadreurs: users.filter(u => u.role === 'ENCADREUR').length,
      admins: users.filter(u => u.role === 'ADMIN').length,
    }

    return NextResponse.json({
      message: 'Utilisateurs récupérés avec succès',
      stats,
      users
    })

  } catch (error) {
    console.error('Erreur admin users GET:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}