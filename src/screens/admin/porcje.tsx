import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { adminToggleAbsenceAction } from "@/lib/actions/admin-actions";
import {
  formatPl,
  parseDateKey,
  startOfDay,
  toDateKey,
} from "@/lib/dates";
import { getMealDaysForMonth } from "@/lib/billing";
import { PrintButton } from "@/components/PrintButton";
import { menuSummary } from "@/lib/menu";

export default async function AdminPortionsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const date = params.date
    ? startOfDay(parseDateKey(params.date))
    : startOfDay(new Date());
  const dateKey = toDateKey(date);

  const [children, absences, menu, settings] = await Promise.all([
    prisma.child.findMany({
      where: { active: true },
      orderBy: [{ className: "asc" }, { lastName: "asc" }],
    }),
    prisma.absence.findMany({
      where: { date },
      include: { child: true, reportedBy: true },
    }),
    prisma.menuEntry.findUnique({
      where: { date },
      include: { values: { include: { fieldDef: true } } },
    }),
    prisma.mealSettings.findUnique({ where: { id: "default" } }),
  ]);

  const mealDays = await getMealDaysForMonth(
    date.getFullYear(),
    date.getMonth() + 1,
  );
  const isMealDay = mealDays.some((d) => toDateKey(d) === dateKey);
  const absentIds = new Set(absences.map((a) => a.childId));
  const eating = children.filter((c) => !absentIds.has(c.id));

  const prev = toDateKey(new Date(date.getTime() - 86400000));
  const next = toDateKey(new Date(date.getTime() + 86400000));

  return (
    <>
      <PageHeader
        title="Porcje na dzień"
        description="Lista dla kuchni: kto dostaje obiad, a kto zgłosił brak."
      />

      <div className="no-print mb-3 flex flex-wrap items-end gap-2">
        <Link href={`/admin/porcje?date=${prev}`} className="btn btn-secondary btn-xs">
          ←
        </Link>
        <form action="/admin/porcje" method="get" className="flex gap-2 items-end">
          <div>
            <label className="label">Data</label>
            <input type="date" name="date" defaultValue={dateKey} className="input" />
          </div>
          <button type="submit" className="btn btn-primary btn-xs">
            Pokaż
          </button>
        </form>
        <Link href={`/admin/porcje?date=${next}`} className="btn btn-secondary btn-xs">
          →
        </Link>
        <div className="ml-auto">
          <PrintButton />
        </div>
      </div>

      <div className="panel mb-3 py-2">
        <h2 className="font-display text-xl capitalize">
          {formatPl(date, "EEEE, d MMMM yyyy")}
        </h2>
        {!isMealDay ? (
          <p className="text-warn text-sm font-semibold">Tego dnia nie ma żywienia.</p>
        ) : (
          <p className="font-display text-2xl text-brand">
            {eating.length} porcji
            <span className="text-sm text-ink-soft font-sans font-normal ml-2">
              / {children.length} · {absences.length} bez obiadu
            </span>
          </p>
        )}
        <p className="text-xs text-ink-soft mt-1">
          {menu ? menuSummary(menu.values, 4) || "Brak menu" : "Brak wpisu jadłospisu"}
          {" · "}
          termin zgłoszeń do {settings?.deadlineHour ?? 14}:00 w dniu obiadu
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="panel">
          <h3 className="font-display text-base mb-1">Z obiadem ({eating.length})</h3>
          <table className="compact-table">
            <colgroup>
              <col />
              <col className="col-class" />
              <col className="col-actions" style={{ width: "6.5rem" }} />
            </colgroup>
            <tbody>
              {eating.map((c) => (
                <tr key={c.id}>
                  <td className="font-semibold">
                    {c.lastName} {c.firstName}
                  </td>
                  <td className="col-class text-ink-soft">{c.className}</td>
                  <td className="col-actions no-print">
                    <form action={adminToggleAbsenceAction}>
                      <input type="hidden" name="childId" value={c.id} />
                      <input type="hidden" name="date" value={dateKey} />
                      <input type="hidden" name="onTime" value="on" />
                      <button type="submit" className="btn btn-secondary btn-xs">
                        Nieobecność
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="panel">
          <h3 className="font-display text-base mb-1">Bez obiadu ({absences.length})</h3>
          <table className="compact-table">
            <colgroup>
              <col />
              <col className="col-class" />
              <col className="col-actions" style={{ width: "5.5rem" }} />
            </colgroup>
            <tbody>
              {absences.map((a) => (
                <tr key={a.id}>
                  <td>
                    <span className="font-semibold">
                      {a.child.lastName} {a.child.firstName}
                    </span>
                    <span className="block text-[11px] text-ink-soft">
                      {a.reportedBy.name}
                      {!a.onTime ? " · po terminie" : ""}
                    </span>
                  </td>
                  <td className="col-class text-ink-soft">{a.child.className}</td>
                  <td className="col-actions no-print">
                    <form action={adminToggleAbsenceAction}>
                      <input type="hidden" name="childId" value={a.childId} />
                      <input type="hidden" name="date" value={dateKey} />
                      <button type="submit" className="btn btn-secondary btn-xs">
                        Przywróć
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </>
  );
}
