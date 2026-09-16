// app/api/admin/stats/route.ts
// Route GET — Statistiques globales de la plateforme
// URL : /api/admin/stats
// Accès : ADMIN uniquement

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifierToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // 1. Vérifier le token et le rôle ADMIN
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const tokenData = verifierToken(token || '')

    if (!tokenData || tokenData.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Accès réservé aux administrateurs' },
        { status: 403 }
      )
    }

    // 2. Récupérer toutes les statistiques en parallèle
    // Promise.all = exécuter plusieurs requêtes en même temps
    const [
      totalUsers,
      totalEtudiants,
      totalEntreprises,
      totalEncadreurs,
      totalOffres,
      offresEnAttente,
      offresPubliees,
      totalCandidatures,
      candidaturesAcceptees,
      candidaturesRefusees,
      totalStages,
      stagesEnCours,
      stagesTermines,
      etudiantsEnRetard,
    ] = await Promise.all([
      // Utilisateurs
      prisma.user.count(),
      prisma.user.count({ where: { role: 'ETUDIANT' } }),
      prisma.user.count({ where: { role: 'ENTREPRISE' } }),
      prisma.user.count({ where: { role: 'ENCADREUR' } }),

      // Offres
      prisma.offre.count(),
      prisma.offre.count({ where: { statut: 'EN_ATTENTE' } }),
      prisma.offre.count({ where: { statut: 'PUBLIEE' } }),

      // Candidatures
      prisma.candidature.count(),
      prisma.candidature.count({ where: { statut: 'ACCEPTEE' } }),
      prisma.candidature.count({ where: { statut: 'REFUSEE' } }),

      // Stages
      prisma.stage.count(),
      prisma.stage.count({ where: { statut: 'EN_COURS' } }),
      prisma.stage.count({ where: { statut: 'TERMINE' } }),

      // Étudiants en retard sur leur journal
      prisma.user.count({
        where: {
          role: 'ETUDIANT',
          stagesEtudiant: {
            some: {
              journaux: {
                some: { alerte: true }
              }
            }
          }
        }
      }),
    ])

    // 3. Calculer les taux
    const tauxPlacement = totalEtudiants > 0
      ? Math.round((stagesEnCours / totalEtudiants) * 100)
      : 0

    const tauxAcceptation = totalCandidatures > 0
      ? Math.round((candidaturesAcceptees / totalCandidatures) * 100)
      : 0

    // 4. Retourner toutes les statistiques
    return NextResponse.json({
      message: 'Statistiques récupérées avec succès',
      utilisateurs: {
        total: totalUsers,
        etudiants: totalEtudiants,
        entreprises: totalEntreprises,
        encadreurs: totalEncadreurs,
      },
      offres: {
        total: totalOffres,
        enAttente: offresEnAttente,
        publiees: offresPubliees,
      },
      candidatures: {
        total: totalCandidatures,
        acceptees: candidaturesAcceptees,
        refusees: candidaturesRefusees,
        tauxAcceptation: `${tauxAcceptation}%`,
      },
      stages: {
        total: totalStages,
        enCours: stagesEnCours,
        termines: stagesTermines,
        tauxPlacement: `${tauxPlacement}%`,
      },
      alertes: {
        etudiantsEnRetard,
        offresEnAttente,
      }
    })

  } catch (error) {
    console.error('Erreur admin stats:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}