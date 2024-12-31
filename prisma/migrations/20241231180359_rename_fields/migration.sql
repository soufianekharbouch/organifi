/*
  Warnings:

  - You are about to drop the column `giftProductId` on the `Promo` table. All the data in the column will be lost.
  - You are about to drop the column `targetProductId` on the `Promo` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Promo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "targetProduct" TEXT,
    "giftProduct" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Promo" ("createdAt", "id", "isActive", "shop", "title") SELECT "createdAt", "id", "isActive", "shop", "title" FROM "Promo";
DROP TABLE "Promo";
ALTER TABLE "new_Promo" RENAME TO "Promo";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
