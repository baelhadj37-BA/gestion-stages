import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET : Récupérer toutes les candidatures
export async function GET() {
  try {
    const candidatures = await prisma.candidature.findMany({
      include: {
        offre: {
          select: {
            titre: true,
            entreprise: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(candidatures, { status: 200 });
  } catch (error) {
    console.error('Erreur lors de la récupération des candidatures :', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des candidatures.' },
      { status: 500 }
    );
  }
}

// POST : Créer une candidature
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { offreId, cvUrl } = body;

    if (!offreId || !cvUrl) {
      return NextResponse.json(
        { error: 'Champs requis manquants (offreId et cvUrl).' },
        { status: 400 }
      );
    }

    const candidature = await prisma.candidature.create({
      data: {
        offreId,
        cvUrl,
        statut: 'EN_ATTENTE',
      },
    });

    return NextResponse.json(candidature, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création de la candidature :', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la soumission de la candidature.' },
      { status: 500 }
    );
  }
}