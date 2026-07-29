import Link from "next/link";
import { ZoomableImage } from "@/components/ZoomableImage";
import { formatPl } from "@/lib/dates";
import type { MenuValueRow } from "@/lib/menu";

export type MenuFieldCol = {
  id: string;
  label: string;
};

type DayRow = {
  id: string;
  date: Date;
  values: MenuValueRow[];
  editHref?: string;
  // Server Action from next
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deleteAction?: (formData: FormData) => any;
};

function valueForField(values: MenuValueRow[], fieldId: string) {
  return values.find((v) => v.fieldDef.id === fieldId) ?? null;
}

export function MenuDayGrid({
  fields,
  days,
  showActions = false,
}: {
  fields: MenuFieldCol[];
  days: DayRow[];
  showActions?: boolean;
}) {
  if (fields.length === 0) {
    return (
      <p className="text-sm text-ink-soft py-4 text-center">
        Brak aktywnych pól jadłospisu.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="menu-day-table">
        <colgroup>
          <col className="col-date" />
          {fields.map((f) => (
            <col key={f.id} />
          ))}
          {showActions ? <col className="col-actions" /> : null}
        </colgroup>
        <thead>
          <tr>
            <th className="col-date">Data</th>
            {fields.map((f) => (
              <th key={f.id}>{f.label}</th>
            ))}
            {showActions ? <th className="col-actions">Akcje</th> : null}
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr key={day.id}>
              <td className="col-date">
                <p className="font-semibold capitalize whitespace-nowrap">
                  {formatPl(day.date, "EEE d MMM")}
                </p>
                {day.editHref ? (
                  <Link
                    href={day.editHref}
                    className="text-[11px] text-brand font-semibold no-print"
                  >
                    Edytuj
                  </Link>
                ) : null}
              </td>
              {fields.map((f) => {
                const cell = valueForField(day.values, f.id);
                return (
                  <td key={f.id}>
                    <div className="menu-field-cell">
                      {cell?.imagePath ? (
                        <ZoomableImage
                          src={cell.imagePath}
                          alt={f.label}
                          caption={cell.value}
                          size={48}
                        />
                      ) : (
                        <div className="thumb bg-bg-deep" aria-hidden />
                      )}
                      {cell?.value ? (
                        <p className="field-value">{cell.value}</p>
                      ) : (
                        <p className="field-empty">—</p>
                      )}
                    </div>
                  </td>
                );
              })}
              {showActions && day.deleteAction ? (
                <td className="col-actions">
                  <form action={day.deleteAction}>
                    <input type="hidden" name="id" value={day.id} />
                    <button type="submit" className="btn btn-danger btn-xs">
                      Usuń
                    </button>
                  </form>
                </td>
              ) : showActions ? (
                <td className="col-actions" />
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
      {days.length === 0 ? (
        <p className="text-sm text-ink-soft py-4 text-center">Brak wpisów.</p>
      ) : null}
    </div>
  );
}
