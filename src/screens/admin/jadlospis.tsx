import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader, Field } from "@/components/ui";
import { MenuThumbsSummary } from "@/components/MenuThumbsSummary";
import { ImageFileField } from "@/components/ImageFileField";
import {
  createDishAction,
  createMenuFieldAction,
  deleteDishAction,
  deleteMenuAction,
  deleteMenuFieldAction,
  moveMenuFieldAction,
  saveMenuAction,
  updateDishAction,
  updateMenuFieldAction,
} from "@/lib/actions/admin-actions";
import { formatPl, parseDateKey, toDateKey } from "@/lib/dates";
import { ZoomableImage, ThumbPlaceholder } from "@/components/ZoomableImage";
import { normalizeImageSrc } from "@/lib/image-url";

const menuValueInclude = {
  fieldDef: true,
  dish: true,
} as const;

type Tab = "dzien" | "pozycje" | "potrawy";

function tabLink(tab: Tab, active: Tab, extra = "") {
  const href = `/admin/jadlospis?tab=${tab}${extra}`;
  const isActive = tab === active;
  return (
    <Link
      href={href}
      className={`btn btn-xs ${isActive ? "btn-primary" : "btn-secondary"}`}
    >
      {tab === "dzien" ? "Dzień" : tab === "pozycje" ? "Pozycje" : "Potrawy"}
    </Link>
  );
}

