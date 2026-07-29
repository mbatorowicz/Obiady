import { prisma } from "@/lib/db";
import { PageHeader, Field } from "@/components/ui";
import {
  createChildAction,
  updateChildAction,
} from "@/lib/actions/admin-actions";

export default async function AdminChildrenPage() {
  const children = await prisma.child.findMany({
    orderBy: [{ className: "asc" }, { lastName: "asc" }],
    include: {
      parents: { include: { parent: true } },
    },
  });

  return (
    <>
      <PageHeader title="Dzieci" description="Kartoteka dzieci objętych żywieniem." />

      <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
        <form action={createChildAction} className="panel form-stack h-fit">
          <h2 className="font-display text-lg">Dodaj</h2>
          <Field label="Imię" htmlFor="firstName" inline={false}>
            <input id="firstName" name="firstName" required className="input" />
          </Field>
          <Field label="Nazwisko" htmlFor="lastName" inline={false}>
            <input id="lastName" name="lastName" required className="input" />
          </Field>
          <Field label="Klasa" htmlFor="className" inline={false}>
            <input id="className" name="className" required className="input" placeholder="3A" />
          </Field>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" name="active" defaultChecked />
            Aktywne w żywieniu
          </label>
          <button type="submit" className="btn btn-primary w-full">
            Zapisz
          </button>
        </form>

        <div className="panel overflow-x-auto">
          <table className="compact-table">
            <colgroup>
              <col style={{ width: "18%" }} />
              <col style={{ width: "18%" }} />
              <col className="col-class" />
              <col className="col-check" />
              <col />
              <col className="col-actions" />
            </colgroup>
            <thead>
              <tr>
                <th>Imię</th>
                <th>Nazwisko</th>
                <th className="col-class">Klasa</th>
                <th className="col-check">Aktywne</th>
                <th>Rodzice</th>
                <th className="col-actions">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {children.map((child) => (
                <tr key={child.id}>
                  <td>
                    <form id={`child-${child.id}`} action={updateChildAction}>
                      <input type="hidden" name="id" value={child.id} />
                      <input
                        name="firstName"
                        defaultValue={child.firstName}
                        className="input"
                        required
                      />
                    </form>
                  </td>
                  <td>
                    <input
                      form={`child-${child.id}`}
                      name="lastName"
                      defaultValue={child.lastName}
                      className="input"
                      required
                    />
                  </td>
                  <td className="col-class">
                    <input
                      form={`child-${child.id}`}
                      name="className"
                      defaultValue={child.className}
                      className="input"
                      required
                    />
                  </td>
                  <td className="col-check">
                    <input
                      form={`child-${child.id}`}
                      type="checkbox"
                      name="active"
                      defaultChecked={child.active}
                    />
                  </td>
                  <td className="text-xs text-ink-soft truncate" title={
                    child.parents.map((p) => p.parent.name).join(", ")
                  }>
                    {child.parents.length
                      ? child.parents.map((p) => p.parent.name).join(", ")
                      : "—"}
                  </td>
                  <td className="col-actions">
                    <button
                      form={`child-${child.id}`}
                      type="submit"
                      className="btn btn-secondary btn-xs"
                    >
                      OK
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {children.length === 0 ? (
            <p className="text-sm text-ink-soft py-4 text-center">Brak dzieci.</p>
          ) : null}
        </div>
      </div>
    </>
  );
}
