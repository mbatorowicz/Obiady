-- AlterTable
ALTER TABLE "MealSettings" ADD COLUMN "controllerName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "MealSettings" ADD COLUMN "controllerAddress" TEXT NOT NULL DEFAULT '';
ALTER TABLE "MealSettings" ADD COLUMN "privacyEmail" TEXT NOT NULL DEFAULT '';
ALTER TABLE "MealSettings" ADD COLUMN "dataRetentionNote" TEXT NOT NULL DEFAULT 'Dane kont i kart dzieci przechowujemy przez okres korzystania z żywienia oraz przez czas wymagany przepisami o rachunkowości dla rozliczeń i pokwitowań. Po zakończeniu współpracy dane identyfikujące mogą zostać zanonimizowane przy zachowaniu historii rozliczeń.';
