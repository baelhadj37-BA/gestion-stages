import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Adaptez l'import si besoin

// GET: Récupérer toutes les conventions avec les détails du stage et de l'étudiant
export async function GET() {
  try {
    const conventions = await prisma.convention.findMany({
      include: {
        stage: {
          include: {
            etudiant: {
              select: { id: true, nom: true, email: true },
            },
            encadreur: {
              select: { id: true, nom: true, email: true },
            },
            candidature: {
              include: {
                offre: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(conventions);
  } catch (error) {
    console.error('Erreur GET /api/convention:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des conventions' },
      { status: 500 }
    );
  }
}

// POST: Initialiser une convention pour un stage donné
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { stageId, pdfUrl } = body;

    if (!stageId) {
      return NextResponse.json({ error: 'Le stageId est requis' }, { status: 400 });
    }

    const nouvelleConvention = await prisma.convention.create({
      data: {
        stageId: Number(stageId),
        pdfUrl: pdfUrl || null,
        statut: 'ETAPE_ETUDIANT',
      },
    });

    return NextResponse.json(nouvelleConvention, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/convention:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la convention' },
      { status: 500 }
    );
  }
}