// app/api/admin/rapports/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifierToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ message: 'Non authentifié' }, { status: 401 })
  const payload = verifierToken(token)
  if (!payload || payload.role !== 'ADMIN') return NextResponse.json({ message: 'Accès refusé' }, { status: 403 })

  // Stages actifs
  const stages = await prisma.stage.findMany({
    where: { statut: 'EN_COURS' },
    include: {
      etudiant: { select: { id: true, nom: true, prenom: true, email: true, classe: true, filiere: true } },
      encadreur: { select: { id: true, nom: true, prenom: true, email: true } },
      journaux: { orderBy: { semaine: 'desc' } },
      candidature: {
        include: {
          offre: { select: { titre: true, entreprise: { select: { nom: true, prenom: true } } } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Calculer retard : semaine actuelle depuis dateDebut
  const maintenant = new Date()
  const stagesAvecRetard = stages.map((s) => {
    const debut = new Date(s.dateDebut)
    const semaines = Math.floor((maintenant.getTime() - debut.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1
    const semainesAttendues = Math.max(1, semaines)
    const derniereEntree = s.journaux[0]?.semaine ?? 0
    const retard = Math.max(0, semainesAttendues - derniereEntree)
    const alerte = s.journaux.some((j) => j.alerte)
    return { ...s, semainesAttendues, derniereEntree, retard, alerte }
  })

  // Stats globales
  const totalStages = stages.length
  const stagesEnRetard = stagesAvecRetard.filter((s) => s.retard > 0).length
  const stagesAvecAlerte = stagesAvecRetard.filter((s) => s.alerte).length

  return NextResponse.json({ stages: stagesAvecRetard, stats: { totalStages, stagesEnRetard, stagesAvecAlerte } })
}