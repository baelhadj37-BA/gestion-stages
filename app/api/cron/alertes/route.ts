// app/api/cron/alertes/route.ts
// GET — Cron Job : détecte les journaux en retard et crée des alertes
// Appelé automatiquement chaque semaine (ou manuellement depuis le dashboard admin)
// URL : /api/cron/alertes

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Clé secrète pour sécuriser l'appel cron (définie dans .env)
const CRON_SECRET = process.env.CRON_SECRET || 'cron-secret-ipd-2024'

export async function GET(request: NextRequest) {
  // Vérification de la clé secrète
  const authHeader = request.headers.get('authorization')
  const cronKey = request.nextUrl.searchParams.get('key')

  if (authHeader !== `Bearer ${CRON_SECRET}` && cronKey !== CRON_SECRET) {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })
  }

  try {
    const maintenant = new Date()
    // Seuil : journal non soumis depuis plus de 7 jours
    const seuilAlerte = new Date(maintenant.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Récupérer tous les stages en cours
    const stagesEnCours = await prisma.stage.findMany({
      where: { statut: 'EN_COURS' },
      include: {
        etudiant: { select: { id: true, nom: true, prenom: true, email: true } },
        encadreur: { select: { id: true, nom: true, prenom: true } },
        journaux: {
          orderBy: { dateDepot: 'desc' },
          take: 1, // Dernier journal soumis
        },
      },
    })

    let alertesCrees = 0
    let stagesEnRetard: { etudiant: string; encadreur: string; dernierJournal: string | null }[] = []

    for (const stage of stagesEnCours) {
      const dernierJournal = stage.journaux[0]

      // Calcul du retard : pas de journal depuis 7 jours
      const estEnRetard = !dernierJournal || dernierJournal.dateDepot < seuilAlerte

      if (estEnRetard) {
        const dernierDepot = dernierJournal?.dateDepot?.toISOString() ?? null

        // Marquer le journal comme alerte si existant
        if (dernierJournal) {
          await prisma.journalBord.update({
            where: { id: dernierJournal.id },
            data: { alerte: true },
          })
        }

        // Créer une notification pour l'encadreur
        const messageEncadreur = `⚠️ Alerte : ${stage.etudiant.prenom} ${stage.etudiant.nom} n'a pas soumis de journal de bord depuis plus de 7 jours.`

        // Vérifier qu'on n'a pas déjà envoyé cette alerte récemment (dans les 24h)
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

          // Créer aussi une notification pour l'étudiant
          await prisma.notification.create({
            data: {
              userId: stage.etudiantId,
              message: `📋 Rappel : Vous n'avez pas soumis votre journal de bord cette semaine. Votre encadreur ${stage.encadreur.prenom} ${stage.encadreur.nom} attend votre rapport.`,
              type: 'RAPPEL_JOURNAL',
              lu: false,
            },
          })

          alertesCrees++
        }

        stagesEnRetard.push({
          etudiant: `${stage.etudiant.prenom} ${stage.etudiant.nom}`,
          encadreur: `${stage.encadreur.prenom} ${stage.encadreur.nom}`,
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