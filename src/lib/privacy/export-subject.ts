import { prisma } from "@/lib/db";

function serializeDates<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, v) =>
      v instanceof Date ? v.toISOString() : v,
    ),
  ) as T;
}

export async function exportParentSubject(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      children: {
        include: {
          child: {
            include: {
              absences: { orderBy: { date: "desc" } },
              invoices: {
                include: { payments: { orderBy: { paidAt: "desc" } } },
                orderBy: [{ year: "desc" }, { month: "desc" }],
              },
              payments: { orderBy: { paidAt: "desc" } },
            },
          },
        },
      },
      payments: { orderBy: { paidAt: "desc" } },
      absences: { orderBy: { date: "desc" }, take: 200 },
    },
  });

  if (!user) return null;

  return serializeDates({
    exportedAt: new Date().toISOString(),
    subjectType: "parent" as const,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    children: user.children.map((link) => link.child),
    reportedAbsences: user.absences,
    paymentsAsPayer: user.payments,
  });
}

export async function exportChildSubject(childId: string) {
  const child = await prisma.child.findUnique({
    where: { id: childId },
    include: {
      parents: {
        include: {
          parent: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              createdAt: true,
            },
          },
        },
      },
      absences: { orderBy: { date: "desc" } },
      invoices: {
        include: { payments: { orderBy: { paidAt: "desc" } } },
        orderBy: [{ year: "desc" }, { month: "desc" }],
      },
      payments: { orderBy: { paidAt: "desc" } },
    },
  });

  if (!child) return null;

  return serializeDates({
    exportedAt: new Date().toISOString(),
    subjectType: "child" as const,
    child: {
      id: child.id,
      firstName: child.firstName,
      lastName: child.lastName,
      className: child.className,
      active: child.active,
      createdAt: child.createdAt,
      updatedAt: child.updatedAt,
    },
    parents: child.parents.map((p) => p.parent),
    absences: child.absences,
    invoices: child.invoices,
    payments: child.payments,
  });
}
