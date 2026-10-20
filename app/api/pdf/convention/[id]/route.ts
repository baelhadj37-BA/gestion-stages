import { NextRequest, NextResponse } from 'next/server';
import { generateConventionPDF } from '@/lib/pdf-generator';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const conventionId = resolvedParams.id || 'STAGE-IPD-2026-001';

    // Génération du PDF via Puppeteer
    const pdfBuffer = await generateConventionPDF(conventionId);
    const uint8Array = new Uint8Array(pdfBuffer);

    // 'inline' permet d'ouvrir et prévisualiser le PDF dans le navigateur
    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="convention-${conventionId}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Erreur Puppeteer (API PDF) :', error);
    return NextResponse.json(
      { message: 'Erreur lors de la génération du PDF.' },
      { status: 500 }
    );
  }
}