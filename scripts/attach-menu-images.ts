import { copyFile, mkdir } from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ASSETS = path.join(
  process.env.USERPROFILE || "",
  ".cursor",
  "projects",
  "c-Users-mbato-OneDrive-Desktop-Apps-Obiady",
  "assets",
);

const UPLOAD = path.join(process.cwd(), "public", "uploads", "menu");

const IMAGE_BY_VALUE: { match: RegExp; file: string }[] = [
  { match: /^pomidorowa/i, file: "dish-zupa-pomidorowa.png" },
  { match: /^ogórkowa|^ogorkowa/i, file: "dish-zupa-ogorkowa.png" },
  { match: /^rosół|^rosol/i, file: "dish-zupa-rosol.png" },
  { match: /^jarzynowa/i, file: "dish-zupa-jarzynowa.png" },
  { match: /^grochówka|^grochowka/i, file: "dish-zupa-grochowka.png" },
  { match: /kotlet/i, file: "dish-danie-kotlet.png" },
  { match: /spaghetti/i, file: "dish-danie-spaghetti.png" },
  { match: /ryba/i, file: "dish-danie-ryba.png" },
  { match: /naleśniki|nalesniki/i, file: "dish-danie-nalesniki.png" },
  { match: /kurczak/i, file: "dish-danie-kurczak.png" },
  { match: /^kompot/i, file: "dish-napoj-kompot.png" },
  { match: /^herbata/i, file: "dish-napoj-herbata.png" },
  { match: /^sok/i, file: "dish-napoj-sok.png" },
  { match: /^kakao/i, file: "dish-napoj-kakao.png" },
];

async function main() {
  await mkdir(UPLOAD, { recursive: true });

  const values = await prisma.menuEntryValue.findMany({
    include: { fieldDef: true },
  });

  for (const row of values) {
    const rule = IMAGE_BY_VALUE.find((r) => r.match.test(row.value));
    if (!rule) {
      console.log("skip", row.fieldDef.label, row.value);
      continue;
    }

    const destName = `${row.id}-${rule.file}`;
    const src = path.join(ASSETS, rule.file);
    const dest = path.join(UPLOAD, destName);
    await copyFile(src, dest);

    const imagePath = `/uploads/menu/${destName}`;
    await prisma.menuEntryValue.update({
      where: { id: row.id },
      data: { imagePath },
    });
    console.log("ok", row.fieldDef.label, row.value, "->", imagePath);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
