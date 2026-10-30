import { NextRequest, NextResponse } from 'next/server'
import { verifierToken } from '@/lib/auth'
import { generateConventionPDF } from '@/lib/pdf-generator'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const resolvedParams = await params
    const conventionId = resolvedParams.id

    const token =
      request.headers.get('authorization')?.split(' ')[1] ||
      request.nextUrl.searchParams.get('token') ||
      null

    if (!token) {
      return NextResponse.json({ message: 'Token manquant' }, { status: 401 })
    }

    const utilisateur = verifierToken(token)
    if (!utilisateur) {
      return NextResponse.json({ message: 'Token invalide' }, { status: 401 })
    }

    const id = Number(conventionId)
    if (isNaN(id)) {
      return NextResponse.json({ message: 'ID invalide' }, { status: 400 })
    }

    const pdfBuffer = await generateConventionPDF(conventionId)
    const uint8Array = new Uint8Array(pdfBuffer)

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="convention-${conventionId}.pdf"`,
      },
    })
  } catch (error) {
    console.error('[GET /api/pdf/convention/[id]]', error)
    return NextResponse.json({ message: 'Erreur génération PDF' }, { status: 500 })
  }
}