import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LANDING_TONES } from "@/components/landing/landing-tones";

/* ════════════════════════════════════════════════════════════════════
   LANDING VIZUAL NAMUNALARI — mahsulotning soddalashtirilgan koʻrinishi.

   Kartadagi rasm oʻrnida turadi: kirgan odam vaʼdani emas, mahsulotning
   oʻzini koʻrsin. Haqiqiy skrinshotlar (scripts/capture-screens.mjs)
   tayyor boʻlganda almashtiriladi — shungacha bu namunalar haqiqiy
   UI'ning tuzilishini takrorlaydi: jurnal katagi, javob ustunlari,
   slayd, doska taymeri. Oʻylab topilgan imkoniyat chizilmaydi.

   Matn — namunaning bir qismi (ism, raqam), shuning uchun tarjima
   qilinmaydi: sinf jurnalidagi «Laylo» ham rus tilidagi sahifada Laylo.
   ════════════════════════════════════════════════════════════════════ */

/** Tashqi qobiq — rangli fon ustida oq «ekran».
    `aria-hidden`: bu bezak — ichidagi soxta ism va baholarni ekran
    oʻquvchi kartaning haqiqiy sarlavhasidan oldin oʻqimasin. */
function MockFrame({
  tint,
  className,
  children,
}: {
  tint: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div aria-hidden className={cn("flex aspect-video w-full items-center justify-center p-5", tint)}>
      <div className={cn("w-full max-w-64 rounded-lg border border-border bg-card p-3", className)}>
        {children}
      </div>
    </div>
  );
}

const SCORE_TONE: Record<number, string> = {
  5: "bg-success text-success-foreground",
  4: "bg-success/70 text-success-foreground",
  3: "bg-warning text-warning-foreground",
  2: "bg-destructive text-destructive-foreground",
};

const JOURNAL_ROWS: { name: string; scores: number[] }[] = [
  { name: "Laylo K.", scores: [5, 5, 4, 5] },
  { name: "Bekzod R.", scores: [4, 3, 4, 4] },
  { name: "Jasur T.", scores: [3, 2, 3, 2] },
  { name: "Dilnoza A.", scores: [5, 4, 5, 5] },
];

export function JournalMock() {
  return (
    <MockFrame tint={LANDING_TONES.jurnal.tint}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-caption font-medium text-foreground">9-A · Matematika</span>
        <span className="text-micro text-muted-foreground">1-chorak</span>
      </div>
      <ul className="flex flex-col gap-1.5">
        {JOURNAL_ROWS.map((row) => (
          <li key={row.name} className="flex items-center gap-2">
            <span className="w-16 truncate text-micro text-muted-foreground">{row.name}</span>
            <span className="flex flex-1 gap-1">
              {row.scores.map((s, i) => (
                <span
                  key={i}
                  className={cn(
                    "flex size-5 items-center justify-center rounded text-micro",
                    SCORE_TONE[s],
                  )}
                >
                  {s}
                </span>
              ))}
            </span>
            {/* Oʻrtachasi past — «eʼtibor kerak» belgisi */}
            {row.scores.reduce((a, b) => a + b, 0) / row.scores.length < 3 ? (
              <span className="rounded-full bg-destructive/10 px-1.5 text-micro text-destructive">!</span>
            ) : (
              <span className="px-1.5 text-micro text-transparent">!</span>
            )}
          </li>
        ))}
      </ul>
    </MockFrame>
  );
}

/** Javob variantlari — rangli, harfli (sahna uslubidagi rangli javoblar). */
const ANSWERS: { letter: string; tone: string; count: number; correct?: boolean }[] = [
  { letter: "A", tone: "bg-rose-500", count: 3 },
  { letter: "B", tone: "bg-sky-500", count: 18, correct: true },
  { letter: "C", tone: "bg-amber-400", count: 5 },
  { letter: "D", tone: "bg-emerald-500", count: 2 },
];

export function AssessmentMock() {
  const max = Math.max(...ANSWERS.map((a) => a.count));
  return (
    <MockFrame tint={LANDING_TONES.baholash.tint}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-caption font-medium text-foreground">5-savol</span>
        <span className="text-micro text-muted-foreground">28 ta javob</span>
      </div>
      <ul className="flex flex-col gap-1.5">
        {ANSWERS.map((a) => (
          <li key={a.letter} className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded text-micro text-white",
                a.tone,
              )}
            >
              {a.letter}
            </span>
            <span className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
              <span
                className={cn("block h-full rounded-full", a.correct ? "bg-success" : "bg-muted-foreground/30")}
                style={{ width: `${(a.count / max) * 100}%` }}
              />
            </span>
            <span className="w-4 text-right text-micro tabular-nums text-muted-foreground">{a.count}</span>
          </li>
        ))}
      </ul>
    </MockFrame>
  );
}

/** Soʻz buluti — slayd orasidagi fikr yigʻish savoli. */
const CLOUD: { word: string; size: string }[] = [
  { word: "quyosh", size: "text-title" },
  { word: "barg", size: "text-caption" },
  { word: "kislorod", size: "text-body" },
  { word: "suv", size: "text-caption" },
  { word: "xlorofill", size: "text-title-sm" },
  { word: "yorugʻlik", size: "text-micro" },
];

export function PresentationMock() {
  return (
    <MockFrame tint={LANDING_TONES.taqdimot.tint}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-caption font-medium text-foreground">Fotosintez</span>
        <span className="text-micro text-muted-foreground">4 / 12</span>
      </div>
      <div className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1 rounded-md bg-muted/60 px-2 py-3">
        {CLOUD.map((w, i) => (
          <span
            key={w.word}
            className={cn(
              w.size,
              "font-semibold",
              i % 2 === 0 ? LANDING_TONES.taqdimot.text : "text-foreground",
            )}
          >
            {w.word}
          </span>
        ))}
      </div>
    </MockFrame>
  );
}

/** Sinf ekrani — taymer va svetofor. */
export function BoardMock() {
  return (
    <div aria-hidden className={cn("flex aspect-video w-full items-center justify-center p-5", LANDING_TONES.doska.tint)}>
      <div className="flex w-full max-w-64 items-center justify-between gap-4 rounded-lg bg-emerald-950 px-5 py-4">
        <span className="text-headline font-semibold tabular-nums text-white">04:59</span>
        <span className="flex flex-col gap-1.5 rounded-full bg-black/40 p-1.5">
          <span className="size-3 rounded-full bg-rose-500/30" />
          <span className="size-3 rounded-full bg-amber-400/30" />
          <span className="size-3 rounded-full bg-emerald-400" />
        </span>
      </div>
    </div>
  );
}
