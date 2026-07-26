// app/api/auth/register/route.ts
// Cette route gère l'inscription d'un nouvel utilisateur
// Méthode : POST
// URL : /api/auth/register

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { chiffrerMotDePasse, creerToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // 1. Récupérer les données envoyées par le formulaire
    const body = await request.json()
    const { nom, prenom, email, motDePasse, role } = body

    // 2. Vérifier que tous les champs obligatoires sont remplis
    if (!nom || !prenom || !email || !motDePasse || !role) {
      return NextResponse.json(
        { message: 'Tous les champs sont obligatoires' },
        { status: 400 }
      )
    }

    // 3. Vérifier si l'email existe déjà dans la base de données
    const utilisateurExistant = await prisma.user.findUnique({
      where: { email }
    })

    if (utilisateurExistant) {
      return NextResponse.json(
        { message: 'Cet email est déjà utilisé' },
        { status: 400 }
      )
    }

    // 4. Chiffrer le mot de passe avant de le sauvegarder
    const motDePasseChiffre = await chiffrerMotDePasse(motDePasse)

    // 5. Créer l'utilisateur dans la base de données
    const nouvelUtilisateur = await prisma.user.create({
      data: {
        nom,
        prenom,
        email,
        motDePasse: motDePasseChiffre,
        role
      }
    })

    // 6. Créer un token JWT
    const token = creerToken(nouvelUtilisateur.id, nouvelUtilisateur.role)

    // 7. Retourner le token et les infos
    return NextResponse.json(
      {
        message: 'Inscription réussie',
        token,
        utilisateur: {
          id: nouvelUtilisateur.id,
          nom: nouvelUtilisateur.nom,
          prenom: nouvelUtilisateur.prenom,
          email: nouvelUtilisateur.email,
          role: nouvelUtilisateur.role
        }
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Erreur inscription:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}