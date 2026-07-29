import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { redirect } from "next/navigation";

export default async function ParentMyDataPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "PARENT") {
    redirect("/logowanie");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      children: {
        include: { child: true },
      },
    },
  });

  if (!user) redirect("/logowanie");

  return (
    <>
      <PageHeader
        title="Moje dane"
        description="Podgląd danych konta i pakiet eksportu (RODO)."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel space-y-2 text-sm">
          <h2 className="font-display text-lg">Konto</h2>
          <p>
            <span className="text-ink-soft">Imię i nazwisko:</span>{" "}
            <strong>{user.name}</strong>
          </p>
          <p>
            <span className="text-ink-soft">E-mail:</span>{" "}
            <strong>{user.email}</strong>
          </p>
          <p className="text-xs text-ink-soft pt-2">
            Wniosek o sprostowanie lub anonimizację konta złóż do szkoły
            (kontakt w{" "}
            <Link href="/prywatnosc" className="underline">
              klauzuli prywatności
            </Link>
            ).
          </p>
        </section>

        <section className="panel space-y-3 text-sm">
          <h2 className="font-display text-lg">Powiązane dzieci</h2>
          {user.children.length === 0 ? (
            <p className="text-ink-soft">Brak powiązanych dzieci.</p>
          ) : (
            <ul className="space-y-1">
              {user.children.map((link) => (
                <li key={link.id}>
                  {link.child.firstName} {link.child.lastName}
                  <span className="text-ink-soft"> · {link.child.className}</span>
                </li>
              ))}
            </ul>
          )}
          <a
            href="/api/privacy-export?type=me"
            className="btn btn-primary btn-xs inline-flex"
          >
            Pobierz moje dane (JSON)
          </a>
        </section>
      </div>
    </>
  );
}
