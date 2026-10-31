import { NextRequest, NextResponse } from 'next/server'
import { verifierToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function getEntrepriseId(req: NextRequest): number | null {
  const token = req.headers.get('authorization')?.split(' ')[1]
  if (!token) return null
  const payload = verifierToken(token)
  return payload?.userId ?? null
}

export async function GET(req: NextRequest) {
  const entrepriseId = getEntrepriseId(req)
  if (!entrepriseId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stages = await (prisma as any).stage.findMany({
    where: { candidature: { offre: { entrepriseId } } },
    include: {
      taches: { orderBy: { createdAt: 'desc' } },
      candidature: {
        include: {
          etudiant: { select: { id: true, nom: true, prenom: true } },
          offre: { select: { titre: true } }
        }
      }
    }
  })

  return NextResponse.json({ data: stages })
}

export async function POST(req: NextRequest) {
  const entrepriseId = getEntrepriseId(req)
  if (!entrepriseId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { titre, description, deadline, stageId } = await req.json()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tache = await (prisma as any).tache.create({
    data: { titre, description, deadline: deadline ? new Date(deadline) : null, stageId }
  })

  return NextResponse.json({ data: tache }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const entrepriseId = getEntrepriseId(req)
  if (!entrepriseId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id, statut } = await req.json()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tache = await (prisma as any).tache.update({
    where: { id },
    data: { statut }
  })

  return NextResponse.json({ data: tache })
}