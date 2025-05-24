-- DropForeignKey
ALTER TABLE `Attachment` DROP FOREIGN KEY `Attachment_messageId_fkey`;

-- DropForeignKey
ALTER TABLE `Attachment` DROP FOREIGN KEY `Attachment_userId_fkey`;

-- DropForeignKey
ALTER TABLE `ContactRequest` DROP FOREIGN KEY `ContactRequest_receiverId_fkey`;

-- DropForeignKey
ALTER TABLE `ContactRequest` DROP FOREIGN KEY `ContactRequest_senderId_fkey`;

-- DropForeignKey
ALTER TABLE `Conversation` DROP FOREIGN KEY `Conversation_creatorId_fkey`;

-- DropForeignKey
ALTER TABLE `Message` DROP FOREIGN KEY `Message_conversationId_fkey`;

-- DropForeignKey
ALTER TABLE `Message` DROP FOREIGN KEY `Message_senderId_fkey`;

-- DropForeignKey
ALTER TABLE `MessageRead` DROP FOREIGN KEY `MessageRead_messageId_fkey`;

-- DropForeignKey
ALTER TABLE `MessageRead` DROP FOREIGN KEY `MessageRead_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Participant` DROP FOREIGN KEY `Participant_conversationId_fkey`;

-- DropForeignKey
ALTER TABLE `Participant` DROP FOREIGN KEY `Participant_userId_fkey`;

-- DropIndex
DROP INDEX `Attachment_messageId_fkey` ON `Attachment`;

-- DropIndex
DROP INDEX `Attachment_userId_fkey` ON `Attachment`;

-- DropIndex
DROP INDEX `ContactRequest_receiverId_fkey` ON `ContactRequest`;

-- DropIndex
DROP INDEX `Conversation_creatorId_fkey` ON `Conversation`;

-- DropIndex
DROP INDEX `Message_conversationId_fkey` ON `Message`;

-- DropIndex
DROP INDEX `Message_senderId_fkey` ON `Message`;

-- DropIndex
DROP INDEX `MessageRead_userId_fkey` ON `MessageRead`;

-- DropIndex
DROP INDEX `Participant_conversationId_fkey` ON `Participant`;

-- DropIndex
DROP INDEX `Participant_userId_fkey` ON `Participant`;

-- AddForeignKey
ALTER TABLE `Conversation` ADD CONSTRAINT `Conversation_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Participant` ADD CONSTRAINT `Participant_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Participant` ADD CONSTRAINT `Participant_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `Conversation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `Conversation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MessageRead` ADD CONSTRAINT `MessageRead_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `Message`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MessageRead` ADD CONSTRAINT `MessageRead_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attachment` ADD CONSTRAINT `Attachment_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `Message`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attachment` ADD CONSTRAINT `Attachment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContactRequest` ADD CONSTRAINT `ContactRequest_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContactRequest` ADD CONSTRAINT `ContactRequest_receiverId_fkey` FOREIGN KEY (`receiverId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
