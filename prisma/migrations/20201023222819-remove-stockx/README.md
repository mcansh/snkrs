# Migration `20201023222819-remove-stockx`

This migration has been generated by Logan McAnsh at 10/23/2020, 6:28:19 PM. You
can check out the [state of the schema](./schema.prisma) after the migration.

## Database Steps

```sql
ALTER TABLE "public"."Sneaker" DROP COLUMN "stockxProductId"
```

## Changes

```diff
diff --git schema.prisma schema.prisma
migration 20200915010355-make-user-required-on-sneaker..20201023222819-remove-stockx
--- datamodel.dml
+++ datamodel.dml
@@ -3,31 +3,30 @@
 }
 datasource postgresql {
   provider = "postgresql"
-  url = "***"
+  url = "***"
 }
 model Sneaker {
-  id              String    @default(uuid()) @id
-  model           String
-  colorway        String
-  brand           String
-  size            Float     @default(10)
-  imagePublicId   String
-  price           Int
-  retailPrice     Int
-  purchaseDate    DateTime
-  sold            Boolean   @default(false)
-  soldDate        DateTime?
-  soldPrice       Int?
-  stockxProductId String?
-  User            User      @relation(fields: [userId], references: [id])
-  userId          String
+  id            String    @id @default(uuid())
+  model         String
+  colorway      String
+  brand         String
+  size          Float     @default(10)
+  imagePublicId String
+  price         Int
+  retailPrice   Int
+  purchaseDate  DateTime
+  sold          Boolean   @default(false)
+  soldDate      DateTime?
+  soldPrice     Int?
+  User          User      @relation(fields: [userId], references: [id])
+  userId        String
 }
 model User {
-  id       String    @default(uuid()) @id
+  id       String    @id @default(uuid())
   name     String
   email    String    @unique
   username String    @unique
   password String
```
