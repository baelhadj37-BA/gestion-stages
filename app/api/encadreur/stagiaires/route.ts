// app/api/encadreur/stagiaires/route.ts
// GET — Liste des stagiaires encadrés
// URL : /api/encadreur/stagiaires

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifierToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  console.log('[stagiaires] Route appelée')
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    console.log('[stagiaires] Token présent:', !!token)
    const tokenData = verifierToken(token || '')
    console.log('[stagiaires] tokenData:', tokenData ? `userId=${tokenData.userId} role=${tokenData.role}` : 'null')

    if (!tokenData || tokenData.role !== 'ENCADREUR') {
      console.log('[stagiaires] 403 - accès refusé')
      return NextResponse.json(
        { message: 'Accès réservé aux encadreurs' },
        { status: 403 }
      )
    }

    const encadreurId = tokenData.userId

    const stages = await prisma.stage.findMany({
      where: { encadreurId },
      select: {
        id: true,
        statut: true,
        dateDebut: true,
        dateFin: true,
        etudiant: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            telephone: true,
            classe: true,
            filiere: true,
          },
        },
        candidature: {
          select: {
            offre: {
              select: {
                titre: true,
                duree: true,
                entreprise: {
                  select: { nom: true },
                },
              },
            },
          },
        },
        convention: {
          select: {
            id: true,
            statut: true,
          },
        },
      },
    })

    // Formater pour correspondre à l'interface Stagiaire du dashboard
    const stagiaires = stages.map(stage => ({
      id: stage.etudiant.id,
      nom: stage.etudiant.nom,
      prenom: stage.etudiant.prenom,
      email: stage.etudiant.email,
      telephone: stage.etudiant.telephone,
      classe: stage.etudiant.classe,
      filiere: stage.etudiant.filiere,
      convention: stage.convention
        ? {
            id: stage.convention.id,
            statut: stage.convention.statut,
            entreprise: stage.candidature?.offre?.entreprise ?? null,
            offre: stage.candidature?.offre
              ? { titre: stage.candidature.offre.titre, duree: stage.candidature.offre.duree }
              : null,
            debutStage: stage.dateDebut?.toISOString() ?? null,
            finStage: stage.dateFin?.toISOString() ?? null,
          }
        : null,
    }))

    return NextResponse.json({ stagiaires })
  } catch (error) {
    console.error('[stagiaires] ERREUR:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}