import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  addDays,
  defaultMealDaysInMonth,
  format,
  startOfDay,
} from "../src/lib/dates";

const prisma = new PrismaClient();

async function upsertDish(name: string) {
  const existing = await prisma.dish.findFirst({ where: { name } });
  if (existing) return existing;
  return prisma.dish.create({ data: { name, active: true } });
}

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

  const dishSoup = {
    Pomidorowa: await upsertDish("Pomidorowa"),
    Ogórkowa: await upsertDish("Ogórkowa"),
    Rosół: await upsertDish("Rosół"),
    Jarzynowa: await upsertDish("Jarzynowa"),
    Grochówka: await upsertDish("Grochówka"),
  };
  const dishMain = {
    Kotlet: await upsertDish("Kotlet schabowy, ziemniaki, surówka"),
    Spaghetti: await upsertDish("Spaghetti bolognese"),
    Ryba: await upsertDish("Ryba panierowana, ryż, marchewka"),
    Nalesniki: await upsertDish("Naleśniki z serem"),
    Kurczak: await upsertDish("Kurczak pieczony, kasza, buraczki"),
  };
  const dishDrink = {
    Kompot: await upsertDish("Kompot"),
    Herbata: await upsertDish("Herbata"),
    Sok: await upsertDish("Sok"),
    Kakao: await upsertDish("Kakao"),
  };

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
    {
      soup: dishSoup.Pomidorowa,
      main: dishMain.Kotlet,
      drink: dishDrink.Kompot,
    },
    {
      soup: dishSoup.Ogórkowa,
      main: dishMain.Spaghetti,
      drink: dishDrink.Herbata,
    },
    { soup: dishSoup.Rosół, main: dishMain.Ryba, drink: dishDrink.Sok },
    {
      soup: dishSoup.Jarzynowa,
      main: dishMain.Nalesniki,
      drink: dishDrink.Kakao,
    },
    {
      soup: dishSoup.Grochówka,
      main: dishMain.Kurczak,
      drink: dishDrink.Kompot,
    },
  ];

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
      update: { dishId: sample.soup.id },
      create: {
        menuEntryId: entry.id,
        fieldDefId: fieldSoup.id,
        dishId: sample.soup.id,
      },
    });
    await prisma.menuEntryValue.upsert({
      where: {
        menuEntryId_fieldDefId: {
          menuEntryId: entry.id,
          fieldDefId: fieldMain.id,
        },
      },
      update: { dishId: sample.main.id },
      create: {
        menuEntryId: entry.id,
        fieldDefId: fieldMain.id,
        dishId: sample.main.id,
      },
    });
    await prisma.menuEntryValue.upsert({
      where: {
        menuEntryId_fieldDefId: {
          menuEntryId: entry.id,
          fieldDefId: fieldDrink.id,
        },
      },
      update: { dishId: sample.drink.id },
      create: {
        menuEntryId: entry.id,
        fieldDefId: fieldDrink.id,
        dishId: sample.drink.id,
      },
    });
  }

  const tomorrow = startOfDay(addDays(now, 1));
  if (
    !days.some((d) => format(d, "yyyy-MM-dd") === format(tomorrow, "yyyy-MM-dd"))
  ) {
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
      update: { dishId: sample.main.id },
      create: {
        menuEntryId: entry.id,
        fieldDefId: fieldMain.id,
        dishId: sample.main.id,
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
