import { ZoomableImage, ThumbPlaceholder } from "@/components/ZoomableImage";
import { sortedMenuValues, type MenuValueRow } from "@/lib/menu";
import { normalizeImageSrc } from "@/lib/image-url";

export function MenuThumbsSummary({
  values,
  thumbSize = 56,
}: {
  values: MenuValueRow[];
  thumbSize?: number;
  maxSummary?: number;
}) {
  const items = sortedMenuValues(values).filter((v) => v.value.trim());

  if (items.length === 0) {
    return <p className="text-xs text-ink-soft">Brak menu</p>;
  }

  return (
    <div className="menu-thumbs-summary">
      <ul className="menu-thumbs-list">
        {items.map((v) => {
          const src = normalizeImageSrc(v.imagePath);
          const dish = v.value.trim();
          return (
            <li key={v.fieldDef.id} className="menu-thumb-item">
              {src ? (
                <ZoomableImage
                  src={src}
                  alt={v.fieldDef.label}
                  caption={dish}
                  className="thumb"
                  size={thumbSize}
                />
              ) : (
                <ThumbPlaceholder
                  label={v.fieldDef.label}
                  size={thumbSize}
                  className="thumb"
                />
              )}
              <div className="menu-thumb-meta">
                <p className="menu-thumb-label">{v.fieldDef.label}</p>
                <p className="menu-thumb-value">{dish}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
