import { ClassSwatch } from "@/components/ClassSwatch";
import { CLASS_COLOR_HEX, classTints, type ClassColor } from "@/lib/class-colors";
import { cn } from "@/lib/utils";

/**
 * SINF BADGE'i — sinf NOMINI **oʻqiladigan yorliq** sifatida koʻrsatish.
 *
 * Anatomiyasi (oʻzgarmaydi):
 *   `rounded-full` + `tints.badge` (18%) fon + `tints.text` siyoh +
 *   kanonik `ClassSwatch` doirasi + 11px matn, `leading-none`.
 *   Balandlik 18px, matn 11px/line-height 1 → 7px vertikal havo. Avval
 *   `text-xs` (12px/16px line-height) ishlatilgan edi: 18px qobiqda atigi
 *   2px havo qolib, matn "siqilgan" koʻrinardi.
 *
 * Qachon ishlatiladi: sinf nomi mustaqil YORLIQ sifatida turganda — boshqa
 * mazmun (mavzu, vaqt, oʻquvchi) ichida "bu qaysi sinf" degan savolga javob
 * beruvchi element. Sinf nomi qatorning ASOSIY sarlavhasi boʻlsa (sinflar
 * roʻyxati, breadcrumb) badge kerak emas — u yerda yolgʻiz `ClassSwatch`
 * + oddiy matn ishlatiladi. [[class-swatch-standard]]
 *
 * ⛔ Bu BOSILADIGAN element emas. Formada tanlangan sinfni koʻrsatuvchi,
 * krestchasi bor, barmoq bilan bosiladigan chip uchun `ClassChip` bor —
 * u kattaroq (12px matn), chunki 18px qobiq bosish nishoni uchun kichik.
 * Ikkisi oʻlcham prop'i bilan emas, ALOHIDA NOM bilan ajratilgan: chaqiruv
 * joyida "kattasinimi, kichiginimi?" degan savol umuman tugʻilmaydi.
 *
 * Oʻlcham `className` orqali sozlanmaydi; shakl va rang retsepti oʻzgarmaydi.
 */
export function ClassBadge({
  color,
  name,
  className,
}: {
  color: ClassColor;
  name: string;
  className?: string;
}) {
  const tints = classTints(color);
  return (
    <span
      style={{ ...tints.badge, ...tints.text }}
      className={cn(
        "flex h-[18px] min-w-0 items-center gap-1 rounded-full pl-1 pr-1.5 text-[11px] font-semibold leading-none",
        className,
      )}
    >
      <ClassSwatch hex={CLASS_COLOR_HEX[color]} />
      <span className="min-w-0 truncate">{name}</span>
    </span>
  );
}
