import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifierToken } from '@/lib/auth'

export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const tokenData = verifierToken(token || '')
    if (!tokenData || tokenData.role !== 'ADMIN')
      return NextResponse.json({ message: 'Réservé aux admins' }, { status: 403 })

    const { id, statut } = await request.json()
    if (!id || !['PUBLIEE', 'REFUSEE', 'FERMEE', 'EN_ATTENTE'].includes(statut))
      return NextResponse.json({ message: 'Données invalides' }, { status: 400 })

    const offre = await prisma.offre.update({
      where: { id: Number(id) },
      data: { statut },
    })

    return NextResponse.json({ message: 'Statut mis à jour', offre })
  } catch (error) {
    console.error('Erreur PATCH /api/admin/offres:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}