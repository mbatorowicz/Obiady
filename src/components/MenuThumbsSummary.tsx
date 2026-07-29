import { ZoomableImage } from "@/components/ZoomableImage";
import { menuSummary, sortedMenuValues, type MenuValueRow } from "@/lib/menu";

export function MenuThumbsSummary({
  values,
  thumbSize = 56,
  maxSummary = 6,
}: {
  values: MenuValueRow[];
  thumbSize?: number;
  maxSummary?: number;
}) {
  const items = sortedMenuValues(values).filter((v) => v.value.trim());
  const withImages = items.filter((v) => v.imagePath);
  const summary = menuSummary(values, maxSummary);

  if (items.length === 0) {
    return <p className="text-xs text-ink-soft">Brak menu</p>;
  }

  return (
    <div className="menu-thumbs-summary">
      {withImages.length > 0 ? (
        <div className="menu-thumbs-row">
          {withImages.map((v) => (
            <ZoomableImage
              key={v.fieldDef.id + v.value}
              src={v.imagePath!}
              alt={v.fieldDef.label}
              caption={v.value}
              className="thumb"
              size={thumbSize}
            />
          ))}
        </div>
      ) : null}
      <p className="menu-thumbs-caption">{summary || "—"}</p>
    </div>
  );
}
