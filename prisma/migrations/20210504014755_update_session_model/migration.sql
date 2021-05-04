/*
  Warnings:

  - You are about to drop the column `sid` on the `Session` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Session.sid_unique";

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "sid";
