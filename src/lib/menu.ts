export type MenuValueRow = {
  dish?: {
    id: string;
    name: string;
    imagePath?: string | null;
    active?: boolean;
  } | null;
  /** @deprecated use dish — kept for gradual typing */
  value?: string;
  imagePath?: string | null;
  fieldDef: { id: string; label: string; sortOrder: number; active: boolean };
};

export type MenuWithValues = {
  id: string;
  date: Date;
  values: MenuValueRow[];
};

export function dishName(v: MenuValueRow): string {
  return (v.dish?.name || v.value || "").trim();
}

export function dishImage(v: MenuValueRow): string | null {
  return v.dish?.imagePath ?? v.imagePath ?? null;
}

export function sortedMenuValues(values: MenuValueRow[]) {
  return [...values].sort((a, b) => a.fieldDef.sortOrder - b.fieldDef.sortOrder);
}

export function menuSummary(values: MenuValueRow[], maxParts = 6): string {
  return sortedMenuValues(values)
    .map(dishName)
    .filter(Boolean)
    .slice(0, maxParts)
    .join(" · ");
}

export function menuLines(values: MenuValueRow[]) {
  return sortedMenuValues(values)
    .filter((v) => dishName(v))
    .map((v) => ({
      label: v.fieldDef.label,
      value: dishName(v),
      imagePath: dishImage(v),
    }));
}
