import { prisma } from "@/lib/db";
import { PageHeader, Field } from "@/components/ui";
import { saveSettingsAction, setSchoolDayAction } from "@/lib/actions/admin-actions";
import { toDateKey } from "@/lib/dates";
import Link from "next/link";

const DEFAULT_RETENTION =
  "Dane kont i kart dzieci przechowujemy przez okres korzystania z żywienia oraz przez czas wymagany przepisami o rachunkowości dla rozliczeń i pokwitowań. Po zakończeniu współpracy dane identyfikujące mogą zostać zanonimizowane przy zachowaniu historii rozliczeń.";

export default async function AdminSettingsPage() {
  const [settings, overrides] = await Promise.all([
    prisma.mealSettings.findUnique({ where: { id: "default" } }),
    prisma.schoolDay.findMany({ orderBy: { date: "desc" }, take: 20 }),
  ]);

  return (
    <>
      <PageHeader
        title="Ustawienia"
        description="Cena obiadu, konto do przelewu, termin zgłoszeń, RODO i wyjątki w kalendarzu."
      />

      <p className="text-xs text-ink-soft mb-3">
        Pozycje i katalog potraw znajdziesz w{" "}
        <Link href="/admin/jadlospis?tab=pozycje" className="underline">
          Jadłospisie
        </Link>
        . Publiczna klauzula:{" "}
        <Link href="/prywatnosc" className="underline">
          /prywatnosc
        </Link>
        .
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <form action={saveSettingsAction} className="panel form-stack">
          <h2 className="font-display text-lg">Ogólne</h2>
          <Field label="Cena obiadu (PLN)" htmlFor="mealPrice">
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
          <Field label="Odbiorca przelewu" htmlFor="bankRecipient">
            <input
              id="bankRecipient"
              name="bankRecipient"
              required
              className="input"
              defaultValue={settings?.bankRecipient ?? ""}
            />
          </Field>
          <Field label="Numer rachunku" htmlFor="bankAccount">
            <input
              id="bankAccount"
              name="bankAccount"
              required
              className="input"
              defaultValue={settings?.bankAccount ?? ""}
            />
          </Field>
          <Field label="Termin zgłoszeń (godzina)" htmlFor="deadlineHour">
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
            Rodzic może zgłosić brak obiadu do tej godziny w dniu posiłku.
            Późniejsze zgłoszenie nie obniża należności.
          </p>

          <h2 className="font-display text-lg pt-2">Administrator danych (RODO)</h2>
          <Field label="Nazwa administratora" htmlFor="controllerName">
            <input
              id="controllerName"
              name="controllerName"
              className="input"
              placeholder="np. Szkoła Podstawowa nr 1"
              defaultValue={
                settings?.controllerName || settings?.bankRecipient || ""
              }
            />
          </Field>
          <Field label="Adres" htmlFor="controllerAddress">
            <input
              id="controllerAddress"
              name="controllerAddress"
              className="input"
              placeholder="ulica, kod, miejscowość"
              defaultValue={settings?.controllerAddress ?? ""}
            />
          </Field>
          <Field label="E-mail w sprawach danych" htmlFor="privacyEmail">
            <input
              id="privacyEmail"
              name="privacyEmail"
              type="email"
              className="input"
              placeholder="iod@szkola.pl"
              defaultValue={settings?.privacyEmail ?? ""}
            />
          </Field>
          <Field label="Informacja o retencji" htmlFor="dataRetentionNote" inline={false}>
            <textarea
              id="dataRetentionNote"
              name="dataRetentionNote"
              className="input min-h-24"
              rows={4}
              defaultValue={settings?.dataRetentionNote || DEFAULT_RETENTION}
            />
          </Field>

          <button type="submit" className="btn btn-primary">
            Zapisz ustawienia
          </button>
        </form>

        <form action={setSchoolDayAction} className="panel form-stack">
          <h2 className="font-display text-lg">Wyjątek w kalendarzu</h2>
          <Field label="Data" htmlFor="date">
            <input id="date" name="date" type="date" required className="input" />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="hasMeals" defaultChecked />
            Tego dnia jest żywienie
          </label>
          <Field label="Notatka" htmlFor="note">
            <input
              id="note"
              name="note"
              className="input"
              placeholder="np. ferie zimowe"
            />
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
                    {o.hasMeals ? "z obiadami" : "bez żywienia"}
                    {o.note ? ` · ${o.note}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </form>
      </div>
    </>
  );
}