export default async function AdminMenuPage({
  searchParams,
}: {
  searchParams: Promise<{
    date?: string;
    tab?: string;
    ok?: string;
    error?: string;
    editDish?: string;
    returnDate?: string;
  }>;
}) {
  const params = await searchParams;
  const tab = (["dzien", "pozycje", "potrawy"].includes(params.tab || "")
    ? params.tab
    : "dzien") as Tab;
  const todayKey = toDateKey(new Date());
  const editDateKey = params.date || todayKey;
  const editDate = parseDateKey(editDateKey);

  const [fields, menus, editEntry, dishes] = await Promise.all([
    prisma.menuFieldDef.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.menuEntry.findMany({
      include: { values: { include: menuValueInclude } },
      orderBy: { date: "desc" },
      take: 60,
    }),
    prisma.menuEntry.findUnique({
      where: { date: editDate },
      include: { values: { include: menuValueInclude } },
    }),
    prisma.dish.findMany({
      orderBy: [{ active: "desc" }, { name: "asc" }],
    }),
  ]);

  const activeFields = fields.filter((f) => f.active);
  const activeDishes = dishes.filter((d) => d.active);
  const prefills =
    editEntry ?? menus.find((m) => toDateKey(m.date) === editDateKey) ?? null;
  const dishByField = new Map(
    (prefills?.values ?? []).map((v) => [v.fieldDefId, v.dishId]),
  );
  const editingDish = params.editDish
    ? dishes.find((d) => d.id === params.editDish)
    : null;

  return (
    <>
      <PageHeader
        title="Jadłospis"
        description="Katalog potraw ze zdjęciami, pozycje menu i plan dnia."
      />

      <div className="flex flex-wrap gap-1.5 mb-3">
        {tabLink("dzien", tab, `&date=${editDateKey}`)}
        {tabLink("pozycje", tab)}
        {tabLink("potrawy", tab)}
      </div>

      {params.ok === "1" ? (
        <div className="toast-ok" role="status">
          Zapisano.
        </div>
      ) : null}
      {params.error === "in_use" ? (
        <div className="mb-3 rounded-xl bg-red-50 text-danger px-3 py-2 text-sm">
          Nie można usunąć — potrawa jest użyta w jadłospisie. Najpierw odłącz
          ją z dni lub dezaktywuj.
        </div>
      ) : params.error ? (
        <div className="mb-3 rounded-xl bg-red-50 text-danger px-3 py-2 text-sm">
          Nie udało się zapisać. Sprawdź wymagane pola i spróbuj ponownie.
        </div>
      ) : null}

      {tab === "dzien" ? (
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

            {activeFields.length === 0 ? (
              <p className="text-xs text-warn">
                Brak aktywnych pozycji — dodaj je w zakładce Pozycje.
              </p>
            ) : (
              activeFields.map((f) => (
                <Field
                  key={`${f.id}-${editDateKey}`}
                  label={f.label + (f.required ? " *" : "")}
                  htmlFor={`dish_${f.id}`}
                  inline={false}
                >
                  <select
                    id={`dish_${f.id}`}
                    name={`dish_${f.id}`}
                    className="input"
                    required={f.required}
                    defaultValue={dishByField.get(f.id) ?? ""}
                  >
                    <option value="">— wybierz potrawę —</option>
                    {activeDishes.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </Field>
              ))
            )}

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={activeFields.length === 0}
            >
              Zapisz menu
            </button>

            <div className="border-t border-line pt-3 mt-1 space-y-2">
              <p className="text-xs text-ink-soft">
                Brak potrawy na liście? Dodaj ją w katalogu (możesz wrócić do
                tego dnia).
              </p>
              <Link
                href={`/admin/jadlospis?tab=potrawy&returnDate=${editDateKey}`}
                className="btn btn-secondary btn-xs"
              >
                Przejdź do potraw
              </Link>
            </div>
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
                          href={`/admin/jadlospis?tab=dzien&date=${toDateKey(m.date)}`}
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
      ) : null}

      {tab === "pozycje" ? (
        <section className="panel">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-2">
            <div>
              <h2 className="font-display text-lg">Pozycje jadłospisu</h2>
              <p className="text-xs text-ink-soft">
                Nazwy, kolejność i wymagalność (np. Zupa, Drugie danie, Deser).
              </p>
            </div>
            <form
              action={createMenuFieldAction}
              className="flex flex-wrap gap-2 items-end"
            >
              <div>
                <label className="label">Nowa nazwa</label>
                <input
                  name="label"
                  required
                  className="input w-40"
                  placeholder="Deser"
                />
              </div>
              <label className="flex items-center gap-1 text-xs pb-1">
                <input type="checkbox" name="required" />
                Wymagane
              </label>
              <button type="submit" className="btn btn-primary btn-xs">
                Dodaj pozycję
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
          {fields.length === 0 ? (
            <p className="text-sm text-ink-soft py-4 text-center">
              Brak pozycji — dodaj pierwszą powyżej.
            </p>
          ) : null}
        </section>
      ) : null}

      {tab === "potrawy" ? (
        <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
          <form
            action={editingDish ? updateDishAction : createDishAction}
            className="panel form-stack h-fit"
          >
            <h2 className="font-display text-lg">
              {editingDish ? "Edytuj potrawę" : "Nowa potrawa"}
            </h2>
            {editingDish ? (
              <input type="hidden" name="id" value={editingDish.id} />
            ) : null}
            {params.returnDate ? (
              <input
                type="hidden"
                name="returnTo"
                value={`/admin/jadlospis?tab=dzien&date=${params.returnDate}`}
              />
            ) : null}
            <Field label="Nazwa" htmlFor="name" inline={false}>
              <input
                id="name"
                name="name"
                required
                className="input"
                defaultValue={editingDish?.name ?? ""}
                key={editingDish?.id ?? "new"}
              />
            </Field>
            <ImageFileField
              name="image"
              urlName="imageUrl"
              label="Zdjęcie"
              existingSrc={editingDish?.imagePath}
              existingAlt={editingDish?.name || "Potrawa"}
              existingCaption={editingDish?.name}
              removeName={editingDish ? "removeImage" : undefined}
              size={72}
            />
            {editingDish ? (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={editingDish.active}
                />
                Aktywna w katalogu
              </label>
            ) : null}
            <button type="submit" className="btn btn-primary w-full">
              {editingDish ? "Zapisz potrawę" : "Dodaj potrawę"}
            </button>
            {editingDish ? (
              <Link
                href="/admin/jadlospis?tab=potrawy"
                className="btn btn-secondary btn-xs text-center"
              >
                Anuluj edycję
              </Link>
            ) : null}
          </form>

          <div className="panel overflow-x-auto">
            <table className="compact-table">
              <thead>
                <tr>
                  <th style={{ width: "4rem" }}>Zdjęcie</th>
                  <th>Nazwa</th>
                  <th className="col-check">Aktywna</th>
                  <th className="col-actions">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {dishes.map((d) => {
                  const src = normalizeImageSrc(d.imagePath);
                  return (
                    <tr key={d.id}>
                      <td>
                        {src ? (
                          <ZoomableImage
                            src={src}
                            alt={d.name}
                            caption={d.name}
                            size={44}
                          />
                        ) : (
                          <ThumbPlaceholder label={d.name} size={44} />
                        )}
                      </td>
                      <td className="font-semibold">{d.name}</td>
                      <td className="col-check">
                        {d.active ? (
                          <span className="text-ok text-xs">tak</span>
                        ) : (
                          <span className="text-ink-soft text-xs">nie</span>
                        )}
                      </td>
                      <td className="col-actions">
                        <div className="flex flex-wrap justify-end gap-1">
                          <Link
                            href={`/admin/jadlospis?tab=potrawy&editDish=${d.id}`}
                            className="btn btn-secondary btn-xs"
                          >
                            Edytuj
                          </Link>
                          <form action={deleteDishAction}>
                            <input type="hidden" name="id" value={d.id} />
                            <button
                              type="submit"
                              className="btn btn-danger btn-xs"
                            >
                              Usuń
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {dishes.length === 0 ? (
              <p className="text-sm text-ink-soft py-4 text-center">
                Katalog pusty — dodaj pierwszą potrawę.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
