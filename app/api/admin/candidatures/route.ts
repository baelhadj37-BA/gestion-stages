// app/api/admin/candidatures/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifierToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ message: 'Non authentifié' }, { status: 401 })
  const payload = verifierToken(token)
  if (!payload || payload.role !== 'ADMIN') return NextResponse.json({ message: 'Accès refusé' }, { status: 403 })

  const candidatures = await prisma.candidature.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      etudiant: { select: { id: true, nom: true, prenom: true, email: true, classe: true } },
      offre: {
        select: {
          id: true, titre: true, localisation: true, duree: true,
          entreprise: { select: { nom: true, prenom: true, secteur: true } },
        },
      },
    },
  })

  return NextResponse.json({ candidatures })
}

export async function PATCH(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ message: 'Non authentifié' }, { status: 401 })
  const payload = verifierToken(token)
  if (!payload || payload.role !== 'ADMIN') return NextResponse.json({ message: 'Accès refusé' }, { status: 403 })

  const { id, statut } = await req.json()
  if (!id || !['EN_ATTENTE', 'ACCEPTEE', 'REFUSEE'].includes(statut))
    return NextResponse.json({ message: 'Données invalides' }, { status: 400 })

  const candidature = await prisma.candidature.update({
    where: { id: Number(id) },
    data: { statut },
  })

  return NextResponse.json({ candidature })
}