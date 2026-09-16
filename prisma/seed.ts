import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Nettoyage dans l'ordre des relations
  await prisma.candidature.deleteMany();
  await prisma.offre.deleteMany();

  // 2. Insertion des données
  await prisma.offre.createMany({
    data: [
      {
        titre: 'Développeur Fullstack Next.js',
        entreprise: 'Tech Sénégal',
        localisation: 'Dakar',
        duree: '6 mois',
        description: "Conception et développement d'applications web modernes avec Next.js, React et Prisma.",
      },
      {
        titre: 'Stagiaire Frontend Angular',
        entreprise: 'Innov Dakar',
        localisation: 'Dakar',
        duree: '3 mois',
        description: "Intégration d'interfaces utilisateur dynamiques et consommation d'APIs REST.",
      },
      {
        titre: 'Développeur Backend Java Spring Boot',
        entreprise: 'Finance Soft',
        localisation: 'Saint-Louis',
        duree: '6 mois',
        description: 'Développement de microservices robustes et gestion de bases de données PostgreSQL.',
      },
    ],
  });

  console.log('✅ Base de données initialisée avec succès !');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });