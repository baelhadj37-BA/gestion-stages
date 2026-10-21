// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { chiffrerMotDePasse, creerToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nom, prenom, email, motDePasse, role, matricule, classe, secteur, competences } = body;

    if (!nom || !prenom || !email || !motDePasse || !role) {
      return NextResponse.json(
        { message: "Tous les champs obligatoires doivent être renseignés" },
        { status: 400 }
      );
    }

    const utilisateurExistant = await prisma.user.findUnique({
      where: { email },
    });

    if (utilisateurExistant) {
      return NextResponse.json(
        { message: "Cet email est déjà utilisé" },
        { status: 400 }
      );
    }

    const motDePasseChiffre = await chiffrerMotDePasse(motDePasse);

    const nouvelUtilisateur = await prisma.user.create({
      data: {
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: email.trim(),
        motDePasse: motDePasseChiffre,
        role,
        matricule: matricule ? matricule.trim() : null,
        classe: classe ? classe.trim() : null,
        secteur: secteur ? secteur.trim() : null,
        competences: competences ? competences.trim() : null,
      },
    });

    const token = creerToken(nouvelUtilisateur.id, nouvelUtilisateur.role);

    return NextResponse.json(
      {
        message: "Inscription réussie",
        token,
        utilisateur: {
          id: nouvelUtilisateur.id,
          nom: nouvelUtilisateur.nom,
          prenom: nouvelUtilisateur.prenom,
          email: nouvelUtilisateur.email,
          role: nouvelUtilisateur.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur inscription:", error);
    return NextResponse.json(
      { message: "Erreur serveur lors de l'inscription" },
      { status: 500 }
    );
  }
}