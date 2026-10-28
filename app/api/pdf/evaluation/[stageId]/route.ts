// app/api/pdf/evaluation/[stageId]/route.ts
// Génère et retourne le PDF de la fiche d'évaluation

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifierToken } from '@/lib/auth'
import QRCode from 'qrcode'
import { generateEvaluationPDF } from '@/lib/evaluation-generator'
import fs from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ stageId: string }> }
) {
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.replace('Bearer ', '')
  const payload = verifierToken(token)

  if (!payload || !['ADMIN', 'ENCADREUR'].includes(payload.role)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { stageId: stageIdStr } = await params
  const stageId = parseInt(stageIdStr)
  if (isNaN(stageId)) {
    return NextResponse.json({ error: 'ID de stage invalide' }, { status: 400 })
  }

  const stage = await prisma.stage.findUnique({
    where: { id: stageId },
    include: {
      etudiant: true,
      encadreur: true,
      evaluation: true,
      candidature: {
        include: {
          offre: {
            include: { entreprise: true },
          },
        },
      },
    },
  })

  if (!stage) {
    return NextResponse.json({ error: 'Stage introuvable' }, { status: 404 })
  }

  if (!stage.evaluation) {
    return NextResponse.json(
      { error: 'Aucune évaluation enregistrée pour ce stage' },
      { status: 404 }
    )
  }

  let document = await prisma.document.findFirst({
    where: { stageId, type: 'FICHE_EVALUATION' },
    orderBy: { dateGeneration: 'desc' },
  })

  if (!document) {
    document = await prisma.document.create({
      data: { stageId, type: 'FICHE_EVALUATION', pdfUrl: '' },
    })
  }

  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/verify/${document.uuid}`
  const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 120,
  })

  const pdfBuffer = await generateEvaluationPDF({
    documentId: document.uuid,
    qrCodeDataUrl,
    etudiant: stage.etudiant,
    encadreur: stage.encadreur,
    offre: {
      titre: stage.candidature.offre.titre,
      duree: stage.candidature.offre.duree,
    },
    entreprise: {
      nom: stage.candidature.offre.entreprise?.nom ?? '',
      prenom: stage.candidature.offre.entreprise?.prenom ?? '',
    },
    stage: {
      dateDebut: stage.dateDebut,
      dateFin: stage.dateFin,
    },
    evaluation: {
      note: stage.evaluation.note,
      commentaire: stage.evaluation.commentaire,
    },
  })

  const dossier = path.join(process.cwd(), 'public', 'documents')
  await fs.mkdir(dossier, { recursive: true })
  const cheminPdf = path.join(dossier, `${document.uuid}.pdf`)
  await fs.writeFile(cheminPdf, pdfBuffer)
  const pdfUrl = `/documents/${document.uuid}.pdf`

  await prisma.document.update({
    where: { id: document.id },
    data: { pdfUrl, qrCodeUrl: verificationUrl },
  })

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="evaluation-stage-${stageId}.pdf"`,
    },
  })
}