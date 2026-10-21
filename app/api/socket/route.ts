// app/api/socket/route.ts
// Endpoint WebSocket pour les notifications temps réel
// Next.js App Router utilise un serveur custom pour Socket.io

import { NextRequest, NextResponse } from 'next/server'
import { verifierToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET — Récupérer les notifications d'un utilisateur
export async function GET(request: NextRequest) {
  try {
    // 1. Vérifier le token
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const tokenData = verifierToken(token || '')

    if (!tokenData) {
      return NextResponse.json(
        { message: 'Non autorisé' },
        { status: 401 }
      )
    }

    // 2. Récupérer les notifications de l'utilisateur
    const notifications = await prisma.notification.findMany({
      where: { userId: tokenData.userId },
      orderBy: { createdAt: 'desc' },
      take: 20 // Les 20 dernières
    })

    // 3. Compter les non lues
    const nonLues = await prisma.notification.count({
      where: {
        userId: tokenData.userId,
        lu: false
      }
    })

    return NextResponse.json({
      message: 'Notifications récupérées',
      notifications,
      nonLues
    })

  } catch (error) {
    console.error('Erreur notifications GET:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// PATCH — Marquer les notifications comme lues
export async function PATCH(request: NextRequest) {
  try {
    // 1. Vérifier le token
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const tokenData = verifierToken(token || '')

    if (!tokenData) {
      return NextResponse.json(
        { message: 'Non autorisé' },
        { status: 401 }
      )
    }

    // 2. Marquer toutes les notifications comme lues
    await prisma.notification.updateMany({
      where: {
        userId: tokenData.userId,
        lu: false
      },
      data: { lu: true }
    })

    return NextResponse.json({
      message: 'Notifications marquées comme lues'
    })

  } catch (error) {
    console.error('Erreur notifications PATCH:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}