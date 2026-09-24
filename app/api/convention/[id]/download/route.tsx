import { NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import React from 'react';
import { prisma } from '@/lib/prisma';
import ConventionPDF from '@/components/ConventionPDF';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const conventionId = Number(params.id);

    const convention = await prisma.convention.findUnique({
      where: { id: conventionId },
      include: {
        stage: {
          include: {
            etudiant: true,
            candidature: {
              include: {
                offre: true,
              },
            },
          },
        },
      },
    });

    if (!convention) {
      return NextResponse.json({ error: 'Convention introuvable' }, { status: 404 });
    }

    // React.createElement évite d'utiliser du JSX dans un fichier .ts
    const pdfDocument = React.createElement(ConventionPDF, {
      etudiantNom: convention.stage?.etudiant?.nom || 'Étudiant',
      etudiantEmail: convention.stage?.etudiant?.email || 'N/A',
      entrepriseNom: convention.stage?.candidature?.offre?.entreprise || 'Entreprise',
      intituleStage: convention.stage?.candidature?.offre?.titre || 'Stage',
      dateValidation: convention.dateValidation?.toISOString(),
    });

    const stream = await renderToStream(pdfDocument as any);

    return new NextResponse(stream as unknown as ReadableStream, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=convention_${conventionId}.pdf`,
      },
    });
  } catch (error) {
    console.error('Erreur génération PDF:', error);
    return NextResponse.json({ error: 'Erreur lors de la génération du PDF' }, { status: 500 });
  }
}