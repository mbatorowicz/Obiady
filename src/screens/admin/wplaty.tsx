import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader, StatusBadge } from "@/components/ui";
import { cancelPaymentAction } from "@/lib/actions/payment-actions";
import { formatMoney } from "@/lib/billing";
import { formatPl, monthLabel } from "@/lib/dates";
import { paymentMethodLabel } from "@/lib/payments";

export default async function PaymentsListPage({
  searchParams,
}: {
  searchParams: Promise<{ y?: string; m?: string; childId?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const year = params.y ? Number(params.y) : undefined;
  const month = params.m ? Number(params.m) : undefined;
  const childId = params.childId || undefined;

  const payments = await prisma.payment.findMany({
    where: {
      ...(childId ? { childId } : {}),
      ...(year && month
        ? { invoice: { year, month } }
        : {}),
    },
    include: {
      child: true,
      invoice: true,
      payerUser: true,
    },
    orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
    take: 100,
  });

  const children = await prisma.child.findMany({
    where: { active: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return (
    <>
      <PageHeader
        title="Wpłaty"
        description="Zaksięgowane wpłaty i pokwitowania do druku."
        actions={
          <Link
            href={`/admin/wplaty/nowa?y=${year || now.getFullYear()}&m=${month || now.getMonth() + 1}`}
            className="btn btn-primary btn-xs"
          >
            Zarejestruj wpłatę
          </Link>
        }
      />

      <form
        action="/admin/wplaty"
        method="get"
        className="panel mb-3 flex flex-wrap gap-2 items-end"
      >
        <div>
          <label className="label">Rok</label>
          <input
            type="number"
            name="y"
            className="input w-24"
            defaultValue={year || ""}
            placeholder="wszystkie"
          />
        </div>
        <div>
          <label className="label">Miesiąc</label>
          <input
            type="number"
            name="m"
            min={1}
            max={12}
            className="input w-20"
            defaultValue={month || ""}
            placeholder="—"
          />
        </div>
        <div>
          <label className="label">Dziecko</label>
          <select name="childId" className="input" defaultValue={childId || ""}>
            <option value="">Wszystkie</option>
            {children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.lastName} {c.firstName}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-secondary btn-xs">
          Filtruj
        </button>
      </form>

      <div className="panel overflow-x-auto">
        <table className="compact-table">
          <colgroup>
            <col className="col-date" />
            <col style={{ width: "9rem" }} />
            <col />
            <col />
            <col className="col-num" />
            <col style={{ width: "5.5rem" }} />
            <col className="col-status" style={{ width: "7rem" }} />
            <col className="col-actions" style={{ width: "9rem" }} />
          </colgroup>
          <thead>
            <tr>
              <th>Data</th>
              <th>Nr</th>
              <th>Płatnik</th>
              <th>Dziecko</th>
              <th className="col-num">Kwota</th>
              <th>Metoda</th>
              <th>Okres / status</th>
              <th className="col-actions">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className={p.cancelledAt ? "opacity-50" : undefined}>
                <td className="col-date whitespace-nowrap">
                  {formatPl(p.paidAt, "d MMM yyyy")}
                </td>
                <td className="font-mono text-[11px]">{p.receiptNo}</td>
                <td className="truncate" title={p.payerName}>
                  {p.payerName}
                </td>
                <td className="truncate">
                  {p.child.lastName} {p.child.firstName}
                </td>
                <td className="col-num">{formatMoney(p.amount)}</td>
                <td>{paymentMethodLabel(p.method)}</td>
                <td>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs capitalize">
                      {monthLabel(p.invoice.year, p.invoice.month)}
                    </span>
                    {p.cancelledAt ? (
                      <span className="text-[11px] text-danger">Anulowane</span>
                    ) : (
                      <StatusBadge status={p.invoice.status} />
                    )}
                  </div>
                </td>
                <td className="col-actions">
                  <div className="flex flex-col items-end gap-1">
                    <Link
                      href={`/admin/wplaty/${p.id}/pokwitowanie`}
                      className="btn btn-secondary btn-xs"
                    >
                      Pokwitowanie
                    </Link>
                    {!p.cancelledAt ? (
                      <form action={cancelPaymentAction}>
                        <input type="hidden" name="id" value={p.id} />
                        <button type="submit" className="btn btn-danger btn-xs">
                          Anuluj
                        </button>
                      </form>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {payments.length === 0 ? (
          <p className="text-sm text-ink-soft py-4 text-center">Brak wpłat.</p>
        ) : null}
      </div>
    </>
  );
}
