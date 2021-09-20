-- DropForeignKey
ALTER TABLE "Sneaker" DROP CONSTRAINT "Sneaker_brandId_fkey";

-- AddForeignKey
ALTER TABLE "Sneaker" ADD CONSTRAINT "Sneaker_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "Brand.name_unique" RENAME TO "Brand_name_key";

-- RenameIndex
ALTER INDEX "Brand.slug_unique" RENAME TO "Brand_slug_key";

-- RenameIndex
ALTER INDEX "User.email_unique" RENAME TO "User_email_key";

-- RenameIndex
ALTER INDEX "User.username_unique" RENAME TO "User_username_key";
