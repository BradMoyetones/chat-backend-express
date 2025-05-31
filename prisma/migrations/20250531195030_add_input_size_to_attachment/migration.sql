/*
  Warnings:

  - You are about to drop the column `url` on the `Attachment` table. All the data in the column will be lost.
  - Added the required column `filename` to the `Attachment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `size` to the `Attachment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Attachment` DROP COLUMN `url`,
    ADD COLUMN `filename` VARCHAR(191) NOT NULL,
    ADD COLUMN `size` INTEGER NOT NULL;
