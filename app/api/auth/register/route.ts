import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nom, prenom, email, password, role, secteur, telephone } = body

    if (!nom || !prenom || !email || !password || !role)
      return NextResponse.json(
        { message: 'Champs obligatoires : nom, prenom, email, password, role' },
        { status: 400 }
      )

    const exist = await prisma.user.findUnique({ where: { email } })
    if (exist)
      return NextResponse.json({ message: 'Email déjà utilisé' }, { status: 409 })

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        nom,
        prenom,
        email,
        password: hashedPassword,
        role,
        secteur: secteur || null,
        telephone: telephone || null,
      },
    })

    return NextResponse.json(
      { message: 'Compte créé avec succès', user: { id: user.id, email: user.email, role: user.role } },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erreur POST /api/auth/register:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}