 import { NextRequest, NextResponse } from 'next/server'
import { verifierToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.split(' ')[1]
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const payload = verifierToken(token)
  if (!payload) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const stages = await (prisma as any).stage.findMany({
    where: { etudiantId: payload.userId },
    include: {
      taches: { orderBy: { createdAt: 'desc' } },
      candidature: {
        include: {
          offre: {
            select: {
              titre: true,
              entreprise: { select: { nom: true, prenom: true } }
            }
          }
        }
      }
    }
  })

  return NextResponse.json({ data: stages })
}