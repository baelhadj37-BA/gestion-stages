// app/api/auth/login/route.ts
// Cette route gère la connexion d'un utilisateur existant
// Méthode : POST
// URL : /api/auth/login

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifierMotDePasse, creerToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // 1. Récupérer les données envoyées par le formulaire
    const body = await request.json()
    const { email, motDePasse } = body

    // 2. Vérifier que les champs sont remplis
    if (!email || !motDePasse) {
      return NextResponse.json(
        { message: 'Email et mot de passe obligatoires' },
        { status: 400 }
      )
    }

    // 3. Chercher l'utilisateur dans la base de données
    const utilisateur = await prisma.user.findUnique({
      where: { email }
    })

    // 4. Si l'utilisateur n'existe pas
    if (!utilisateur) {
      return NextResponse.json(
        { message: 'Email ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    // 5. Vérifier si le mot de passe est correct
    const motDePasseCorrect = await verifierMotDePasse(
      motDePasse,
      utilisateur.motDePasse
    )

    // 6. Si le mot de passe est incorrect
    if (!motDePasseCorrect) {
      return NextResponse.json(
        { message: 'Email ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    // 7. Créer le token JWT
    const token = creerToken(utilisateur.id, utilisateur.role)

    // 8. Retourner le token et les infos de l'utilisateur
    return NextResponse.json(
      {
        message: 'Connexion réussie',
        token,
        utilisateur: {
          id: utilisateur.id,
          nom: utilisateur.nom,
          prenom: utilisateur.prenom,
          email: utilisateur.email,
          role: utilisateur.role
        }
      },
      { status: 200 }
    )

  } catch (error) {
    // Si une erreur inattendue se produit
    console.error('Erreur connexion:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}