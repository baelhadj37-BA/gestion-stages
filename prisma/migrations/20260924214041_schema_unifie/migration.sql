/*
  Warnings:

  - A unique constraint covering the columns `[uuid]` on the table `Convention` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[uuid]` on the table `Document` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Candidature` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Offre` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `candidature` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `convention` ADD COLUMN `qrCodeUrl` VARCHAR(191) NULL,
    ADD COLUMN `uuid` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `document` ADD COLUMN `qrCodeUrl` VARCHAR(191) NULL,
    ADD COLUMN `uuid` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `offre` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    MODIFY `tags` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `user` MODIFY `role` ENUM('ETUDIANT', 'ENTREPRISE', 'ENCADREUR', 'ADMIN') NOT NULL DEFAULT 'ETUDIANT';

-- CreateIndex
CREATE UNIQUE INDEX `Convention_uuid_key` ON `Convention`(`uuid`);

-- CreateIndex
CREATE UNIQUE INDEX `Document_uuid_key` ON `Document`(`uuid`);
