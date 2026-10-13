// lib/socket.ts
// Configuration Socket.io pour les notifications temps réel

import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'

let io: SocketIOServer | null = null

// Initialiser Socket.io
export function initSocket(httpServer: HTTPServer) {
  if (io) return io

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    path: '/api/socket'
  })

  io.on('connection', (socket) => {
    console.log(`✅ Client connecté : ${socket.id}`)

    // L'utilisateur rejoint sa salle privée
    socket.on('rejoindre', (userId: string) => {
      socket.join(`user_${userId}`)
      console.log(`👤 User ${userId} connecté`)
    })

    socket.on('disconnect', () => {
      console.log(`❌ Client déconnecté : ${socket.id}`)
    })
  })

  return io
}

// Envoyer une notification à un utilisateur
export function envoyerNotification(
  userId: number,
  notification: { message: string; type: string; createdAt: string }
) {
  if (!io) return
  io.to(`user_${userId}`).emit('notification', notification)
}

export function getIO() {
  return io
}