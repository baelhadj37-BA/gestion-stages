/*
  Warnings:

  - The primary key for the `candidature` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `etudiantId` on the `candidature` table. All the data in the column will be lost.
  - You are about to drop the column `lettreUrl` on the `candidature` table. All the data in the column will be lost.
  - You are about to drop the column `score` on the `candidature` table. All the data in the column will be lost.
  - The primary key for the `offre` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `entrepriseId` on the `offre` table. All the data in the column will be lost.
  - You are about to drop the column `statut` on the `offre` table. All the data in the column will be lost.
  - The primary key for the `user` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `classe` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `competences` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `matricule` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `motDePasse` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `prenom` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `secteur` on the `user` table. All the data in the column will be lost.
  - Added the required column `entreprise` to the `Offre` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Offre` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `candidature` DROP FOREIGN KEY `Candidature_etudiantId_fkey`;

-- DropForeignKey
ALTER TABLE `candidature` DROP FOREIGN KEY `Candidature_offreId_fkey`;

-- DropForeignKey
ALTER TABLE `notification` DROP FOREIGN KEY `Notification_userId_fkey`;

-- DropForeignKey
ALTER TABLE `offre` DROP FOREIGN KEY `Offre_entrepriseId_fkey`;

-- DropForeignKey
ALTER TABLE `stage` DROP FOREIGN KEY `Stage_candidatureId_fkey`;

-- DropForeignKey
ALTER TABLE `stage` DROP FOREIGN KEY `Stage_encadreurId_fkey`;

-- DropForeignKey
ALTER TABLE `stage` DROP FOREIGN KEY `Stage_etudiantId_fkey`;

-- AlterTable
ALTER TABLE `candidature` DROP PRIMARY KEY,
    DROP COLUMN `etudiantId`,
    DROP COLUMN `lettreUrl`,
    DROP COLUMN `score`,
    ADD COLUMN `userId` VARCHAR(191) NULL,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `offreId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `notification` MODIFY `userId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `offre` DROP PRIMARY KEY,
    DROP COLUMN `entrepriseId`,
    DROP COLUMN `statut`,
    ADD COLUMN `entreprise` VARCHAR(191) NOT NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    ADD COLUMN `userId` VARCHAR(191) NULL,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `tags` VARCHAR(191) NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `stage` MODIFY `etudiantId` VARCHAR(191) NOT NULL,
    MODIFY `encadreurId` VARCHAR(191) NOT NULL,
    MODIFY `candidatureId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `user` DROP PRIMARY KEY,
    DROP COLUMN `classe`,
    DROP COLUMN `competences`,
    DROP COLUMN `matricule`,
    DROP COLUMN `motDePasse`,
    DROP COLUMN `prenom`,
    DROP COLUMN `secteur`,
    ADD COLUMN `password` VARCHAR(191) NOT NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `role` ENUM('ETUDIANT', 'ENTREPRISE', 'ENCADREUR', 'ADMIN') NOT NULL DEFAULT 'ETUDIANT',
    ADD PRIMARY KEY (`id`);

-- AddForeignKey
ALTER TABLE `Offre` ADD CONSTRAINT `Offre_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Candidature` ADD CONSTRAINT `Candidature_offreId_fkey` FOREIGN KEY (`offreId`) REFERENCES `Offre`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Candidature` ADD CONSTRAINT `Candidature_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Stage` ADD CONSTRAINT `Stage_etudiantId_fkey` FOREIGN KEY (`etudiantId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Stage` ADD CONSTRAINT `Stage_encadreurId_fkey` FOREIGN KEY (`encadreurId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Stage` ADD CONSTRAINT `Stage_candidatureId_fkey` FOREIGN KEY (`candidatureId`) REFERENCES `Candidature`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
