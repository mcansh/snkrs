/*
  Warnings:

  - You are about to drop the column `brand` on the `Sneaker` table. All the data in the column will be lost.
  - Added the required column `brandId` to the `Sneaker` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Sneaker" DROP COLUMN "brand",
ADD COLUMN     "brandId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Brand.name_unique" ON "Brand"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Brand.slug_unique" ON "Brand"("slug");

-- AddForeignKey
ALTER TABLE "Sneaker" ADD FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
