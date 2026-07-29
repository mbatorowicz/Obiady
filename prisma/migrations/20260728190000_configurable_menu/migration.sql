-- CreateTable
CREATE TABLE "MenuFieldDef" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MenuEntryValue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "menuEntryId" TEXT NOT NULL,
    "fieldDefId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    CONSTRAINT "MenuEntryValue_menuEntryId_fkey" FOREIGN KEY ("menuEntryId") REFERENCES "MenuEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MenuEntryValue_fieldDefId_fkey" FOREIGN KEY ("fieldDefId") REFERENCES "MenuFieldDef" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MenuEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "imagePath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_MenuEntry" ("id", "date", "createdAt", "updatedAt")
SELECT "id", "date", "createdAt", "updatedAt" FROM "MenuEntry";
DROP TABLE "MenuEntry";
ALTER TABLE "new_MenuEntry" RENAME TO "MenuEntry";
CREATE UNIQUE INDEX "MenuEntry_date_key" ON "MenuEntry"("date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "MenuEntryValue_menuEntryId_fieldDefId_key" ON "MenuEntryValue"("menuEntryId", "fieldDefId");
