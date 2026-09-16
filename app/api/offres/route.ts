import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const localisation = searchParams.get('localisation') || '';

    const offres = await prisma.offre.findMany({
      where: {
        AND: [
          query
            ? {
                OR: [
                  { titre: { contains: query } },
                  { description: { contains: query } },
                  { entreprise: { contains: query } },
                ],
              }
            : {},
          localisation
            ? { localisation: { contains: localisation } }
            : {},
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(offres);
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la récupération des offres' }, { status: 500 });
  }
}