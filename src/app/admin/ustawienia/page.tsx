import { prisma } from "@/lib/db";
import { PageHeader, Field } from "@/components/ui";
import {
  createMenuFieldAction,
  deleteMenuFieldAction,
  moveMenuFieldAction,
  saveSettingsAction,
  setSchoolDayAction,
  updateMenuFieldAction,
} from "@/lib/actions/admin-actions";
import { toDateKey } from "@/lib/dates";

export default async function AdminSettingsPage() {
  const [settings, overrides, fields] = await Promise.all([
    prisma.mealSettings.findUnique({ where: { id: "default" } }),
    prisma.schoolDay.findMany({ orderBy: { date: "desc" }, take: 20 }),
    prisma.menuFieldDef.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <>
      <PageHeader
        title="Ustawienia"
        description="Stawka, konto, deadline, pola jadłospisu i wyjątki kalendarza."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <form action={saveSettingsAction} className="panel form-stack">
          <h2 className="font-display text-lg">Ogólne</h2>
          <Field label="Stawka (PLN)" htmlFor="mealPrice">
            <input
              id="mealPrice"
              name="mealPrice"
              type="number"
              step="0.01"
              min="0"
              required
              className="input"
              defaultValue={settings?.mealPrice ?? 10}
            />
          </Field>
          <Field label="Odbiorca" htmlFor="bankRecipient">
            <input
              id="bankRecipient"
              name="bankRecipient"
              required
              className="input"
              defaultValue={settings?.bankRecipient ?? ""}
            />
          </Field>
          <Field label="Nr rachunku" htmlFor="bankAccount">
            <input
              id="bankAccount"
              name="bankAccount"
              required
              className="input"
              defaultValue={settings?.bankAccount ?? ""}
            />
          </Field>
          <Field label="Deadline (godz.)" htmlFor="deadlineHour">
            <input
              id="deadlineHour"
              name="deadlineHour"
              type="number"
              min="0"
              max="23"
              required
              className="input"
              defaultValue={settings?.deadlineHour ?? 14}
            />
          </Field>
          <p className="text-xs text-ink-soft">
            Zgłoszenia przyjmowane do tej godziny w dniu obiadu.
          </p>
          <button type="submit" className="btn btn-primary">
            Zapisz ustawienia
          </button>
        </form>

        <form action={setSchoolDayAction} className="panel form-stack">
          <h2 className="font-display text-lg">Wyjątek dnia żywieniowego</h2>
          <Field label="Data" htmlFor="date">
            <input id="date" name="date" type="date" required className="input" />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="hasMeals" defaultChecked />
            Jest żywienie tego dnia
          </label>
          <Field label="Notatka" htmlFor="note">
            <input id="note" name="note" className="input" placeholder="Ferie zimowe" />
          </Field>
          <button type="submit" className="btn btn-primary">
            Zapisz wyjątek
          </button>
          {overrides.length > 0 ? (
            <ul className="compact-list text-xs mt-1">
              {overrides.map((o) => (
                <li key={o.id} className="flex justify-between gap-2">
                  <span>{toDateKey(o.date)}</span>
                  <span className={o.hasMeals ? "text-ok" : "text-danger"}>
                    {o.hasMeals ? "z obiadami" : "bez"}
                    {o.note ? ` · ${o.note}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </form>
      </div>

      <section className="panel mt-4">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-2">
          <div>
            <h2 className="font-display text-lg">Pola jadłospisu</h2>
            <p className="text-xs text-ink-soft">
              Dodawaj, zmieniaj nazwy, kolejność i wymagalność pól (np. Zupa, Deser).
            </p>
          </div>
          <form action={createMenuFieldAction} className="flex flex-wrap gap-2 items-end">
            <div>
              <label className="label">Nowa nazwa</label>
              <input name="label" required className="input w-40" placeholder="Deser" />
            </div>
            <label className="flex items-center gap-1 text-xs pb-1">
              <input type="checkbox" name="required" />
              Wymagane
            </label>
            <button type="submit" className="btn btn-primary btn-xs">
              Dodaj pole
            </button>
          </form>
        </div>

        <table className="compact-table">
          <colgroup>
            <col style={{ width: "5.5rem" }} />
            <col />
            <col className="col-check" />
            <col className="col-check" />
            <col className="col-actions" style={{ width: "7rem" }} />
            <col className="col-actions" />
          </colgroup>
          <thead>
            <tr>
              <th>Kolejność</th>
              <th>Nazwa</th>
              <th className="col-check">Wymagane</th>
              <th className="col-check">Aktywne</th>
              <th className="col-actions"></th>
              <th className="col-actions">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((f) => (
              <tr key={f.id}>
                <td>
                  <div className="flex gap-1">
                    <form action={moveMenuFieldAction}>
                      <input type="hidden" name="id" value={f.id} />
                      <input type="hidden" name="direction" value="up" />
                      <button type="submit" className="btn btn-secondary btn-xs">
                        ↑
                      </button>
                    </form>
                    <form action={moveMenuFieldAction}>
                      <input type="hidden" name="id" value={f.id} />
                      <input type="hidden" name="direction" value="down" />
                      <button type="submit" className="btn btn-secondary btn-xs">
                        ↓
                      </button>
                    </form>
                  </div>
                </td>
                <td>
                  <form id={`field-${f.id}`} action={updateMenuFieldAction}>
                    <input type="hidden" name="id" value={f.id} />
                    <input type="hidden" name="sortOrder" value={f.sortOrder} />
                    <input
                      name="label"
                      defaultValue={f.label}
                      className="input"
                      required
                    />
                  </form>
                </td>
                <td className="col-check">
                  <input
                    form={`field-${f.id}`}
                    type="checkbox"
                    name="required"
                    defaultChecked={f.required}
                  />
                </td>
                <td className="col-check">
                  <input
                    form={`field-${f.id}`}
                    type="checkbox"
                    name="active"
                    defaultChecked={f.active}
                  />
                </td>
                <td className="col-actions">
                  <button
                    form={`field-${f.id}`}
                    type="submit"
                    className="btn btn-secondary btn-xs"
                  >
                    Zapisz
                  </button>
                </td>
                <td className="col-actions">
                  <form action={deleteMenuFieldAction}>
                    <input type="hidden" name="id" value={f.id} />
                    <button type="submit" className="btn btn-danger btn-xs">
                      Usuń
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
