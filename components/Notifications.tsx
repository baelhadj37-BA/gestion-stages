// components/Notifications.tsx
// Composant de notifications temps réel avec Socket.io

'use client'

import { useState, useEffect, useCallback } from 'react'
import { io } from 'socket.io-client'

interface Notification {
  id: number
  message: string
  type: string
  lu: boolean
  createdAt: string
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [nonLues, setNonLues] = useState(0)
  const [ouvert, setOuvert] = useState(false)

  const chargerNotifications = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const res = await fetch('/api/socket', {
        headers: { authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setNotifications(data.notifications || [])
      setNonLues(data.nonLues || 0)
    } catch (error) {
      console.error('Erreur chargement notifications:', error)
    }
  }, [])

  useEffect(() => {
    // Charger les notifications
    const fetchData = async () => {
      await chargerNotifications()
    }
    fetchData()

    // Connexion Socket.io
    const user = localStorage.getItem('user')
    if (!user) return

    const userData = JSON.parse(user)
    const newSocket = io({ path: '/api/socket' })

    newSocket.on('connect', () => {
      newSocket.emit('rejoindre', userData.id.toString())
    })

    // Recevoir une notification en temps réel
    newSocket.on('notification', (notif: Notification) => {
      setNotifications(prev => [notif, ...prev])
      setNonLues(prev => prev + 1)
    })

    return () => {
      newSocket.disconnect()
    }
  }, [chargerNotifications])

  const marquerCommeLues = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    await fetch('/api/socket', {
      method: 'PATCH',
      headers: { authorization: `Bearer ${token}` }
    })

    setNonLues(0)
    setNotifications(prev => prev.map(n => ({ ...n, lu: true })))
  }

  const iconeType = (type: string) => {
    switch (type) {
      case 'CANDIDATURE': return '📋'
      case 'JOURNAL': return '📝'
      case 'CONVENTION': return '📄'
      case 'ENCADREUR': return '👨‍🏫'
      case 'ALERTE': return '⚠️'
      default: return '🔔'
    }
  }

  return (
    <div className="relative">

      {/* Bouton cloche */}
      <button
        onClick={() => {
          setOuvert(!ouvert)
          if (!ouvert && nonLues > 0) marquerCommeLues()
        }}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
      >
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {/* Badge */}
        {nonLues > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {nonLues > 9 ? '9+' : nonLues}
          </span>
        )}
      </button>

      {/* Panneau notifications */}
      {ouvert && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50">

          {/* En-tête */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-bold text-gray-800">Notifications</h3>
            {nonLues > 0 && (
              <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-medium">
                {nonLues} non lue{nonLues > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Liste */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                <p className="text-2xl mb-2">🔔</p>
                <p className="text-sm">Aucune notification</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div key={notif.id}
                  className={`p-4 border-b hover:bg-gray-50 transition-colors ${!notif.lu ? 'bg-blue-50' : ''}`}>
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{iconeType(notif.type)}</span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notif.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'short',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                    {!notif.lu && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-1 shrink-0"></span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pied */}
          {notifications.length > 0 && (
            <div className="p-3 text-center border-t">
              <button
                onClick={marquerCommeLues}
                className="text-sm text-blue-600 hover:underline"
              >
                Tout marquer comme lu
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}