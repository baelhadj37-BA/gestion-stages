import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Point d'intégration avec le module Notifications Temps Réel d'Astou (section 3.8 du CDC).
// Version actuelle : enregistre la notification en base (déjà fonctionnel).
// À enrichir par Astou avec le vrai push Socket.io (io.to(userId).emit(...)).
export async function notifierUtilisateur(
  userId: number,
  message: string,
  type: string
) {
  const notification = await prisma.notification.create({
    data: { userId, message, type },
  });

  // TODO (Astou) : émettre l'événement temps réel ici, ex:
  // io.to(`user:${userId}`).emit("notification", notification);

  return notification;
}