import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifierToken } from "@/lib/auth";

function getUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];
  if (!token) return null;
  return verifierToken(token);
}

// GET /api/notifications — Récupérer les notifications de l'utilisateur connecté
export async function GET(req: NextRequest) {
  try {
    const user = getUser(req);
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: "desc" },
    });

    const unreadCount = notifications.filter((n) => !n.lu).length;

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Erreur GET /api/notifications:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH /api/notifications — Marquer une ou toutes les notifications comme lues
export async function PATCH(req: NextRequest) {
  try {
    const user = getUser(req);
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const { id, all } = body;

    if (all) {
      await prisma.notification.updateMany({
        where: { userId: user.userId, lu: false },
        data: { lu: true },
      });
      return NextResponse.json({ message: "Toutes les notifications marquées comme lues" });
    }

    if (id) {
      const notif = await prisma.notification.findUnique({
        where: { id: Number(id) },
      });

      if (!notif || notif.userId !== user.userId) {
        return NextResponse.json({ error: "Notification non trouvée" }, { status: 404 });
      }

      const updated = await prisma.notification.update({
        where: { id: Number(id) },
        data: { lu: true },
      });

      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Paramètres manquants (id ou all)" }, { status: 400 });
  } catch (error) {
    console.error("Erreur PATCH /api/notifications:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/notifications — Supprimer des notifications
export async function DELETE(req: NextRequest) {
  try {
    const user = getUser(req);
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const allRead = searchParams.get("allRead") === "true";

    if (allRead) {
      await prisma.notification.deleteMany({
        where: { userId: user.userId, lu: true },
      });
      return NextResponse.json({ message: "Notifications lues supprimées" });
    }

    if (id) {
      const notif = await prisma.notification.findUnique({
        where: { id: Number(id) },
      });

      if (!notif || notif.userId !== user.userId) {
        return NextResponse.json({ error: "Notification non trouvée" }, { status: 404 });
      }

      await prisma.notification.delete({
        where: { id: Number(id) },
      });

      return NextResponse.json({ message: "Notification supprimée" });
    }

    return NextResponse.json({ error: "Paramètre id ou allRead manquant" }, { status: 400 });
  } catch (error) {
    console.error("Erreur DELETE /api/notifications:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
