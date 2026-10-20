import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifierToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const tokenData = verifierToken(token || '')
    if (!tokenData) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

    const notifications = await prisma.notification.findMany({
      where: { userId: tokenData.userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ notifications, total: notifications.length })
  } catch (error) {
    console.error('Erreur GET /api/notifications:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const tokenData = verifierToken(token || '')
    if (!tokenData) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

    await prisma.notification.updateMany({
      where: { userId: tokenData.userId, lu: false },
      data: { lu: true },
    })

    return NextResponse.json({ message: 'Notifications marquées comme lues' })
  } catch (error) {
    console.error('Erreur PATCH /api/notifications:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}