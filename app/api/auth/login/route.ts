import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { genererToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password)
      return NextResponse.json({ message: 'Email et password obligatoires' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user)
      return NextResponse.json({ message: 'Identifiants invalides' }, { status: 401 })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid)
      return NextResponse.json({ message: 'Identifiants invalides' }, { status: 401 })

    const token = genererToken({ userId: user.id, role: user.role })

    return NextResponse.json({
      message: 'Connexion réussie',
      token,
      user: { id: user.id, nom: user.nom, prenom: user.prenom, email: user.email, role: user.role },
    })
  } catch (error) {
    console.error('Erreur POST /api/auth/login:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}