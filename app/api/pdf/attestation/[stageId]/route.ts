// app/api/pdf/attestation/[stageId]/route.ts
// Génère et retourne le PDF d'attestation de fin de stage

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifierToken } from '@/lib/auth'
import QRCode from 'qrcode'
import { generateAttestationPDF } from '@/lib/attestation-generator'
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

  if (!payload || payload.role !== 'ADMIN') {
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

  if (stage.statut !== 'TERMINE') {
    return NextResponse.json(
      { error: "L'attestation ne peut être générée que pour un stage terminé" },
      { status: 400 }
    )
  }

  let document = await prisma.document.findFirst({
    where: { stageId, type: 'ATTESTATION' },
    orderBy: { dateGeneration: 'desc' },
  })

  if (!document) {
    document = await prisma.document.create({
      data: { stageId, type: 'ATTESTATION', pdfUrl: '' },
    })
  }

  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/verify/${document.uuid}`
  const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 120,
  })

  const pdfBuffer = await generateAttestationPDF({
    documentId: document.uuid,
    qrCodeDataUrl,
    etudiant: stage.etudiant,
    encadreur: stage.encadreur,
    offre: {
      titre: stage.candidature.offre.titre,
      duree: stage.candidature.offre.duree,
      localisation: stage.candidature.offre.localisation,
    },
    entreprise: {
      nom: stage.candidature.offre.entreprise?.nom ?? '',
      prenom: stage.candidature.offre.entreprise?.prenom ?? '',
    },
    stage: {
      dateDebut: stage.dateDebut,
      dateFin: stage.dateFin,
      note: stage.note,
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
      'Content-Disposition': `attachment; filename="attestation-stage-${stageId}.pdf"`,
    },
  })
}