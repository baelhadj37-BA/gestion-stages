// app/api/admin/dashboard/route.ts
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

    const joursParam = request.nextUrl.searchParams.get('jours')
    const jours = Math.max(1, Math.min(365, Number(joursParam) || 7))

    const [
      totalEtudiants, totalEntreprises,
      totalOffres, offresEnAttente,
      totalCandidatures, candidaturesAcceptees, candidaturesRefusees,
      totalStages, stagesEnCours, stagesTermines,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'ETUDIANT' } }),
      prisma.user.count({ where: { role: 'ENTREPRISE' } }),
  
      prisma.offre.count(),
      prisma.offre.count({ where: { statut: 'EN_ATTENTE' } }),
      prisma.candidature.count(),
      prisma.candidature.count({ where: { statut: 'ACCEPTEE' } }),
      prisma.candidature.count({ where: { statut: 'REFUSEE' } }),
      prisma.stage.count(),
      prisma.stage.count({ where: { statut: 'EN_COURS' } }),
      prisma.stage.count({ where: { statut: 'TERMINE' } }),
    ])

    const candidaturesEnAttente = Math.max(
      totalCandidatures - candidaturesAcceptees - candidaturesRefusees, 0
    )
    const tauxPlacement = totalEtudiants > 0
      ? Math.round((stagesEnCours / totalEtudiants) * 100) : 0

    // Évolution des candidatures jour par jour sur `jours` derniers jours
    const serie = await Promise.all(
      Array.from({ length: jours }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (jours - 1 - i))
        const debut = new Date(d.getFullYear(), d.getMonth(), d.getDate())
        const fin   = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
        return prisma.candidature.count({
          where: { createdAt: { gte: debut, lt: fin } },
        }).then((total) => ({ date: debut.toISOString().split('T')[0], total }))
      })
    )

    const variation =
      serie.length >= 2
        ? serie[serie.length - 1].total - serie[serie.length - 2].total
        : null

    // 5 dernières candidatures avec étudiant + offre + entreprise
    const dernieresRaw = await prisma.candidature.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        etudiant: { select: { nom: true, prenom: true } },
        offre: {
          include: {
            entreprise: { select: { nom: true, prenom: true } },
          },
        },
      },
    })

    const dernieres = dernieresRaw.map((c) => ({
      id: c.id,
      etudiant: c.etudiant ? `${c.etudiant.prenom} ${c.etudiant.nom}` : '—',
      offre: c.offre?.titre ?? '—',
      entreprise: c.offre?.entreprise
        ? `${c.offre.entreprise.prenom} ${c.offre.entreprise.nom}`
        : '—',
      date: c.createdAt.toISOString(),
      statut: c.statut,
    }))

    return NextResponse.json({
      cartes: {
        etudiants: totalEtudiants,
        etudiantsMois: 0,
        entreprises: totalEntreprises,
        entreprisesMois: 0,
        offres: totalOffres,
        offresSemaine: offresEnAttente,
        candidaturesEnAttente,
        candidaturesEnAttenteSemaine: 0,
      },
      alertes: { offresEnAttente },
      evolution: {
        jours,
        total: totalCandidatures,
        variation,
        serie,
      },
      dernieres,
      tableauBord: {
        tauxPlacement,
        totalStages,
        stagesEnCours,
        stagesTermines,
      },
    })
  } catch (error) {
    console.error('[GET /api/admin/dashboard]', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}