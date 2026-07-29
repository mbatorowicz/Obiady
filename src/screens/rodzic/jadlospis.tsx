import { prisma } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/ui";
import { MenuThumbsSummary } from "@/components/MenuThumbsSummary";
import { addDays, formatPl, startOfDay } from "@/lib/dates";

export default async function ParentMenuPage() {
  const today = startOfDay(new Date());
  const horizon = addDays(today, 30);

  const menus = await prisma.menuEntry.findMany({
    where: { date: { gte: today, lte: horizon } },
    include: { values: { include: { fieldDef: true } } },
    orderBy: { date: "asc" },
  });

  return (
    <>
      <PageHeader
        title="Jadłospis"
        description="Najbliższe 30 dni. Kliknij zdjęcie, aby powiększyć."
      />

      {menus.length === 0 ? (
        <EmptyState>Brak zaplanowanego jadłospisu na najbliższe dni.</EmptyState>
      ) : (
        <ul className="space-y-2">
          {menus.map((m) => (
            <li key={m.id} className="panel">
              <p className="font-semibold capitalize mb-1.5">
                {formatPl(m.date, "EEEE, d MMMM")}
              </p>
              <MenuThumbsSummary values={m.values} thumbSize={56} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
