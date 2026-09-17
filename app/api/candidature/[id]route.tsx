import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { StatutCandidature } from '@prisma/client';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { statut } = await request.json(); // statut attendu : "ACCEPTEE" ou "REFUSEE"

    // Validation du statut par rapport à l'enum Prisma
    if (![StatutCandidature.ACCEPTEE, StatutCandidature.REFUSEE].includes(statut)) {
      return NextResponse.json(
        { error: 'Statut invalide. Utiliser ACCEPTEE ou REFUSEE.' },
        { status: 400 }
      );
    }

    // 1. Mettre à jour le statut de la candidature
    const candidature = await prisma.candidature.update({
      where: { id: params.id },
      data: { statut },
      include: { offre: true },
    });

    // 2. Générer la notification si la candidature appartient à un utilisateur
    if (candidature.userId) {
      const texteStatut = statut === StatutCandidature.ACCEPTEE ? 'acceptée' : 'refusée';

      await prisma.notification.create({
        data: {
          userId: candidature.userId,
          message: `Votre candidature pour le poste "${candidature.offre.titre}" a été ${texteStatut}.`,
          type: 'CANDIDATURE', // Champ requis par Prisma Client
        },
      });
    }

    return NextResponse.json(candidature);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la candidature:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}