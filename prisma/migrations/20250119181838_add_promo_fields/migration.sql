-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Promo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "targetProduct" TEXT DEFAULT '',
    "giftProduct" TEXT DEFAULT '',
    "type" TEXT NOT NULL DEFAULT 'product_target',
    "targetQuantity" INTEGER NOT NULL DEFAULT 1,
    "giftQuantity" INTEGER NOT NULL DEFAULT 1,
    "collectionTarget" TEXT DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Promo" ("createdAt", "giftProduct", "id", "isActive", "shop", "targetProduct", "title") SELECT "createdAt", "giftProduct", "id", "isActive", "shop", "targetProduct", "title" FROM "Promo";
DROP TABLE "Promo";
ALTER TABLE "new_Promo" RENAME TO "Promo";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
