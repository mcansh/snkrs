/*
  Warnings:

  - You are about to alter the column `size` on the `Sneaker` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - Added the required column `givenName` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `familyName` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Sneaker" ALTER COLUMN "size" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "name",
ADD COLUMN     "givenName" TEXT NOT NULL,
ADD COLUMN     "familyName" TEXT NOT NULL;
