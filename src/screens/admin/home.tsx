import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { MenuThumbsSummary } from "@/components/MenuThumbsSummary";
import { formatPl, startOfDay, toDateKey } from "@/lib/dates";
import { getMealDaysForMonth } from "@/lib/billing";

export default async function AdminDashboard() {
  const today = startOfDay(new Date());
  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  const [childrenCount, parentsCount, menuToday, absencesToday, unpaid] =
    await Promise.all([
      prisma.child.count({ where: { active: true } }),
      prisma.user.count({ where: { role: "PARENT" } }),
      prisma.menuEntry.findUnique({
        where: { date: today },
        include: { values: { include: { fieldDef: true } } },
      }),
      prisma.absence.findMany({
        where: { date: today },
        include: { child: true },
      }),
      prisma.invoiceMonth.count({
        where: { year, month, status: { in: ["UNPAID", "PARTIAL"] } },
      }),
    ]);

  const mealDays = await getMealDaysForMonth(year, month);
  const isMealDay = mealDays.some((d) => toDateKey(d) === toDateKey(today));
  const portions = Math.max(0, childrenCount - absencesToday.length);

  return (
    <>
      <PageHeader
        title="Start"
        description={`Dziś: ${formatPl(today, "EEEE, d MMMM yyyy")}.`}
      />

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        <Stat label="Dzieci w żywieniu" value={String(childrenCount)} />
        <Stat label="Konta rodziców" value={String(parentsCount)} />
        <Stat
          label="Porcje na dziś"
          value={isMealDay ? String(portions) : "—"}
          hint={
            isMealDay
              ? `${absencesToday.length} zgłoszeń braku obiadu`
              : "Dzień bez żywienia"
          }
        />
        <Stat label="Do zapłaty" value={String(unpaid)} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="panel">
          <h2 className="font-display text-lg mb-1">Jadłospis na dziś</h2>
          {menuToday ? (
            <MenuThumbsSummary values={menuToday.values} thumbSize={56} />
          ) : (
            <p className="text-ink-soft text-sm">Brak wpisu w jadłospisie.</p>
          )}
          <Link href="/admin/jadlospis" className="btn btn-secondary btn-xs mt-2">
            Edytuj jadłospis
          </Link>
        </section>

        <section className="panel">
          <h2 className="font-display text-lg mb-1">Na skróty</h2>
          <div className="flex flex-wrap gap-1.5">
            <Link href="/admin/porcje" className="btn btn-primary btn-xs">
              Porcje dla kuchni
            </Link>
            <Link href="/admin/rozliczenia" className="btn btn-secondary btn-xs">
              Rozliczenia
            </Link>
            <Link href="/admin/dzieci" className="btn btn-secondary btn-xs">
              Dzieci
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="panel py-2">
      <p className="text-xs text-ink-soft">{label}</p>
      <p className="font-display text-2xl leading-tight">{value}</p>
      {hint ? <p className="text-[11px] text-ink-soft">{hint}</p> : null}
    </div>
  );
}
