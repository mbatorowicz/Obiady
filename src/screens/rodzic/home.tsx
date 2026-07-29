import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/ui";
import { AbsenceCalendar } from "@/components/AbsenceCalendar";
import {
  getMealDaysForMonth,
  upsertInvoice,
  formatMoney,
} from "@/lib/billing";
import { toDateKey, monthLabel, formatPl, parseDateKey } from "@/lib/dates";
import { menuSummary } from "@/lib/menu";

export default async function ParentHomePage({
  searchParams,
}: {
  searchParams: Promise<{
    child?: string;
    y?: string;
    m?: string;
    ok?: string;
    day?: string;
  }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const now = new Date();
  const year = Number(params.y) || now.getFullYear();
  const month = Number(params.m) || now.getMonth() + 1;

  const links = await prisma.parentChild.findMany({
    where: { parentId: session!.user.id },
    include: { child: true },
    orderBy: { child: { firstName: "asc" } },
  });

  if (links.length === 0) {
    return (
      <>
        <PageHeader title="Twoje dzieci" />
        <EmptyState>
          Nie masz jeszcze przypisanego dziecka. Poproś szkołę o powiązanie konta.
        </EmptyState>
      </>
    );
  }

  const childId = params.child || links[0]!.childId;
  const current = links.find((l) => l.childId === childId)?.child || links[0]!.child;
  const settings = await prisma.mealSettings.findUnique({ where: { id: "default" } });
  const deadlineHour = settings?.deadlineHour ?? 14;

  const mealDays = await getMealDaysForMonth(year, month);
  const mealKeys = new Set(mealDays.map(toDateKey));
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  const [absences, menus, invoice] = await Promise.all([
    prisma.absence.findMany({
      where: { childId: current.id, date: { gte: start, lte: end } },
    }),
    prisma.menuEntry.findMany({
      where: { date: { gte: start, lte: end } },
      include: { values: { include: { fieldDef: true } } },
    }),
    upsertInvoice(current.id, year, month),
  ]);

  const absentKeys = new Set(absences.map((a) => toDateKey(a.date)));
  const menuMap = new Map(
    menus.map((m) => [toDateKey(m.date), menuSummary(m.values)]),
  );

  const dayInfos = [...mealKeys].map((dateKey) => ({
    dateKey,
    hasMeals: true,
    absent: absentKeys.has(dateKey),
    menuSummary: menuMap.get(dateKey) || null,
  }));

  const prev =
    month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };
  const next =
    month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };

  return (
    <>
      <PageHeader
        title={`Cześć, ${session!.user.name.split(" ")[0]}`}
        description="Zaznacz dni bez obiadu — kuchnia nie przygotuje porcji."
      />

      {params.ok === "added" || params.ok === "removed" ? (
        <div className="toast-ok" role="status">
          {params.ok === "added"
            ? `Zapisano brak obiadu${
                params.day
                  ? ` na ${formatPl(parseDateKey(params.day), "d MMMM")}`
                  : ""
              }.`
            : `Przywrócono obiad${
                params.day
                  ? ` na ${formatPl(parseDateKey(params.day), "d MMMM")}`
                  : ""
              }.`}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-1.5 mb-3">
        {links.map((l) => (
          <Link
            key={l.childId}
            href={`/rodzic?child=${l.childId}&y=${year}&m=${month}`}
            className={`btn btn-xs ${
              l.childId === current.id ? "btn-primary" : "btn-secondary"
            }`}
          >
            {l.child.firstName} {l.child.lastName}
            <span className="opacity-70">· {l.child.className}</span>
          </Link>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.4fr_0.8fr]">
        <section className="panel">
          <div className="mb-2 flex gap-1">
            <Link
              href={`/rodzic?child=${current.id}&y=${prev.y}&m=${prev.m}`}
              className="btn btn-secondary btn-xs"
            >
              ←
            </Link>
            <Link
              href={`/rodzic?child=${current.id}&y=${next.y}&m=${next.m}`}
              className="btn btn-secondary btn-xs"
            >
              →
            </Link>
          </div>
          <AbsenceCalendar
            childId={current.id}
            year={year}
            month={month}
            days={dayInfos}
            deadlineHour={deadlineHour}
          />
        </section>

        <aside className="space-y-3">
          <div className="panel">
            <h2 className="font-display text-lg mb-0.5">Do zapłaty</h2>
            <p className="text-ink-soft text-xs capitalize">{monthLabel(year, month)}</p>
            <p className="font-display text-3xl mt-1 text-brand">
              {formatMoney(invoice.amount)}
            </p>
            <dl className="mt-2 space-y-1 text-xs">
              <div className="flex justify-between gap-2">
                <dt className="text-ink-soft">Dni z żywieniem</dt>
                <dd>{invoice.mealDays}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-ink-soft">Brak obiadu (w terminie)</dt>
                <dd>{invoice.excusedAbsences}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-ink-soft">Dni do zapłaty</dt>
                <dd>{invoice.billableDays}</dd>
              </div>
            </dl>
            <Link href="/rodzic/platnosci" className="btn btn-primary w-full mt-3 btn-xs">
              Jak zapłacić
            </Link>
          </div>
          <div className="panel text-xs text-ink-soft">
            Termin zgłoszeń: do {deadlineHour}:00 w dniu obiadu. Przy dniu widać
            skrót jadłospisu.
          </div>
        </aside>
      </div>
    </>
  );
}
