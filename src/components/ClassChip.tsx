import { X } from "lucide-react";

import { ClassSwatch } from "@/components/ClassSwatch";
import { CLASS_COLOR_HEX, classTints, type ClassColor } from "@/lib/class-colors";
import { cn } from "@/lib/utils";

/**
 * SINF CHIPI — formada TANLANGAN sinfni koʻrsatuvchi, bosiladigan element.
 *
 * `ClassBadge` bilan farqi vazifada, oʻlchamda emas:
 *   badge — oʻqiladi (dars kartasidagi yorliq), 18px qobiq / 11px matn;
 *   chip  — bosiladi (tanlovchi trigger, sana guruhi), 12px matn + `onRemove`
 *           berilsa krestcha. Barmoq nishoni 18px qobiqqa sigʻmaydi.
 *
 * Nega alohida komponent, `size` prop emas: oʻlcham prop'i chaqiruv joyida
 * qaror talab qiladi, qaror esa vaqt oʻtib driftga aylanadi — `ClassSwatch`
 * aynan shundan 4 xil oʻlchamga boʻlinib ketgan edi. Nom qaror talab
 * qilmaydi: yozuvmi — badge, tugmami — chip.
 *
 * Rang retsepti badge bilan AYNAN bir xil (`classTints().badge` + `.text`),
 * yagona manba `@/lib/class-colors`. Avval toʻrt joyda qoʻlda `color-mix(…
 * 12%…)` yozilgan edi — ular badge'dan bir oz xiraroq chiqar va nega
 * bunday ekani hech qayerda yozilmagan edi.
 */
export function ClassChip({
  color,
  name,
  onRemove,
  removeLabel,
  className,
}: {
  color: ClassColor;
  name: string;
  /** Berilsa oʻng tomonda krestcha chiqadi va padding shunga moslashadi. */
  onRemove?: () => void;
  removeLabel?: string;
  className?: string;
}) {
  const tints = classTints(color);
  return (
    <span
      data-slot="class-chip"
      style={{ ...tints.badge, ...tints.text }}
      className={cn(
        "inline-flex min-w-0 items-center gap-1.5 rounded-full text-xs font-medium",
        onRemove ? "py-0.5 pl-2 pr-1" : "px-2.5 py-1",
        className,
      )}
    >
      <ClassSwatch hex={CLASS_COLOR_HEX[color]} />
      <span className="min-w-0 truncate">{name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          className="shrink-0 opacity-60 transition-opacity hover:opacity-100"
        >
          <X className="size-3" />
        </button>
      )}
    </span>
  );
}
