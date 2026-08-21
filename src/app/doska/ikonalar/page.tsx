import type { Metadata } from "next";

import { CLASS_COLORS, type ClassColor } from "@/lib/class-colors";
import { iconTint, iconTintStyle } from "@/lib/doska/tint";
import { DOSKA_ICONS } from "@/components/doska/icons";

/* ════════════════════════════════════════════════════════════════════
   IKONA NAZORAT SAHIFASI — /doska/ikonalar

   Ichki vosita, mijoz uchun emas (shuning uchun `noindex`). Uch savolga
   javob beradi:

     1. Ikonalar bir oilaga oʻxshaydimi? — hammasi uch oʻlchamda
        yonma-yon. Qalinligi yoki chetdagi joyi farq qilsa darhol
        koʻrinadi (docs/doska-dizayn-tizimi.md §3.4).
     2. Ikkinchi qatlam ishlayaptimi? — 48px qatorda massa/detal farqi
        koʻrinishi kerak. Koʻrinmasa `opacity` atributi tushib qolgan.
     3. Tuslar oq fonda oʻqiladimi? — pastdagi palitra qatori. Bu yerda
        hech bir tus boshqasidan sezilarli ogʻirroq yoki yengilroq
        boʻlmasligi kerak; tint.ts ularni kontrast boʻyicha tenglaydi.

   ⚠️ 16px qatori ataylab bor. Ikonalar 28px da tanlanadi, lekin
   keyinchalik menyu va roʻyxatlarda 16px da ham ishlatiladi — mayda
   detal oʻsha yerda yoʻqoladi.
   ════════════════════════════════════════════════════════════════════ */

export const metadata: Metadata = {
  title: "Doska ikonalari",
  robots: { index: false, follow: false },
};

/* ⚠️ Klass nomi ATAYLAB toʻliq yozilgan (`size-4`, `size-7`, `size-12`).
   Tailwind klasslarni manbadan matn sifatida topadi — `size-[${px}]`
   kabi dinamik satr CSS chiqarmaydi va ikona oʻlchamsiz qoladi
   (docs/…: «Tailwind variant klass boʻshliqlari»). */
const SIZES = [
  { px: 16, cls: "size-4", label: "16px — roʻyxat, menyu" },
  { px: 28, cls: "size-7", label: "28px — vidjet paneli" },
  { px: 48, cls: "size-12", label: "48px — boʻsh holat" },
];

/* JSX teg nomi katta harfli identifikator boʻlishi kerak —
   `<DOSKA_ICONS[0].Icon/>` sintaksis xatosi beradi. */
const SampleIcon = DOSKA_ICONS[0].Icon;

export default function DoskaIconsPage() {
  return (
    <main className="bg-background mx-auto min-h-screen max-w-5xl px-6 py-10">
      <header className="mb-10">
        <h1 className="text-2xl font-semibold tracking-tight">Doska ikonalari</h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          Solar bold-duotone · {DOSKA_ICONS.length} ta · ierarxik ranglash
        </p>
      </header>

      {SIZES.map(({ px, cls, label }) => (
        <section key={px} className="mb-10">
          <h2 className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
            {label}
          </h2>
          <div className="flex flex-wrap gap-x-6 gap-y-5 rounded-lg border p-5">
            {DOSKA_ICONS.map(({ name, source, Icon }) => (
              <div key={name} className="flex w-24 flex-col items-center gap-2">
                <div className="grid h-12 place-items-center">
                  <Icon className={`${cls} text-foreground/85`} />
                </div>
                <span
                  className="text-muted-foreground w-full truncate text-center text-[10px]"
                  title={`${name} · ${source}`}
                >
                  {source.replace("solar:", "")}
                </span>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* ── Tuslar: hammasi oq fonda teng ogʻirlikda koʻrinishi kerak ── */}
      <section className="mb-10">
        <h2 className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
          Tuslar — 28px, oq fonda
        </h2>
        <div className="flex flex-wrap gap-x-5 gap-y-4 rounded-lg border bg-white p-5">
          {CLASS_COLORS.map((color: ClassColor) => (
            <div key={color} className="flex w-20 flex-col items-center gap-1.5">
              <span
                data-icon-tinted=""
                style={iconTintStyle(color)}
                className="grid size-10 place-items-center"
              >
                <SampleIcon className="size-7" />
              </span>
              <span className="text-center text-[10px] text-neutral-500">{color}</span>
              <span className="text-center font-mono text-[9px] leading-tight text-neutral-400">
                {iconTint(color).replace("oklch(", "").replace(")", "")}
              </span>
            </div>
          ))}
        </div>
      </section>

      <p className="text-muted-foreground max-w-prose text-xs leading-relaxed">
        Yangi ikona qoʻshganda: 24×24 viewBox, mazmun ~20×20 ichida, bitta massa
        qatlami <code className="text-foreground">opacity=&quot;.5&quot;</code> bilan,
        faqat <code className="text-foreground">fill</code> (stroke yoʻq), va
        <code className="text-foreground"> DOSKA_ICONS</code> roʻyxatiga yozib qoʻying.
      </p>
    </main>
  );
}
