import { toggleAbsenceAction } from "@/lib/actions/parent-actions";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  formatPl,
  isAbsenceEditable,
  startOfMonth,
  toDateKey,
} from "@/lib/dates";

type DayInfo = {
  dateKey: string;
  hasMeals: boolean;
  absent: boolean;
  menuSummary?: string | null;
};

export function AbsenceCalendar({
  childId,
  year,
  month,
  days,
  deadlineHour,
  readOnly = false,
}: {
  childId: string;
  year: number;
  month: number;
  days: DayInfo[];
  deadlineHour: number;
  readOnly?: boolean;
}) {
  const start = startOfMonth(new Date(year, month - 1, 1));
  const end = endOfMonth(start);
  const allDays = eachDayOfInterval({ start, end });
  const map = new Map(days.map((d) => [d.dateKey, d]));
  const pad = (start.getDay() + 6) % 7; // Monday first

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-display text-2xl capitalize">
          {formatPl(start, "LLLL yyyy")}
        </h2>
        <p className="text-sm text-ink-soft">
          Termin: do {deadlineHour}:00 w dniu obiadu
        </p>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-ink-soft mb-2">
        {["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: pad }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {allDays.map((date) => {
          const key = toDateKey(date);
          const info = map.get(key);
          const weekend = date.getDay() === 0 || date.getDay() === 6;
          if (!info?.hasMeals || weekend) {
            return (
              <div
                key={key}
                className="rounded-xl border border-transparent bg-transparent p-2 text-ink-soft/50 min-h-16"
              >
                <div className="text-sm">{format(date, "d")}</div>
              </div>
            );
          }

          const editable = !readOnly && isAbsenceEditable(date, deadlineHour);
          const content = (
            <>
              <div className="flex items-start justify-between gap-1">
                <span className="font-semibold text-sm">{format(date, "d")}</span>
                {info.absent ? (
                  <span className="text-[10px] font-bold uppercase text-accent">
                    bez obiadu
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-[11px] leading-snug text-ink-soft line-clamp-3">
                {info.menuSummary || "Brak menu"}
              </p>
              {!editable && !readOnly ? (
                <p className="mt-1 text-[10px] text-ink-soft">Zablokowane</p>
              ) : null}
            </>
          );

          if (!editable) {
            return (
              <div
                key={key}
                className="day-cell"
                data-absent={info.absent ? "true" : "false"}
                data-locked="true"
              >
                {content}
              </div>
            );
          }

          return (
            <form key={key} action={toggleAbsenceAction}>
              <input type="hidden" name="childId" value={childId} />
              <input type="hidden" name="date" value={key} />
              <button
                type="submit"
                className="day-cell w-full"
                data-absent={info.absent ? "true" : "false"}
                title={info.absent ? "Przywróć obiad" : "Zgłoś brak obiadu"}
              >
                {content}
              </button>
            </form>
          );
        })}
      </div>
    </div>
  );
}
