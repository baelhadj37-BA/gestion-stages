/*
  Warnings:

  - The primary key for the `notification` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `type` on the `notification` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `notification` DROP FOREIGN KEY `Notification_userId_fkey`;

-- AlterTable
ALTER TABLE `notification` DROP PRIMARY KEY,
    DROP COLUMN `type`,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `message` TEXT NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
