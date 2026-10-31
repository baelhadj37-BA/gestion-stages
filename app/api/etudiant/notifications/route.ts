import { NextRequest, NextResponse } from 'next/server'
import { verifierToken } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1]
  if (!token) return NextResponse.json({ message: 'Token manquant' }, { status: 401 })
  const utilisateur = verifierToken(token)
  if (!utilisateur || utilisateur.role !== 'ETUDIANT') {
    return NextResponse.json({ message: 'Accès réservé aux étudiants' }, { status: 403 })
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: utilisateur.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const nonLues = notifications.filter(n => !n.lu).length

    return NextResponse.json({
      notifications: notifications.map(n => ({
        id: n.id,
        message: n.message,
        type: n.type,
        lu: n.lu,
        date: n.createdAt,
      })),
      nonLues,
    })
  } catch (error) {
    console.error('[GET /api/etudiant/notifications]', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1]
  if (!token) return NextResponse.json({ message: 'Token manquant' }, { status: 401 })
  const utilisateur = verifierToken(token)
  if (!utilisateur || utilisateur.role !== 'ETUDIANT') {
    return NextResponse.json({ message: 'Accès réservé aux étudiants' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { id } = body

    if (id) {
      await prisma.notification.updateMany({
        where: { id: Number(id), userId: utilisateur.userId },
        data: { lu: true },
      })
    } else {
      await prisma.notification.updateMany({
        where: { userId: utilisateur.userId, lu: false },
        data: { lu: true },
      })
    }

    return NextResponse.json({ message: 'Notification(s) marquée(s) comme lue(s)' })
  } catch (error) {
    console.error('[PATCH /api/etudiant/notifications]', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}