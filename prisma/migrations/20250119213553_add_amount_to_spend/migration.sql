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
    "amount_to_spend" REAL NOT NULL DEFAULT 0.0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Promo" ("collectionTarget", "createdAt", "giftProduct", "giftQuantity", "id", "isActive", "shop", "targetProduct", "targetQuantity", "title", "type") SELECT "collectionTarget", "createdAt", "giftProduct", "giftQuantity", "id", "isActive", "shop", "targetProduct", "targetQuantity", "title", "type" FROM "Promo";
DROP TABLE "Promo";
ALTER TABLE "new_Promo" RENAME TO "Promo";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
