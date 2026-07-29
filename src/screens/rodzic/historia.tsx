import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, StatusBadge, EmptyState } from "@/components/ui";
import { MenuThumbsSummary } from "@/components/MenuThumbsSummary";
import { formatMoney } from "@/lib/billing";
import { formatPl, monthLabel, startOfDay } from "@/lib/dates";

export default async function ParentHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ child?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;

  const links = await prisma.parentChild.findMany({
    where: { parentId: session!.user.id },
    include: { child: true },
    orderBy: { child: { firstName: "asc" } },
  });

  if (links.length === 0) {
    return (
      <>
        <PageHeader title="Historia" />
        <EmptyState>Brak dzieci na koncie.</EmptyState>
      </>
    );
  }

  const childId = params.child || links[0]!.childId;
  const child = links.find((l) => l.childId === childId)?.child || links[0]!.child;
  const today = startOfDay(new Date());

  const [pastMenus, absences, invoices] = await Promise.all([
    prisma.menuEntry.findMany({
      where: { date: { lt: today } },
      include: { values: { include: { fieldDef: true, dish: true } } },
      orderBy: { date: "desc" },
      take: 40,
    }),
    prisma.absence.findMany({
      where: { childId: child.id },
      orderBy: { date: "desc" },
      take: 40,
    }),
    prisma.invoiceMonth.findMany({
      where: { childId: child.id },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Historia"
        description={`${child.firstName} ${child.lastName}`}
      />

      <div className="flex flex-wrap gap-1.5 mb-3">
        {links.map((l) => (
          <a
            key={l.childId}
            href={`/rodzic/historia?child=${l.childId}`}
            className={`btn btn-xs ${l.childId === child.id ? "btn-primary" : "btn-secondary"}`}
          >
            {l.child.firstName}
          </a>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <section className="panel">
          <h2 className="font-display text-base mb-1">Rozliczenia</h2>
          {invoices.length === 0 ? (
            <p className="text-xs text-ink-soft">Brak rozliczeń.</p>
          ) : (
            <ul className="compact-list">
              {invoices.map((inv) => (
                <li key={inv.id} className="flex justify-between gap-2 items-center">
                  <div>
                    <p className="font-semibold text-sm capitalize">
                      {monthLabel(inv.year, inv.month)}
                    </p>
                    <p className="text-xs text-ink-soft">
                      {inv.billableDays} dni · {formatMoney(inv.amount)}
                    </p>
                  </div>
                  <StatusBadge status={inv.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <h2 className="font-display text-base mb-1">Nieobecności</h2>
          {absences.length === 0 ? (
            <p className="text-xs text-ink-soft">Brak zgłoszeń.</p>
          ) : (
            <ul className="compact-list text-sm">
              {absences.map((a) => (
                <li key={a.id} className="flex justify-between gap-2">
                  <span>{formatPl(a.date, "d MMM yyyy")}</span>
                  <span className={`text-xs ${a.onTime ? "text-ok" : "text-warn"}`}>
                    {a.onTime ? "w terminie" : "po terminie"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <h2 className="font-display text-base mb-1">Minione menu</h2>
          {pastMenus.length === 0 ? (
            <p className="text-xs text-ink-soft">Brak historii.</p>
          ) : (
            <ul className="compact-list text-sm">
              {pastMenus.map((m) => (
                <li key={m.id}>
                  <p className="font-semibold mb-1">
                    {formatPl(m.date, "d MMM yyyy")}
                  </p>
                  <MenuThumbsSummary values={m.values} thumbSize={48} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
