// app/api/cron/alertes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const CRON_SECRET = process.env.CRON_SECRET || 'cron-secret-ipd-2024'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronKey = request.nextUrl.searchParams.get('key')

  if (authHeader !== `Bearer ${CRON_SECRET}` && cronKey !== CRON_SECRET) {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })
  }

  try {
    const maintenant = new Date()
    const seuilAlerte = new Date(maintenant.getTime() - 7 * 24 * 60 * 60 * 1000)

    const stagesEnCours = await prisma.stage.findMany({
      where: { statut: 'EN_COURS' },
      include: {
        etudiant: { select: { id: true, nom: true, prenom: true, email: true } },
        encadreur: { select: { id: true, nom: true, prenom: true } },
        journaux: {
          orderBy: { dateDepot: 'desc' },
          take: 1,
        },
      },
    })

    let alertesCrees = 0
    const stagesEnRetard: { etudiant: string; encadreur: string; dernierJournal: string | null }[] = []

    for (const stage of stagesEnCours) {
      const dernierJournal = stage.journaux[0]
      const estEnRetard = !dernierJournal || dernierJournal.dateDepot < seuilAlerte

      if (estEnRetard) {
        const dernierDepot = dernierJournal?.dateDepot?.toISOString() ?? null

        if (dernierJournal) {
          await prisma.journalBord.update({
            where: { id: dernierJournal.id },
            data: { alerte: true },
          })
        }

        if (!stage.encadreurId) continue

        const messageEncadreur = `⚠️ Alerte : ${stage.etudiant.prenom} ${stage.etudiant.nom} n'a pas soumis de journal de bord depuis plus de 7 jours.`

        const alerteExistante = await prisma.notification.findFirst({
          where: {
            userId: stage.encadreurId,
            message: messageEncadreur,
            createdAt: { gte: new Date(maintenant.getTime() - 24 * 60 * 60 * 1000) },
          },
        })

        if (!alerteExistante) {
          await prisma.notification.create({
            data: {
              userId: stage.encadreurId,
              message: messageEncadreur,
              type: 'ALERTE_JOURNAL',
              lu: false,
            },
          })

          const nomEncadreur = stage.encadreur
            ? `${stage.encadreur.prenom} ${stage.encadreur.nom}`
            : 'votre encadreur'

          await prisma.notification.create({
            data: {
              userId: stage.etudiantId,
              message: `📋 Rappel : Vous n'avez pas soumis votre journal de bord cette semaine. ${nomEncadreur} attend votre rapport.`,
              type: 'RAPPEL_JOURNAL',
              lu: false,
            },
          })

          alertesCrees++
        }

        stagesEnRetard.push({
          etudiant: `${stage.etudiant.prenom} ${stage.etudiant.nom}`,
          encadreur: stage.encadreur
            ? `${stage.encadreur.prenom} ${stage.encadreur.nom}`
            : 'Non assigné',
          dernierJournal: dernierDepot,
        })
      }
    }

    return NextResponse.json({
      message: 'Vérification des alertes terminée',
      stagesVerifies: stagesEnCours.length,
      stagesEnRetard: stagesEnRetard.length,
      alertesCrees,
      details: stagesEnRetard,
      executeLe: maintenant.toISOString(),
    })
  } catch (error) {
    console.error('Erreur cron alertes:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}