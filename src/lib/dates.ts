import {
  addDays,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isWeekend,
  parseISO,
  setHours,
  setMinutes,
  setSeconds,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { pl } from "date-fns/locale";

export function toDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function parseDateKey(key: string): Date {
  return startOfDay(parseISO(key));
}

export function formatPl(date: Date, pattern = "d MMMM yyyy"): string {
  return format(date, pattern, { locale: pl });
}

export function monthLabel(year: number, month: number): string {
  return format(new Date(year, month - 1, 1), "LLLL yyyy", { locale: pl });
}

export function defaultMealDaysInMonth(year: number, month: number): Date[] {
  const start = startOfMonth(new Date(year, month - 1, 1));
  const end = endOfMonth(start);
  return eachDayOfInterval({ start, end }).filter((d) => !isWeekend(d));
}

/** Deadline is the meal day itself at deadlineHour:00 local time */
export function isAbsenceEditable(
  mealDate: Date,
  deadlineHour: number,
  now = new Date(),
): boolean {
  const deadline = setSeconds(
    setMinutes(setHours(startOfDay(mealDate), deadlineHour), 0),
    0,
  );
  return !isAfter(now, deadline);
}

export function transferTitle(
  year: number,
  month: number,
  firstName: string,
  lastName: string,
): string {
  const ym = `${year}-${String(month).padStart(2, "0")}`;
  return `Obiad ${ym} ${firstName} ${lastName}`;
}

export {
  addDays,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isWeekend,
  startOfDay,
  startOfMonth,
};
