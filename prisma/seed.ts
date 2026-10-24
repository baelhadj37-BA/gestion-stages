import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hash = await bcrypt.hash('password123', 12)

  // ── Utilisateurs ──
  const entreprise = await prisma.user.upsert({
    where: { email: 'atos@test.sn' },
    update: {},
    create: { nom: 'ATOS', prenom: 'Sénégal', email: 'atos@test.sn', motDePasse: hash, role: 'ENTREPRISE', secteur: 'Informatique' },
  })

  const etudiant = await prisma.user.upsert({
    where: { email: 'fatou@test.sn' },
    update: {},
    create: { nom: 'Diop', prenom: 'Fatou', email: 'fatou@test.sn', motDePasse: hash, role: 'ETUDIANT', classe: 'L3 GL', matricule: 'L3GL2026-001' },
  })

  const encadreur = await prisma.user.upsert({
    where: { email: 'sow@ipd.sn' },
    update: {},
    create: { nom: 'Sow', prenom: 'Moussa', email: 'sow@ipd.sn', motDePasse: hash, role: 'ENCADREUR' },
  })

  // ── Offres ──
  const offre1 = await prisma.offre.create({
    data: {
      titre: 'Stage développeur Full Stack',
      description: "Stage de fin d'études en développement web React/Node.js",
      duree: '3 mois',
      localisation: 'Dakar',
      tags: 'JavaScript,React,Node.js',
      statut: 'PUBLIEE',
      entrepriseId: entreprise.id,
    },
  })

  const offre2 = await prisma.offre.create({
    data: {
      titre: 'Stage Data Analyst',
      description: 'Analyse de données et reporting avec Python et Power BI',
      duree: '2 mois',
      localisation: 'Dakar',
      tags: 'Python,SQL,Power BI',
      statut: 'PUBLIEE',
      entrepriseId: entreprise.id,
    },
  })

  await prisma.offre.create({
    data: {
      titre: 'Stage DevOps',
      description: 'Mise en place de pipelines CI/CD et gestion des serveurs',
      duree: '4 mois',
      localisation: 'Dakar',
      tags: 'Docker,CI/CD,Linux',
      statut: 'EN_ATTENTE',
      entrepriseId: entreprise.id,
    },
  })

  // ── Candidatures ──
  const candidature1 = await prisma.candidature.create({
    data: {
      cvUrl: '/uploads/cv-fatou.pdf',
      statut: 'ACCEPTEE',
      etudiantId: etudiant.id,
      offreId: offre1.id,
    },
  })

  await prisma.candidature.create({
    data: {
      cvUrl: '/uploads/cv-fatou-2.pdf',
      statut: 'EN_ATTENTE',
      etudiantId: etudiant.id,
      offreId: offre2.id,
    },
  })

  // ── Stage ──
  await prisma.stage.create({
    data: {
      dateDebut: new Date('2026-09-01'),
      dateFin: new Date('2026-12-01'),
      etudiantId: etudiant.id,
      encadreurId: encadreur.id,
      candidatureId: candidature1.id,
    },
  })

  // ── Notification ──
  await prisma.notification.create({
    data: {
      message: 'Votre candidature pour "Stage développeur Full Stack" a été acceptée.',
      type: 'CANDIDATURE',
      userId: etudiant.id,
    },
  })

  console.log('✅ Seed terminé')
  console.log('Comptes (mot de passe : password123) :')
  console.log('  admin@ipd.sn    → ADMIN (déjà en base)')
  console.log('  atos@test.sn    → ENTREPRISE')
  console.log('  fatou@test.sn   → ETUDIANT')
  console.log('  sow@ipd.sn      → ENCADREUR')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())