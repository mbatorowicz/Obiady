/**
 * One-off: clear Dish.imagePath values that point at local /uploads/
 * (broken on Vercel). Run with production DATABASE_URL, e.g.:
 *
 *   npx tsx --env-file=.env.local scripts/clear-local-image-paths.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.dish.updateMany({
    where: { imagePath: { startsWith: "/uploads/" } },
    data: { imagePath: null },
  });
  console.log(`Cleared ${result.count} local image path(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
