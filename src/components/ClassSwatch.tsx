import { cn } from "@/lib/utils";

/**
 * Sinf rangi indikatori — YAGONA standart: **8px doira**, boshqa oʻlcham yoʻq.
 *
 * ⛔ Oʻlchamni chaqiruv joyida oʻzgartirib boʻlmaydi. `size-2` `cn()` da
 * `className`dan KEYIN turadi, `cn` esa `tailwind-merge` ustiga qurilgan
 * (`@/lib/utils`) — shuning uchun `className="size-3"` yozilsa ham gʻolib
 * `size-2` boʻladi. Bu ataylab: 2026-09 gacha oʻlcham `className` orqali
 * berilardi va loyihada 4 xil doira paydo boʻlgan edi (6/8/10/12px), hatto
 * bir xil kontekstda ham. Auditda 12px hech qachon ataylab tanlanmagani
 * aniqlandi — u shunchaki eski default edi.
 *
 * Nega aynan 8px: doira KATTALIK oʻlchamaydi, u «bu qaysi sinf» degan
 * savolga RANG bilan javob beradi. 8px eng tor idishda ham (`ClassBadge`ning
 * 18px qobigʻi, 11px matn) va 14px matnli qatorda ham bir xil oʻqiladi.
 *
 * `className` boshqa maqsadlar uchun ochiq qoladi — joylashuv (`absolute`,
 * `-translate-y-1/2`) va halqa (`ring-1 ring-card`).
 *
 * Ustma-ust taxlangan koʻp-sinf belgisi uchun bu emas, `ClassSwatchStack`
 * ishlatiladi — u boshqa anatomiya (halqa + manfiy masofa).
 */
export function ClassSwatch({
  hex,
  className,
  style,
}: {
  hex: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      data-slot="class-swatch"
      className={cn("shrink-0 rounded-full", className, "size-2")}
      style={{ backgroundColor: hex, ...style }}
    />
  );
}

/**
 * Koʻp sinf belgisi — ustma-ust taxlangan doiralar.
 *
 * `ClassSwatch`dan ALOHIDA komponent, chunki vazifasi boshqa: u «bu qaysi
 * sinf» emas, «bu nechta sinf» deydi. Anatomiyasi ham boshqa — halqa
 * (`ring-2 ring-card`) doiralarni bir-biridan ajratadi, halqa esa diametrni
 * yeydi: 8px doira halqadan keyin rangi oʻqilmay qoladi. Shu sabab bu yerda
 * 12px — bu qoidaga istisno emas, boshqa qoida.
 *
 * Avval toʻrt joyda uch xil retsept bor edi (10px/ring-1, 12px/ring-2,
 * 20px/ring-2 — ikki joyda) — hammasi shu bittaga keladi.
 *
 * Ustma-ust masofa −4px (`-space-x-1`): 12px doiradan 8px koʻrinib qoladi,
 * rangni tanish uchun yetarli, va 4pt gridда. `ring-2` (2px) esa ataylab
 * gridдан tashqarida — halqa/chegara sinfi unga boʻysunmaydi, xuddi
 * hujjatdagi 1px chegara va 3px `rail` kabi (`docs/design-system.md` §6.4).
 *
 * @param pad — yetishmagan katakni xira rang bilan toʻldiradi (har doim
 *   `max` ta doira koʻrinsin degan joylar uchun).
 */
export function ClassSwatchStack({
  hexes,
  max = 3,
  pad = false,
  className,
}: {
  hexes: string[];
  max?: number;
  pad?: boolean;
  className?: string;
}) {
  const cells = hexes.slice(0, max);
  if (pad) while (cells.length < max) cells.push("var(--muted-foreground)");

  return (
    <span
      data-slot="class-swatch-stack"
      className={cn("flex shrink-0 items-center -space-x-1", className)}
      aria-hidden
    >
      {cells.map((c, i) => (
        <span
          key={i}
          className="size-3 shrink-0 rounded-full ring-2 ring-card"
          style={{ backgroundColor: c }}
        />
      ))}
    </span>
  );
}
