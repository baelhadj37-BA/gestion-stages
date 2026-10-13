// app/api/admin/dashboard/route.ts
// Route GET — Données du tableau de bord admin
// URL : /api/admin/dashboard

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifierToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const tokenData = verifierToken(token || '')

    if (!tokenData || tokenData.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Accès réservé aux administrateurs' },
        { status: 403 }
      )
    }

    const [
      totalUsers, totalEtudiants, totalEntreprises, totalEncadreurs,
      totalOffres, offresEnAttente, offresPubliees,
      totalCandidatures, candidaturesAcceptees, candidaturesRefusees,
      totalStages, stagesEnCours, stagesTermines,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'ETUDIANT' } }),
      prisma.user.count({ where: { role: 'ENTREPRISE' } }),
      prisma.user.count({ where: { role: 'ENCADREUR' } }),
      prisma.offre.count(),
      prisma.offre.count({ where: { statut: 'EN_ATTENTE' } }),
      prisma.offre.count({ where: { statut: 'PUBLIEE' } }),
      prisma.candidature.count(),
      prisma.candidature.count({ where: { statut: 'ACCEPTEE' } }),
      prisma.candidature.count({ where: { statut: 'REFUSEE' } }),
      prisma.stage.count(),
      prisma.stage.count({ where: { statut: 'EN_COURS' } }),
      prisma.stage.count({ where: { statut: 'TERMINE' } }),
    ])

    const tauxPlacement = totalEtudiants > 0
      ? Math.round((stagesEnCours / totalEtudiants) * 100) : 0

    const candidaturesEnAttente = Math.max(
      totalCandidatures - candidaturesAcceptees - candidaturesRefusees, 0
    )

    // Récupérer les vraies données des 10 derniers mois
    const serieData = await Promise.all(
      Array.from({ length: 10 }, (_, i) => {
        const date = new Date()
        date.setMonth(date.getMonth() - (9 - i))
        const debut = new Date(date.getFullYear(), date.getMonth(), 1)
        const fin = new Date(date.getFullYear(), date.getMonth() + 1, 0)
        return prisma.stage.count({
          where: {
            createdAt: { gte: debut, lte: fin }
          }
        }).then(total => ({
          date: debut.toISOString().split('T')[0],
          total
        }))
      })
    )

    return NextResponse.json({
      message: 'Dashboard récupéré avec succès',
      cartes: {
        etudiants: totalEtudiants,
        etudiantsMois: 0,
        entreprises: totalEntreprises,
        entreprisesMois: 0,
        offres: totalOffres,
        offresSemaine: offresEnAttente,
        candidaturesEnAttente,
        candidaturesSemaine: 0,
      },
      utilisateurs: {
        total: totalUsers,
        etudiants: totalEtudiants,
        entreprises: totalEntreprises,
        encadreurs: totalEncadreurs
      },
      offres: {
        total: totalOffres,
        enAttente: offresEnAttente,
        publiees: offresPubliees
      },
      candidatures: {
        total: totalCandidatures,
        acceptees: candidaturesAcceptees,
        refusees: candidaturesRefusees
      },
      stages: {
        total: totalStages,
        enCours: stagesEnCours,
        termines: stagesTermines,
        tauxPlacement: `${tauxPlacement}%`
      },
      alertes: {
        offresEnAttente
      },
      evolution: {
        variation: 0,
        pourcentage: 0,
        tendance: 'stable',
        data: serieData,
        serie: serieData
      },
      recent: {
        candidatures: [],
        offres: [],
        utilisateurs: []
      },
      dernieres: [],
      activites: [],
      notifications: [],
      serie: serieData,
      courbe: serieData,
      graphiques: {
        candidatures: [],
        offres: [],
        stages: [],
        serie: serieData
      },
      tableauBord: {
        tauxPlacement,
        totalStages,
        stagesEnCours,
        stagesTermines
      }
    })

  } catch (error) {
    console.error('Erreur dashboard:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}