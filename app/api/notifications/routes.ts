import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Récupérer les notifications de l'utilisateur connecté
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Erreur GET /api/notifications:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des notifications' },
      { status: 500 }
    );
  }
}

// PATCH: Marquer une notification (ou toutes) comme lue(s)
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, userId } = body;

    if (id) {
      await prisma.notification.update({
        where: { id: String(id) },
        data: { lu: true },
      });
    } else if (userId) {
      await prisma.notification.updateMany({
        where: { userId: String(userId), lu: false },
        data: { lu: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur PATCH /api/notifications:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des notifications' },
      { status: 500 }
    );
  }
}