import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { titre, entreprise, description, localisation, duree, tags } = body;

    // Validation des champs obligatoires
    if (!titre || !entreprise || !description || !localisation || !duree) {
      return NextResponse.json(
        { error: 'Veuillez remplir tous les champs obligatoires.' },
        { status: 400 }
      );
    }

    // Création de l'offre en base de données
    const nouvelleOffre = await prisma.offre.create({
      data: {
        titre,
        entreprise,
        description,
        localisation,
        duree,
        tags: tags || null,
      },
    });

    return NextResponse.json(nouvelleOffre, { status: 201 });
  } catch (error: unknown) {
    console.error("Erreur lors de la création de l'offre:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      { error: `Erreur serveur: ${errorMessage}` },
      { status: 500 }
    );
  }
}