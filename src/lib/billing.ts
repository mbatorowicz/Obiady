import { PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  defaultMealDaysInMonth,
  startOfDay,
  toDateKey,
  transferTitle,
} from "@/lib/dates";

export async function getMealDaysForMonth(year: number, month: number) {
  const defaults = defaultMealDaysInMonth(year, month);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  const overrides = await prisma.schoolDay.findMany({
    where: { date: { gte: start, lte: end } },
  });

  const overrideMap = new Map(
    overrides.map((o) => [toDateKey(o.date), o.hasMeals]),
  );

  return defaults
    .map((d) => startOfDay(d))
    .filter((d) => {
      const key = toDateKey(d);
      if (overrideMap.has(key)) return overrideMap.get(key) === true;
      return true;
    });
}

export async function computeInvoiceForChild(
  childId: string,
  year: number,
  month: number,
) {
  const child = await prisma.child.findUniqueOrThrow({ where: { id: childId } });
  const settings = await prisma.mealSettings.findUnique({
    where: { id: "default" },
  });
  const price = settings?.mealPrice ?? 10;

  const mealDays = await getMealDaysForMonth(year, month);
  const mealDayKeys = new Set(mealDays.map(toDateKey));

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  const absences = await prisma.absence.findMany({
    where: {
      childId,
      date: { gte: start, lte: end },
      onTime: true,
    },
  });

  const excusedAbsences = absences.filter((a) =>
    mealDayKeys.has(toDateKey(a.date)),
  ).length;

  const billableDays = Math.max(0, mealDays.length - excusedAbsences);
  const amount = billableDays * price;
  const title = transferTitle(year, month, child.firstName, child.lastName);

  return {
    childId,
    year,
    month,
    mealDays: mealDays.length,
    excusedAbsences,
    billableDays,
    amount,
    transferTitle: title,
  };
}

export async function upsertInvoice(
  childId: string,
  year: number,
  month: number,
  status?: PaymentStatus,
) {
  const data = await computeInvoiceForChild(childId, year, month);
  const existing = await prisma.invoiceMonth.findUnique({
    where: { childId_year_month: { childId, year, month } },
  });

  return prisma.invoiceMonth.upsert({
    where: { childId_year_month: { childId, year, month } },
    create: {
      ...data,
      status: status ?? PaymentStatus.UNPAID,
    },
    update: {
      mealDays: data.mealDays,
      excusedAbsences: data.excusedAbsences,
      billableDays: data.billableDays,
      amount: data.amount,
      transferTitle: data.transferTitle,
      ...(status ? { status } : {}),
    },
  });
}

export async function regenerateInvoicesForMonth(year: number, month: number) {
  const children = await prisma.child.findMany({ where: { active: true } });
  const results = [];
  for (const child of children) {
    results.push(await upsertInvoice(child.id, year, month));
  }
  return results;
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
  }).format(amount);
}

export function paymentStatusLabel(status: PaymentStatus): string {
  switch (status) {
    case "PAID":
      return "Zapłacone";
    case "PARTIAL":
      return "Częściowo";
    default:
      return "Niezapłacone";
  }
}
