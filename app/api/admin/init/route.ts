// app/api/admin/init/route.ts
// Route POST — Créer le premier compte admin
// URL : /api/admin/init
// ⚠️ À supprimer après utilisation

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { chiffrerMotDePasse, creerToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Vérifier qu'il n'y a pas déjà un admin
    const adminExistant = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (adminExistant) {
      return NextResponse.json(
        { message: 'Un admin existe déjà' },
        { status: 400 }
      )
    }

    // Créer le compte admin
    const motDePasseChiffre = await chiffrerMotDePasse('admin123')

    const admin = await prisma.user.create({
      data: {
        nom: 'Ba',
        prenom: 'Admin IPD',
        email: 'admin@ipd.sn',
        motDePasse: motDePasseChiffre,
        role: 'ADMIN'
      }
    })

    const token = creerToken(admin.id, admin.role)

    return NextResponse.json({
      message: 'Compte admin créé avec succès',
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Erreur init admin:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}