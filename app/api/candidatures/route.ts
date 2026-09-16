import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { offreId, userId } = await request.json();

    if (!offreId) {
      return NextResponse.json(
        { error: "L'identifiant de l'offre est requis." },
        { status: 400 }
      );
    }

    // Récupérer un utilisateur par défaut si non fourni
    let targetUserId = userId;
    if (!targetUserId) {
      const user = await prisma.user.findFirst();
      if (!user) {
        return NextResponse.json(
          { error: 'Aucun utilisateur trouvé en base de données.' },
          { status: 400 }
        );
      }
      targetUserId = user.id;
    }

    // Vérifier si l'utilisateur a déjà postulé
    const candidatureExistante = await prisma.candidature.findFirst({
      where: {
        offreId,
        userId: targetUserId,
      },
    });

    if (candidatureExistante) {
      return NextResponse.json(
        { error: 'Vous avez déjà postulé à cette offre.' },
        { status: 400 }
      );
    }

    // Enregistrer la candidature
    const nouvelleCandidature = await prisma.candidature.create({
      data: {
        offreId,
        userId: targetUserId,
        statut: 'EN_ATTENTE',
      },
    });

    return NextResponse.json(nouvelleCandidature, { status: 201 });
  } catch (error: unknown) {
    console.error('Erreur candidature API:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      { error: `Erreur serveur: ${errorMessage}` },
      { status: 500 }
    );
  }
}