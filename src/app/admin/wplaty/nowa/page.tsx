import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { PaymentForm } from "@/components/PaymentForm";
import { upsertInvoice, formatMoney } from "@/lib/billing";
import { remainingDue } from "@/lib/payments";
import { toDateKey } from "@/lib/dates";

export default async function NewPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{
    childId?: string;
    y?: string;
    m?: string;
    full?: string;
  }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const year = Number(params.y) || now.getFullYear();
  const month = Number(params.m) || now.getMonth() + 1;

  const [parents, children] = await Promise.all([
    prisma.user.findMany({
      where: { role: "PARENT" },
      include: { children: true },
      orderBy: { name: "asc" },
    }),
    prisma.child.findMany({
      where: { active: true },
      orderBy: [{ className: "asc" }, { lastName: "asc" }],
    }),
  ]);

  const childOptions = [];
  for (const child of children) {
    const invoice = await upsertInvoice(child.id, year, month);
    const remaining = await remainingDue(invoice.id);
    childOptions.push({
      id: child.id,
      label: `${child.lastName} ${child.firstName} (${child.className})`,
      remaining,
    });
  }

  let defaultAmount: number | undefined;
  if (params.childId && params.full === "1") {
    const opt = childOptions.find((c) => c.id === params.childId);
    defaultAmount = opt?.remaining;
  }

  return (
    <>
      <PageHeader
        title="Nowa wpłata"
        description={`Rozliczenie: ${month}/${year}. Pozostałe należności wyliczone z faktur.`}
      />
      <p className="text-xs text-ink-soft mb-3">
        Przykład: jeśli dziecko ma do zapłaty {formatMoney(childOptions[0]?.remaining ?? 0)},
        kwota domyślna ustawi się po wyborze dziecka.
      </p>
      <PaymentForm
        parents={parents.map((p) => ({
          id: p.id,
          name: p.name,
          childIds: p.children.map((c) => c.childId),
        }))}
        childOptions={childOptions}
        defaults={{
          childId: params.childId,
          year,
          month,
          paidAt: toDateKey(now),
          amount: defaultAmount,
        }}
      />
    </>
  );
}
