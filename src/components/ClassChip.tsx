import { X } from "lucide-react";

import { ClassSwatch } from "@/components/ClassSwatch";
import { CLASS_COLOR_HEX, classTints, type ClassColor } from "@/lib/class-colors";
import { cn } from "@/lib/utils";

/**
 * SINF CHIPI — formada TANLANGAN sinfni koʻrsatuvchi, bosiladigan element.
 *
 * `ClassBadge` bilan farqi vazifada, oʻlchamda emas:
 *   badge — oʻqiladi (dars kartasidagi yorliq), 20px qobiq / 11px matn;
 *   chip  — bosiladi (tanlovchi trigger, sana guruhi), 24px qobiq / 12px matn
 *           + `onRemove` berilsa krestcha. Bosish nishoni 20px ga sigʻmaydi.
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
 *
 * ── ANATOMIYA (tanlanmagan — CHIQARILGAN) ────────────────────────────────
 * Balandlik **24px** (`h-6`) ikkita mustaqil chegaradan kelib chiqadi va
 * ikkalasi ham bir xil son beradi:
 *   1) Idish: chip `min-h-9` (36px) tugma ichida turadi, tugmaning `py-1.5`
 *      i 12px yeydi → 24px qoladi (`docs/design-system.md` §3, 36px).
 *   2) Matn: `text-xs` qator balandligi 16px + `py-1` (4+4) = 24px.
 * Avvalgi 28px hech qaysi hisobdan chiqmagan (klondan koʻchirilgan edi) va
 * tugmani 40px ga choʻzib, 36px shkalasidan chiqarib yuborardi.
 *
 * Krestcha nishoni **24×24** — WCAG 2.2 §2.5.8 (AA) minimal nishon
 * oʻlchami. Ilgari u 12×12 edi (faqat ikonaning oʻzi, paddingsiz).
 * Chip balandligi ham 24px boʻlgani uchun nishon qoʻshimcha joy soʻramaydi
 * — shuning uchun `pr-0`: tugmaning oʻng chekkasi chip chekkasi bilan
 * ustma-ust tushadi, ikona esa markazda qoladi.
 *
 * Masofalar 4pt gridда (`docs/design-system.md` §6.5): gap 4, padding 8.
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
        "inline-flex h-6 min-w-0 items-center gap-1 rounded-full text-xs font-medium",
        onRemove ? "pl-2 pr-0" : "px-2",
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
          className="flex size-6 shrink-0 items-center justify-center rounded-full opacity-60 transition-opacity hover:opacity-100"
        >
          <X className="size-3" />
        </button>
      )}
    </span>
  );
}
