import { ClassSwatch } from "@/components/ClassSwatch";
import { CLASS_COLOR_HEX, classTints, type ClassColor } from "@/lib/class-colors";
import { cn } from "@/lib/utils";

/**
 * SINF BADGE'i — sinf NOMINI **oʻqiladigan yorliq** sifatida koʻrsatish.
 *
 * Anatomiyasi (oʻzgarmaydi):
 *   `rounded-full` + `tints.badge` (18%) fon + `tints.text` siyoh +
 *   kanonik `ClassSwatch` doirasi + 11px matn, `leading-none`.
 *   Balandlik **20px** (`h-5`), matn 11px/line-height 1 → 9px vertikal
 *   havo. Masofalar 4pt gridда (`docs/design-system.md` §6.5): gap 4,
 *   padding 4/8.
 *
 *   Avval balandlik 18px, oʻng padding 6px edi — ikkalasi ham 4 ga
 *   boʻlinmaydi va gridдан tashqarida edi. Eski 18px izohda ikkita tashqi
 *   mahsulotning yorliq nisbatlariga havola qilib asoslangan edi; havola
 *   olib tashlandi (AGENTS.md kod izohlarida boshqa mahsulot nomini
 *   taqiqlaydi), oʻlcham esa gridга qayta chiqarildi.
 *
 *   `text-[11px]` ataylab — `text-xs` (12px/16px line-height) qobiqni
 *   siqib, matnni "bosilgan" koʻrsatardi.
 *
 * Qachon ishlatiladi: sinf nomi mustaqil YORLIQ sifatida turganda — boshqa
 * mazmun (mavzu, vaqt, oʻquvchi) ichida "bu qaysi sinf" degan savolga javob
 * beruvchi element. Sinf nomi qatorning ASOSIY sarlavhasi boʻlsa (sinflar
 * roʻyxati, breadcrumb) badge kerak emas — u yerda yolgʻiz `ClassSwatch`
 * + oddiy matn ishlatiladi. [[class-swatch-standard]]
 *
 * ⛔ Bu BOSILADIGAN element emas. Formada tanlangan sinfni koʻrsatuvchi,
 * krestchasi bor, barmoq bilan bosiladigan chip uchun `ClassChip` bor —
 * u kattaroq (24px, 12px matn), chunki 20px qobiq bosish nishoni uchun kichik.
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
        "flex h-5 min-w-0 items-center gap-1 rounded-full pl-1 pr-2 text-[11px] font-semibold leading-none",
        className,
      )}
    >
      <ClassSwatch hex={CLASS_COLOR_HEX[color]} />
      <span className="min-w-0 truncate">{name}</span>
    </span>
  );
}
