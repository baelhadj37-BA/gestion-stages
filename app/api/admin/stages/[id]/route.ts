// app/api/admin/stages/[id]/route.ts
// PATCH  → assigner un encadreur pédagogique à un stage

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifierToken } from '@/lib/auth'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

  const payload = verifierToken(token)
  if (!payload || payload.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Accès refusé' }, { status: 403 })
  }

  const stageId = parseInt(params.id, 10)
  if (isNaN(stageId)) {
    return NextResponse.json({ message: 'Identifiant invalide' }, { status: 400 })
  }

  let body: { encadreurId?: number | null }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ message: 'Corps JSON invalide' }, { status: 400 })
  }

  // Vérifier que le stage existe
  const stage = await prisma.stage.findUnique({ where: { id: stageId } })
  if (!stage) {
    return NextResponse.json({ message: 'Stage introuvable' }, { status: 404 })
  }

  // Si encadreurId fourni, vérifier que c'est bien un ENCADREUR
  if (body.encadreurId != null) {
    const encadreur = await prisma.user.findUnique({ where: { id: body.encadreurId } })
    if (!encadreur || encadreur.role !== 'ENCADREUR') {
      return NextResponse.json({ message: 'Encadreur introuvable ou rôle incorrect' }, { status: 400 })
    }
  }

  const stageMAJ = await prisma.stage.update({
    where: { id: stageId },
    data: { encadreurId: body.encadreurId ?? null },
    include: {
      encadreur: { select: { id: true, nom: true, prenom: true, email: true } },
    },
  })

  return NextResponse.json({ stage: stageMAJ })
}