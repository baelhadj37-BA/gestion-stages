// app/api/etudiant/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifierToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET — récupérer les notifications de l'étudiant connecté
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ message: 'Token manquant' }, { status: 401 })
    const utilisateur = verifierToken(token)
    if (!utilisateur || utilisateur.role !== 'ETUDIANT') {
      return NextResponse.json({ message: 'Accès réservé aux étudiants' }, { status: 403 })
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: utilisateur.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error('[GET /api/etudiant/notifications]', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}

// PATCH — marquer une notification comme lue
export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ message: 'Token manquant' }, { status: 401 })
    const utilisateur = verifierToken(token)
    if (!utilisateur || utilisateur.role !== 'ETUDIANT') {
      return NextResponse.json({ message: 'Accès réservé aux étudiants' }, { status: 403 })
    }

    const { id, toutMarquer } = await request.json()

    if (toutMarquer) {
      await prisma.notification.updateMany({
        where: { userId: utilisateur.userId, lu: false },
        data: { lu: true },
      })
      return NextResponse.json({ message: 'Toutes les notifications marquées comme lues' })
    }

    if (id) {
      await prisma.notification.update({
        where: { id },
        data: { lu: true },
      })
      return NextResponse.json({ message: 'Notification marquée comme lue' })
    }

    return NextResponse.json({ message: 'id ou toutMarquer requis' }, { status: 400 })
  } catch (error) {
    console.error('[PATCH /api/etudiant/notifications]', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}