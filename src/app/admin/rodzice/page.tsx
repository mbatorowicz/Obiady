import { prisma } from "@/lib/db";
import { PageHeader, Field } from "@/components/ui";
import {
  createParentAction,
  linkParentChildAction,
  unlinkParentChildAction,
} from "@/lib/actions/admin-actions";

export default async function AdminParentsPage() {
  const [parents, children, links] = await Promise.all([
    prisma.user.findMany({
      where: { role: "PARENT" },
      orderBy: { name: "asc" },
    }),
    prisma.child.findMany({
      where: { active: true },
      orderBy: [{ className: "asc" }, { lastName: "asc" }],
    }),
    prisma.parentChild.findMany({
      include: { parent: true, child: true },
      orderBy: { parent: { name: "asc" } },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Rodzice"
        description="Konta rodziców i powiązania z dziećmi."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <form action={createParentAction} className="panel form-stack">
          <h2 className="font-display text-lg">Nowe konto</h2>
          <Field label="Imię i nazwisko" htmlFor="name">
            <input id="name" name="name" required className="input" />
          </Field>
          <Field label="E-mail" htmlFor="email">
            <input id="email" name="email" type="email" required className="input" />
          </Field>
          <Field label="Hasło" htmlFor="password">
            <input
              id="password"
              name="password"
              type="text"
              defaultValue="haslo123"
              className="input"
            />
          </Field>
          <button type="submit" className="btn btn-primary">
            Utwórz
          </button>
        </form>

        <form action={linkParentChildAction} className="panel form-stack">
          <h2 className="font-display text-lg">Powiąż z dzieckiem</h2>
          <Field label="Rodzic" htmlFor="parentId">
            <select id="parentId" name="parentId" required className="input">
              <option value="">Wybierz…</option>
              {parents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.email})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Dziecko" htmlFor="childId">
            <select id="childId" name="childId" required className="input">
              <option value="">Wybierz…</option>
              {children.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} · {c.className}
                </option>
              ))}
            </select>
          </Field>
          <button type="submit" className="btn btn-primary">
            Powiąż
          </button>
        </form>
      </div>

      <section className="panel mt-4 overflow-x-auto">
        <h2 className="font-display text-lg mb-2">Powiązania</h2>
        <table className="compact-table">
          <colgroup>
            <col style={{ width: "22%" }} />
            <col style={{ width: "28%" }} />
            <col />
            <col className="col-class" />
            <col className="col-actions" />
          </colgroup>
          <thead>
            <tr>
              <th>Rodzic</th>
              <th>E-mail</th>
              <th>Dziecko</th>
              <th className="col-class">Klasa</th>
              <th className="col-actions">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {links.map((link) => (
              <tr key={link.id}>
                <td className="font-semibold">{link.parent.name}</td>
                <td className="text-ink-soft truncate">{link.parent.email}</td>
                <td>
                  {link.child.firstName} {link.child.lastName}
                </td>
                <td className="col-class">{link.child.className}</td>
                <td className="col-actions">
                  <form action={unlinkParentChildAction}>
                    <input type="hidden" name="id" value={link.id} />
                    <button type="submit" className="btn btn-danger btn-xs">
                      Usuń
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {links.length === 0 ? (
          <p className="text-sm text-ink-soft py-3 text-center">Brak powiązań.</p>
        ) : null}
      </section>
    </>
  );
}
