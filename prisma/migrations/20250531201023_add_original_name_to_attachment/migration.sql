/*
  Warnings:

  - Added the required column `originalName` to the `Attachment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Attachment` ADD COLUMN `originalName` VARCHAR(191) NOT NULL;
