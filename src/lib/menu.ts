export type MenuValueRow = {
  value: string;
  imagePath?: string | null;
  fieldDef: { id: string; label: string; sortOrder: number; active: boolean };
};

export type MenuWithValues = {
  id: string;
  date: Date;
  values: MenuValueRow[];
};

export function sortedMenuValues(values: MenuValueRow[]) {
  return [...values].sort((a, b) => a.fieldDef.sortOrder - b.fieldDef.sortOrder);
}

export function menuSummary(values: MenuValueRow[], maxParts = 6): string {
  return sortedMenuValues(values)
    .filter((v) => v.value.trim())
    .slice(0, maxParts)
    .map((v) => v.value)
    .join(" · ");
}

export function menuLines(values: MenuValueRow[]) {
  return sortedMenuValues(values)
    .filter((v) => v.value.trim())
    .map((v) => ({
      label: v.fieldDef.label,
      value: v.value,
      imagePath: v.imagePath ?? null,
    }));
}
