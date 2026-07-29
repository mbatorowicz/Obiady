import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  addDays,
  defaultMealDaysInMonth,
  format,
  startOfDay,
} from "../src/lib/dates";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("haslo123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "intendentka@szkola.pl" },
    update: {},
    create: {
      email: "intendentka@szkola.pl",
      name: "Anna Intendentka",
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const parent = await prisma.user.upsert({
    where: { email: "rodzic@example.com" },
    update: {},
    create: {
      email: "rodzic@example.com",
      name: "Jan Kowalski",
      passwordHash,
      role: Role.PARENT,
    },
  });

  await prisma.mealSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      mealPrice: 12.5,
      bankAccount: "12 3456 7890 1234 5678 9012 3456",
      bankRecipient: "Szkoła Podstawowa nr 1",
      deadlineHour: 14,
    },
  });

  const fieldSoup = await prisma.menuFieldDef.upsert({
    where: { id: "field-soup" },
    update: { label: "Zupa", sortOrder: 0, required: false, active: true },
    create: {
      id: "field-soup",
      label: "Zupa",
      sortOrder: 0,
      required: false,
      active: true,
    },
  });

  const fieldMain = await prisma.menuFieldDef.upsert({
    where: { id: "field-main" },
    update: { label: "Danie główne", sortOrder: 1, required: true, active: true },
    create: {
      id: "field-main",
      label: "Danie główne",
      sortOrder: 1,
      required: true,
      active: true,
    },
  });

  const fieldDrink = await prisma.menuFieldDef.upsert({
    where: { id: "field-drink" },
    update: { label: "Napój", sortOrder: 2, required: false, active: true },
    create: {
      id: "field-drink",
      label: "Napój",
      sortOrder: 2,
      required: false,
      active: true,
    },
  });

  const jan = await prisma.child.upsert({
    where: { id: "seed-child-jan" },
    update: {},
    create: {
      id: "seed-child-jan",
      firstName: "Jan",
      lastName: "Kowalski",
      className: "3A",
      active: true,
    },
  });

  const ola = await prisma.child.upsert({
    where: { id: "seed-child-ola" },
    update: {},
    create: {
      id: "seed-child-ola",
      firstName: "Ola",
      lastName: "Kowalska",
      className: "1B",
      active: true,
    },
  });

  await prisma.parentChild.upsert({
    where: { parentId_childId: { parentId: parent.id, childId: jan.id } },
    update: {},
    create: { parentId: parent.id, childId: jan.id },
  });

  await prisma.parentChild.upsert({
    where: { parentId_childId: { parentId: parent.id, childId: ola.id } },
    update: {},
    create: { parentId: parent.id, childId: ola.id },
  });

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const days = defaultMealDaysInMonth(year, month);

  const sampleMenus = [
    { soup: "Pomidorowa", main: "Kotlet schabowy, dba ziemniaki, surówka", drink: "Kompot" },
    { soup: "Ogórkowa", main: "Spaghetti bolognese", drink: "Herbata" },
    { soup: "Rosół", main: "Ryba panierowana, ryż, marchewka", drink: "Sok" },
    { soup: "Jarzynowa", main: "Naleśniki z serem", drink: "Kakao" },
    { soup: "Grochówka", main: "Kurczak pieczony, kasza, buraczki", drink: "Kompot" },
  ];

  // fix typo in first sample
  sampleMenus[0]!.main = "Kotlet schabowy, ziemniaki, surówka";

  for (let i = 0; i < days.length; i++) {
    const date = startOfDay(days[i]!);
    const sample = sampleMenus[i % sampleMenus.length]!;
    const entry = await prisma.menuEntry.upsert({
      where: { date },
      update: {},
      create: { date },
    });

    await prisma.menuEntryValue.upsert({
      where: {
        menuEntryId_fieldDefId: {
          menuEntryId: entry.id,
          fieldDefId: fieldSoup.id,
        },
      },
      update: { value: sample.soup },
      create: {
        menuEntryId: entry.id,
        fieldDefId: fieldSoup.id,
        value: sample.soup,
      },
    });
    await prisma.menuEntryValue.upsert({
      where: {
        menuEntryId_fieldDefId: {
          menuEntryId: entry.id,
          fieldDefId: fieldMain.id,
        },
      },
      update: { value: sample.main },
      create: {
        menuEntryId: entry.id,
        fieldDefId: fieldMain.id,
        value: sample.main,
      },
    });
    await prisma.menuEntryValue.upsert({
      where: {
        menuEntryId_fieldDefId: {
          menuEntryId: entry.id,
          fieldDefId: fieldDrink.id,
        },
      },
      update: { value: sample.drink },
      create: {
        menuEntryId: entry.id,
        fieldDefId: fieldDrink.id,
        value: sample.drink,
      },
    });
  }

  const tomorrow = startOfDay(addDays(now, 1));
  if (!days.some((d) => format(d, "yyyy-MM-dd") === format(tomorrow, "yyyy-MM-dd"))) {
    const entry = await prisma.menuEntry.upsert({
      where: { date: tomorrow },
      update: {},
      create: { date: tomorrow },
    });
    const sample = sampleMenus[0]!;
    await prisma.menuEntryValue.upsert({
      where: {
        menuEntryId_fieldDefId: {
          menuEntryId: entry.id,
          fieldDefId: fieldMain.id,
        },
      },
      update: { value: sample.main },
      create: {
        menuEntryId: entry.id,
        fieldDefId: fieldMain.id,
        value: sample.main,
      },
    });
  }

  const sampleDay = days.find((d) => d > now) || days[days.length - 1]!;
  await prisma.absence.upsert({
    where: {
      childId_date: { childId: jan.id, date: startOfDay(sampleDay) },
    },
    update: {},
    create: {
      childId: jan.id,
      date: startOfDay(sampleDay),
      reportedById: parent.id,
      onTime: true,
    },
  });

  const { upsertInvoice } = await import("../src/lib/billing");
  await upsertInvoice(jan.id, year, month);
  await upsertInvoice(ola.id, year, month);

  console.log("Seed OK");
  console.log("Admin:", admin.email, "/ haslo123");
  console.log("Rodzic:", parent.email, "/ haslo123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
