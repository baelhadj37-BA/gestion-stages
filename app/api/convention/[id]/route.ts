import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const conventionId = Number(params.id);
    const body = await req.json();
    const { statut, motifRejet, pdfUrl } = body;

    const dataData: any = {};
    if (statut) dataData.statut = statut;
    if (motifRejet !== undefined) dataData.motifRejet = motifRejet;
    if (pdfUrl !== undefined) dataData.pdfUrl = pdfUrl;
    if (statut === 'VALIDEE') dataData.dateValidation = new Date();

    const conventionMiseAJour = await prisma.convention.update({
      where: { id: conventionId },
      data: dataData,
    });

    return NextResponse.json(conventionMiseAJour);
  } catch (error) {
    console.error('Erreur PATCH /api/convention/[id]:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la convention' },
      { status: 500 }
    );
  }
}