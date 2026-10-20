import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const offre = await (prisma.offre as any).findUnique({
      where: { id: Number(params.id) },
      include: {
        entreprise: {
          select: { nom: true, prenom: true, secteur: true, telephone: true, email: true },
        },
      },
    })
    if (!offre) return NextResponse.json({ message: 'Offre introuvable' }, { status: 404 })
    return NextResponse.json({ offre })
  } catch (error) {
    console.error('Erreur GET /api/offres/[id]:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}