import { PrismaClient } from "@prisma/client";
import { chiffrerMotDePasse } from "../lib/auth";

const prisma = new PrismaClient();

async function main() {
  const motDePasseHash = await chiffrerMotDePasse("password123");

  // 1. Créer un étudiant
  const etudiant = await prisma.user.create({
    data: {
      nom: "Diop",
      prenom: "Fatou",
      email: "etudiant@test.com",
      motDePasse: motDePasseHash,
      role: "ETUDIANT",
      matricule: "L3GL2026-001",
      classe: "L3 Génie Logiciel",
      competences: "JavaScript,React,SQL",
    },
  });

  // 2. Créer une entreprise (le "maître de stage")
  const entreprise = await prisma.user.create({
    data: {
      nom: "TechCorp",
      prenom: "SARL",
      email: "entreprise@test.com",
      motDePasse: motDePasseHash,
      role: "ENTREPRISE",
      secteur: "Développement logiciel",
    },
  });

  // 3. Créer un encadreur pédagogique
  const encadreur = await prisma.user.create({
    data: {
      nom: "Sow",
      prenom: "Moussa",
      email: "encadreur@test.com",
      motDePasse: motDePasseHash,
      role: "ENCADREUR",
    },
  });

  // 4. Créer une offre publiée par l'entreprise
  const offre = await prisma.offre.create({
    data: {
      titre: "Stage développeur Full Stack",
      description: "Stage de fin d'études en développement web",
      duree: "3 mois",
      localisation: "Dakar",
      tags: "JavaScript,React,Node.js",
      statut: "PUBLIEE",
      entrepriseId: entreprise.id,
    },
  });

  // 5. Créer une candidature acceptée
  const candidature = await prisma.candidature.create({
    data: {
      cvUrl: "/uploads/cv-fatou-diop.pdf",
      statut: "ACCEPTEE",
      etudiantId: etudiant.id,
      offreId: offre.id,
    },
  });

  // 6. Créer le stage correspondant
  const stage = await prisma.stage.create({
    data: {
      dateDebut: new Date("2026-09-01"),
      dateFin: new Date("2026-12-01"),
      etudiantId: etudiant.id,
      encadreurId: encadreur.id,
      candidatureId: candidature.id,
    },
  });

  console.log("Données de test créées :");
  console.log({
    etudiantId: etudiant.id,
    entrepriseId: entreprise.id,
    encadreurId: encadreur.id,
    stageId: stage.id,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });