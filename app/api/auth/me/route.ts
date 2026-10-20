import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifierToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const tokenData = verifierToken(token || '')
    if (!tokenData) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: tokenData.userId },
      select: { id: true, nom: true, prenom: true, email: true, role: true, secteur: true, telephone: true },
    })

    if (!user) return NextResponse.json({ message: 'Utilisateur introuvable' }, { status: 404 })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Erreur GET /api/auth/me:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}