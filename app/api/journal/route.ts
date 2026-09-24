import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Adaptez l'import de Prisma selon votre structure (ex: '@/lib/prisma' ou '@/prisma')

export async function GET() {
  try {
    const journaux = await prisma.journalDeBord.findMany({
      orderBy: { semaine: 'desc' },
      include: { user: true }
    });
    return NextResponse.json(journaux);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la récupération des journaux' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { semaine, activites, userId } = body;

    if (!semaine || !activites) {
      return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 });
    }

    // Recherche d'un utilisateur par défaut si userId n'est pas fourni
    let targetUserId = userId;
    if (!targetUserId) {
      const firstUser = await prisma.user.findFirst();
      if (firstUser) {
        targetUserId = firstUser.id;
      } else {
        return NextResponse.json({ error: 'Aucun utilisateur trouvé' }, { status: 400 });
      }
    }

    const nouveauJournal = await prisma.journalDeBord.create({
      data: {
        semaine: Number(semaine),
        activites,
        userId: targetUserId,
      },
    });

    return NextResponse.json(nouveauJournal, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erreur serveur lors de la création' }, { status: 500 });
  }
}