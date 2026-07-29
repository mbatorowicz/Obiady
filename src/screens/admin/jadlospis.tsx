import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader, Field } from "@/components/ui";
import { ZoomableImage } from "@/components/ZoomableImage";
import { MenuThumbsSummary } from "@/components/MenuThumbsSummary";
import { deleteMenuAction, saveMenuAction } from "@/lib/actions/admin-actions";
import { formatPl, parseDateKey, toDateKey } from "@/lib/dates";

export default async function AdminMenuPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const todayKey = toDateKey(new Date());
  const editDateKey = params.date || todayKey;
  const editDate = parseDateKey(editDateKey);

  const [fields, menus, editEntry] = await Promise.all([
    prisma.menuFieldDef.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.menuEntry.findMany({
      include: { values: { include: { fieldDef: true } } },
      orderBy: { date: "desc" },
      take: 60,
    }),
    prisma.menuEntry.findUnique({
      where: { date: editDate },
      include: { values: true },
    }),
  ]);

  const prefills =
    editEntry ?? menus.find((m) => toDateKey(m.date) === editDateKey) ?? null;

  const valueByField = new Map(
    (prefills?.values ?? []).map((v) => [v.fieldDefId, v]),
  );

  return (
    <>
      <PageHeader
        title="Jadłospis"
        description="Każda pozycja może mieć własne zdjęcie. „Edytuj” przy dniu otwiera formularz."
      />

      <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
        <form action={saveMenuAction} className="panel form-stack h-fit">
          <h2 className="font-display text-lg">
            {prefills ? "Edytuj dzień" : "Dodaj dzień"}
          </h2>
          <Field label="Data" htmlFor="date">
            <input
              id="date"
              name="date"
              type="date"
              required
              className="input"
              defaultValue={editDateKey}
              key={editDateKey}
            />
          </Field>

          {fields.length === 0 ? (
            <p className="text-xs text-warn">
              Brak aktywnych pól — dodaj je w Ustawieniach.
            </p>
          ) : (
            fields.map((f) => {
              const existing = valueByField.get(f.id);
              return (
                <div
                  key={`${f.id}-${editDateKey}`}
                  className="rounded-lg border border-line p-2 space-y-1.5"
                >
                  <Field label={f.label} htmlFor={`field_${f.id}`} inline={false}>
                    <input
                      id={`field_${f.id}`}
                      name={`field_${f.id}`}
                      className="input"
                      required={f.required}
                      placeholder={f.label}
                      defaultValue={existing?.value ?? ""}
                    />
                  </Field>
                  {existing?.imagePath ? (
                    <div className="flex items-center gap-2">
                      <ZoomableImage
                        src={existing.imagePath}
                        alt={f.label}
                        caption={existing.value}
                        size={48}
                      />
                      <span className="text-[11px] text-ink-soft">
                        Obecne zdjęcie — kliknij, aby powiększyć
                      </span>
                    </div>
                  ) : null}
                  <Field label="Nowe zdjęcie" htmlFor={`image_${f.id}`} inline={false}>
                    <input
                      id={`image_${f.id}`}
                      name={`image_${f.id}`}
                      type="file"
                      accept="image/*"
                      className="input"
                    />
                  </Field>
                  {existing?.imagePath ? (
                    <label className="flex items-center gap-2 text-xs">
                      <input type="checkbox" name={`removeImage_${f.id}`} />
                      Usuń zdjęcie tej pozycji
                    </label>
                  ) : null}
                </div>
              );
            })
          )}

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={fields.length === 0}
          >
            Zapisz menu
          </button>
        </form>

        <div className="panel overflow-x-auto">
          <table className="compact-table">
            <colgroup>
              <col className="col-date" />
              <col />
              <col className="col-actions" style={{ width: "7.5rem" }} />
            </colgroup>
            <thead>
              <tr>
                <th className="col-date">Data</th>
                <th>Menu</th>
                <th className="col-actions">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {menus.map((m) => (
                <tr key={m.id}>
                  <td className="col-date align-top">
                    <p className="font-semibold capitalize whitespace-nowrap">
                      {formatPl(m.date, "EEE d MMM")}
                    </p>
                  </td>
                  <td className="align-top">
                    <MenuThumbsSummary values={m.values} thumbSize={56} />
                  </td>
                  <td className="col-actions align-top">
                    <div className="flex flex-col items-end gap-1">
                      <Link
                        href={`/admin/jadlospis?date=${toDateKey(m.date)}`}
                        className="btn btn-secondary btn-xs"
                      >
                        Edytuj
                      </Link>
                      <form action={deleteMenuAction}>
                        <input type="hidden" name="id" value={m.id} />
                        <button type="submit" className="btn btn-danger btn-xs">
                          Usuń
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {menus.length === 0 ? (
            <p className="text-sm text-ink-soft py-4 text-center">
              Brak wpisów jadłospisu.
            </p>
          ) : null}
        </div>
      </div>
    </>
  );
}
