-- AlterTable
ALTER TABLE "Dish" ADD COLUMN "fieldDefId" TEXT;

-- Backfill: most common MenuEntryValue.fieldDefId per dish
UPDATE "Dish" d
SET "fieldDefId" = sub."fieldDefId"
FROM (
  SELECT DISTINCT ON ("dishId") "dishId", "fieldDefId"
  FROM (
    SELECT "dishId", "fieldDefId", COUNT(*)::int AS cnt
    FROM "MenuEntryValue"
    GROUP BY "dishId", "fieldDefId"
  ) counts
  ORDER BY "dishId", cnt DESC
) sub
WHERE d.id = sub."dishId";

-- Fallback: first MenuFieldDef by sortOrder
UPDATE "Dish"
SET "fieldDefId" = (SELECT id FROM "MenuFieldDef" ORDER BY "sortOrder" ASC LIMIT 1)
WHERE "fieldDefId" IS NULL;

-- AlterTable
ALTER TABLE "Dish" ALTER COLUMN "fieldDefId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Dish_fieldDefId_idx" ON "Dish"("fieldDefId");

-- AddForeignKey
ALTER TABLE "Dish" ADD CONSTRAINT "Dish_fieldDefId_fkey" FOREIGN KEY ("fieldDefId") REFERENCES "MenuFieldDef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
