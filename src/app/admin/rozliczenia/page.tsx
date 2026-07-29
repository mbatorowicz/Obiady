import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader, StatusBadge } from "@/components/ui";
import {
  generateInvoicesAction,
  updatePaymentStatusAction,
} from "@/lib/actions/admin-actions";
import { formatMoney } from "@/lib/billing";
import { monthLabel } from "@/lib/dates";
import { PaymentStatus } from "@prisma/client";

export default async function AdminBillingPage({
  searchParams,
}: {
  searchParams: Promise<{ y?: string; m?: string; className?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const year = Number(params.y) || now.getFullYear();
  const month = Number(params.m) || now.getMonth() + 1;
  const className = params.className || "";

  const invoices = await prisma.invoiceMonth.findMany({
    where: {
      year,
      month,
      ...(className ? { child: { className } } : {}),
    },
    include: { child: true },
    orderBy: [{ child: { className: "asc" } }, { child: { lastName: "asc" } }],
  });

  const classes = await prisma.child.findMany({
    select: { className: true },
    distinct: ["className"],
    orderBy: { className: "asc" },
  });

  const total = invoices.reduce((sum, i) => sum + i.amount, 0);
  const unpaid = invoices.filter((i) => i.status !== "PAID");

  return (
    <>
      <PageHeader
        title="Rozliczenia"
        description={`Miesiąc: ${monthLabel(year, month)}`}
        actions={
          <>
            <Link
              href={`/admin/wplaty/nowa?y=${year}&m=${month}`}
              className="btn btn-primary btn-xs"
            >
              Zarejestruj wpłatę
            </Link>
            <Link
              href={`/admin/wplaty?y=${year}&m=${month}`}
              className="btn btn-secondary btn-xs"
            >
              Lista wpłat
            </Link>
          </>
        }
      />

      <div className="panel mb-3 flex flex-wrap gap-2 items-end">
        <form
          action="/admin/rozliczenia"
          method="get"
          className="flex flex-wrap gap-2 items-end"
        >
          <div>
            <label className="label">Rok</label>
            <input type="number" name="y" defaultValue={year} className="input w-24" />
          </div>
          <div>
            <label className="label">Miesiąc</label>
            <input
              type="number"
              name="m"
              min={1}
              max={12}
              defaultValue={month}
              className="input w-20"
            />
          </div>
          <div>
            <label className="label">Klasa</label>
            <select name="className" defaultValue={className} className="input">
              <option value="">Wszystkie</option>
              {classes.map((c) => (
                <option key={c.className} value={c.className}>
                  {c.className}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-secondary btn-xs">
            Filtruj
          </button>
        </form>

        <form action={generateInvoicesAction} className="ml-auto">
          <input type="hidden" name="year" value={year} />
          <input type="hidden" name="month" value={month} />
          <button type="submit" className="btn btn-primary btn-xs">
            Przelicz należności
          </button>
        </form>
      </div>

      <div className="grid gap-2 sm:grid-cols-3 mb-3">
        <div className="panel py-2">
          <p className="text-xs text-ink-soft">Suma</p>
          <p className="font-display text-2xl">{formatMoney(total)}</p>
        </div>
        <div className="panel py-2">
          <p className="text-xs text-ink-soft">Rozliczenia</p>
          <p className="font-display text-2xl">{invoices.length}</p>
        </div>
        <div className="panel py-2">
          <p className="text-xs text-ink-soft">Do zapłaty</p>
          <p className="font-display text-2xl">{unpaid.length}</p>
        </div>
      </div>

      <div className="panel overflow-x-auto">
        <table className="compact-table">
          <colgroup>
            <col style={{ width: "18%" }} />
            <col className="col-class" />
            <col className="col-num" />
            <col className="col-num" />
            <col className="col-num" />
            <col />
            <col className="col-status" />
          </colgroup>
          <thead>
            <tr>
              <th>Dziecko</th>
              <th className="col-class">Klasa</th>
              <th className="col-num">Dni</th>
              <th className="col-num">Nieob.</th>
              <th className="col-num">Kwota</th>
              <th>Tytuł</th>
              <th className="col-status">Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <td className="font-semibold whitespace-nowrap">
                  {inv.child.lastName} {inv.child.firstName}
                </td>
                <td className="col-class">{inv.child.className}</td>
                <td className="col-num">
                  {inv.billableDays}/{inv.mealDays}
                </td>
                <td className="col-num">{inv.excusedAbsences}</td>
                <td className="col-num">{formatMoney(inv.amount)}</td>
                <td className="text-[11px] text-ink-soft truncate" title={inv.transferTitle}>
                  {inv.transferTitle}
                </td>
                <td className="col-status">
                  <div className="flex flex-col gap-1 items-start">
                    <StatusBadge status={inv.status} />
                    <div className="flex flex-wrap gap-1">
                      <Link
                        href={`/admin/wplaty/nowa?childId=${inv.childId}&y=${year}&m=${month}&full=1`}
                        className="btn btn-primary btn-xs"
                      >
                        Opłać
                      </Link>
                      <Link
                        href={`/admin/wplaty?childId=${inv.childId}&y=${year}&m=${month}`}
                        className="btn btn-secondary btn-xs"
                      >
                        Wpłaty
                      </Link>
                    </div>
                    <form action={updatePaymentStatusAction} className="flex gap-1">
                      <input type="hidden" name="id" value={inv.id} />
                      <select
                        name="status"
                        defaultValue={inv.status}
                        className="input py-0.5 text-xs w-28"
                      >
                        <option value={PaymentStatus.UNPAID}>Niezapłacone</option>
                        <option value={PaymentStatus.PARTIAL}>Częściowo</option>
                        <option value={PaymentStatus.PAID}>Zapłacone</option>
                      </select>
                      <button type="submit" className="btn btn-secondary btn-xs">
                        OK
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {invoices.length === 0 ? (
          <p className="text-ink-soft py-4 text-center text-sm">
            Brak rozliczeń — kliknij „Przelicz należności”.
          </p>
        ) : null}
      </div>
    </>
  );
}
