// app/api/entreprise/notifications/route.ts
// GET  — Liste toutes les notifications de l'entreprise connectée
// PATCH — Marquer une ou toutes les notifications comme lues

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifierToken } from '@/lib/auth'

// ─── GET /api/entreprise/notifications ────────────────────────
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const tokenData = verifierToken(token || '')

    if (!tokenData || tokenData.role !== 'ENTREPRISE') {
      return NextResponse.json({ message: 'Accès réservé aux entreprises' }, { status: 403 })
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: Number(tokenData.userId) },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const nonLues = notifications.filter((n) => !n.lu).length

    return NextResponse.json({
      notifications: notifications.map((n) => ({
        id:      n.id,
        message: n.message,
        lu:      n.lu,
        date:    n.createdAt.toISOString(),
      })),
      nonLues,
    })
  } catch (error) {
    console.error('Erreur GET /api/entreprise/notifications:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}

// ─── PATCH /api/entreprise/notifications ──────────────────────
// Body: { id?: number } — si id absent, marque toutes comme lues
export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const tokenData = verifierToken(token || '')

    if (!tokenData || tokenData.role !== 'ENTREPRISE') {
      return NextResponse.json({ message: 'Accès réservé aux entreprises' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const { id } = body

    if (id) {
      // Marquer une seule notification comme lue (vérifier qu'elle appartient à l'utilisateur)
      await prisma.notification.updateMany({
        where: { id: Number(id), userId: Number(tokenData.userId) },
        data:  { lu: true },
      })
    } else {
      // Marquer toutes comme lues
      await prisma.notification.updateMany({
        where: { userId: Number(tokenData.userId), lu: false },
        data:  { lu: true },
      })
    }

    return NextResponse.json({ message: 'Notifications mises à jour' })
  } catch (error) {
    console.error('Erreur PATCH /api/entreprise/notifications:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}