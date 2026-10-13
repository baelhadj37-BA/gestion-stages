/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `candidature` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `offre` table. All the data in the column will be lost.
  - Made the column `uuid` on table `convention` required. This step will fail if there are existing NULL values in that column.
  - Made the column `uuid` on table `document` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `candidature` DROP COLUMN `updatedAt`;

-- AlterTable
ALTER TABLE `convention` MODIFY `uuid` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `document` MODIFY `uuid` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `journalbord` ADD COLUMN `commentaire` TEXT NULL,
    ADD COLUMN `dateValidation` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `offre` DROP COLUMN `updatedAt`;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `filiere` VARCHAR(191) NULL,
    ADD COLUMN `telephone` VARCHAR(191) NULL;
