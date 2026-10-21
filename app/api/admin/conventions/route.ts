// app/api/admin/conventions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifierToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ message: 'Non authentifié' }, { status: 401 })
  const payload = verifierToken(token)
  if (!payload || payload.role !== 'ADMIN') return NextResponse.json({ message: 'Accès refusé' }, { status: 403 })

  const conventions = await prisma.convention.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      stage: {
        include: {
          etudiant: { select: { id: true, nom: true, prenom: true, email: true, classe: true } },
          encadreur: { select: { id: true, nom: true, prenom: true, email: true } },
          candidature: {
            include: {
              offre: {
                select: {
                  titre: true,
                  entreprise: { select: { nom: true, prenom: true, secteur: true } },
                },
              },
            },
          },
        },
      },
    },
  })

  return NextResponse.json({ conventions })
}

export async function PATCH(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ message: 'Non authentifié' }, { status: 401 })
  const payload = verifierToken(token)
  if (!payload || payload.role !== 'ADMIN') return NextResponse.json({ message: 'Accès refusé' }, { status: 403 })

  const { id, action, motifRejet } = await req.json()
  if (!id || !['VALIDER', 'REJETER'].includes(action))
    return NextResponse.json({ message: 'Données invalides' }, { status: 400 })

  const convention = await prisma.convention.update({
    where: { id: Number(id) },
    data: {
      statut: action === 'VALIDER' ? 'VALIDEE' : 'REJETEE',
      motifRejet: action === 'REJETER' ? (motifRejet || 'Non conforme') : null,
      dateValidation: action === 'VALIDER' ? new Date() : null,
    },
  })

  return NextResponse.json({ convention })
}