import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Assurez-vous que le chemin d'accès vers votre instance Prisma est correct

// GET: Récupérer un journal de bord spécifique par son ID
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const journal = await prisma.journalDeBord.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            nom: true,
            email: true,
          },
        },
        stage: true,
      },
    });

    if (!journal) {
      return NextResponse.json(
        { error: 'Journal de bord introuvable' },
        { status: 404 }
      );
    }

    return NextResponse.json(journal);
  } catch (error) {
    console.error('Erreur lors de la récupération du journal:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération' },
      { status: 500 }
    );
  }
}

// PATCH: Mettre à jour le statut ou le commentaire d'un journal (ex: validation par l'encadreur)
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { statut, commentaire, activites, alerte } = body;

    // Préparation des données à mettre à jour
    const updateData: any = {};

    if (statut !== undefined) updateData.statut = statut;
    if (commentaire !== undefined) updateData.commentaire = commentaire;
    if (activites !== undefined) updateData.activites = activites;
    if (alerte !== undefined) updateData.alerte = alerte;

    const journalMisAJour = await prisma.journalDeBord.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(journalMisAJour);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du journal:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la mise à jour' },
      { status: 500 }
    );
  }
}

// DELETE: Supprimer un journal de bord
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await prisma.journalDeBord.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Journal supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du journal:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la suppression' },
      { status: 500 }
    );
  }
}