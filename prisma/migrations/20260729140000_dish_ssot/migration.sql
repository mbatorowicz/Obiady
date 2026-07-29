-- CreateTable
CREATE TABLE "Dish" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imagePath" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dish_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Dish_name_idx" ON "Dish"("name");

-- Migrate existing menu values into dishes (unique by name + image)
INSERT INTO "Dish" ("id", "name", "imagePath", "active", "createdAt", "updatedAt")
SELECT
  md5(COALESCE(v."value", '') || '|' || COALESCE(v."imagePath", '')) AS "id",
  v."value" AS "name",
  v."imagePath",
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM (
  SELECT DISTINCT "value", "imagePath"
  FROM "MenuEntryValue"
  WHERE TRIM("value") <> ''
) v;

-- Add dishId (nullable first)
ALTER TABLE "MenuEntryValue" ADD COLUMN "dishId" TEXT;

UPDATE "MenuEntryValue" mev
SET "dishId" = md5(COALESCE(mev."value", '') || '|' || COALESCE(mev."imagePath", ''))
WHERE TRIM(mev."value") <> '';

-- Drop rows that had empty values (no dish)
DELETE FROM "MenuEntryValue" WHERE "dishId" IS NULL;

-- Drop old columns
ALTER TABLE "MenuEntryValue" DROP COLUMN "value";
ALTER TABLE "MenuEntryValue" DROP COLUMN "imagePath";

-- Enforce NOT NULL + FK
ALTER TABLE "MenuEntryValue" ALTER COLUMN "dishId" SET NOT NULL;

CREATE INDEX "MenuEntryValue_dishId_idx" ON "MenuEntryValue"("dishId");

ALTER TABLE "MenuEntryValue" ADD CONSTRAINT "MenuEntryValue_dishId_fkey"
  FOREIGN KEY ("dishId") REFERENCES "Dish"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
