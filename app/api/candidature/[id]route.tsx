import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Ou la configuration de votre instance Prisma

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { statut } = body;

    const updatedCandidature = await prisma.candidature.update({
      where: { id: params.id },
      data: { statut },
    });

    return NextResponse.json(updatedCandidature);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}