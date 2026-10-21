// app/api/admin/parametres/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifierToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ message: 'Non authentifié' }, { status: 401 })
  const payload = verifierToken(token)
  if (!payload || payload.role !== 'ADMIN') return NextResponse.json({ message: 'Accès refusé' }, { status: 403 })

  const [encadreurs, stagiaires] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'ENCADREUR' },
      select: { id: true, nom: true, prenom: true, email: true },
    }),
    prisma.stage.findMany({
      where: { statut: 'EN_COURS' },
      include: {
        etudiant: { select: { id: true, nom: true, prenom: true, email: true, classe: true } },
        encadreur: { select: { id: true, nom: true, prenom: true } },
      },
    }),
  ])

  return NextResponse.json({ encadreurs, stagiaires })
}

export async function PATCH(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ message: 'Non authentifié' }, { status: 401 })
  const payload = verifierToken(token)
  if (!payload || payload.role !== 'ADMIN') return NextResponse.json({ message: 'Accès refusé' }, { status: 403 })

  const { stageId, encadreurId } = await req.json()
  if (!stageId || !encadreurId)
    return NextResponse.json({ message: 'Données invalides' }, { status: 400 })

  const stage = await prisma.stage.update({
    where: { id: Number(stageId) },
    data: { encadreurId: Number(encadreurId) },
  })

  return NextResponse.json({ stage })
}