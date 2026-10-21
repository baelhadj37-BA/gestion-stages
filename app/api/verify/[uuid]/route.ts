import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await context.params;

    if (!uuid) {
      return NextResponse.json(
        { valide: false, error: "UUID manquant" },
        { status: 400 }
      );
    }

    const document = await prisma.document.findUnique({
      where: { uuid },
      include: {
        stage: {
          include: {
            etudiant: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                email: true,
                matricule: true,
                classe: true,
              },
            },
            candidature: {
              include: {
                offre: {
                  include: {
                    entreprise: {
                      select: {
                        id: true,
                        nom: true,
                        prenom: true,
                        email: true,
                        secteur: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        {
          valide: false,
          message: "Document invalide ou introuvable",
          uuid,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      valide: true,
      message: "Document authentique et certifié",
      document: {
        id: document.id,
        uuid: document.uuid,
        type: document.type,
        dateGeneration: document.dateGeneration,
        pdfUrl: document.pdfUrl,
        qrCodeUrl: document.qrCodeUrl,
        stage: {
          id: document.stage.id,
          dateDebut: document.stage.dateDebut,
          dateFin: document.stage.dateFin,
          statut: document.stage.statut,
          etudiant: document.stage.etudiant,
          entreprise:
            document.stage.candidature?.offre?.entreprise ?? null,
          offre: document.stage.candidature?.offre
            ? {
                id: document.stage.candidature.offre.id,
                titre: document.stage.candidature.offre.titre,
                description: document.stage.candidature.offre.description,
              }
            : null,
        },
      },
    });
  } catch (error) {
    console.error("Erreur API vérification document:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la vérification du document" },
      { status: 500 }
    );
  }
}
