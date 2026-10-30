import { NextRequest, NextResponse } from 'next/server'
import { verifierToken } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { genererPDFConvention } from '@/lib/pdf-generator'

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

    const convention = await prisma.convention.findUnique({
      where: { id },
      include: {
        stage: {
          include: {
            etudiant: true,
            encadreur: true,
            candidature: {
              include: {
                offre: {
                  include: { entreprise: true },
                },
              },
            },
          },
        },
      },
    })

    if (!convention) {
      return NextResponse.json({ message: 'Convention introuvable' }, { status: 404 })
    }

    const pdfBuffer = await genererPDFConvention({
      uuid: convention.uuid,
      etudiant: {
        nom: convention.stage.etudiant.nom,
        prenom: convention.stage.etudiant.prenom,
        matricule: convention.stage.etudiant.matricule,
        filiere: convention.stage.etudiant.filiere,
        classe: convention.stage.etudiant.classe,
      },
      entreprise: {
        nom: convention.stage.candidature.offre.entreprise.nom,
        prenom: convention.stage.candidature.offre.entreprise.prenom,
        secteur: convention.stage.candidature.offre.entreprise.secteur,
      },
      encadreur: {
        nom: convention.stage.encadreur?.nom ?? '',
        prenom: convention.stage.encadreur?.prenom ?? '',
      },
      offre: {
        titre: convention.stage.candidature.offre.titre,
        duree: convention.stage.candidature.offre.duree,
      },
      stage: {
        dateDebut: convention.stage.dateDebut,
        dateFin: convention.stage.dateFin,
      },
      dateValidation: convention.dateValidation ?? new Date(),
    })

    // Enregistrer le document pour vérification antifalsification
    await prisma.document.upsert({
      where: { uuid: convention.uuid },
      update: { dateGeneration: new Date() },
      create: {
        uuid: convention.uuid,
        type: 'CONVENTION',
        pdfUrl: `/api/pdf/convention/${id}`,
        stageId: convention.stage.id,
        dateGeneration: new Date(),
      },
    })

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="convention-${id}.pdf"`,
      },
    })
  } catch (error) {
    console.error('[GET /api/pdf/convention/[id]]', error)
    return NextResponse.json({ message: 'Erreur génération PDF' }, { status: 500 })
  }
}