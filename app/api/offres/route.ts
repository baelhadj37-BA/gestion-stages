import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Adaptez l'import selon votre projet Prisma

export async function GET() {
  try {
    const offres = await prisma.offre.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(offres);
  } catch (error) {
    console.error('Erreur API Offres:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des offres' },
      { status: 500 }
    );
  }
}