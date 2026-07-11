"use client";

/* Timetable turʼi — sinf kartasini yon paneldan grid katagiga tortishni
   koʻrsatuvchi CSS animatsiya (tashqi faylsiz, tokenlangan).

   Ikki qatlam: koʻchayotgan "ghost" karta (panel'dan katakka boradi, keyin
   soʻnadi) va katak ichidagi "joylashgan" chip (ghost yetib kelganda paydo
   boʻlib, uzoq vaqt turadi — "joyida qoladi" taassurotini beradi). */

const TARGET_INDEX = 9; // 4 ustunli setkada 3-qator, 2-ustun

export function TimetableDragMock() {
  return (
    <div className="relative flex w-full max-w-md gap-4 text-sm">
      <style>{`
        @keyframes tt-drag-ghost {
          0%   { transform: translate(0, 0); opacity: 0; }
          10%  { opacity: 1; }
          55%  { transform: translate(96px, 78px); opacity: 1; }
          62%  { transform: translate(96px, 78px); opacity: 0; }
          100% { transform: translate(96px, 78px); opacity: 0; }
        }
        @keyframes tt-drag-settle {
          0%, 58%   { opacity: 0; }
          64%, 94%  { opacity: 1; }
          100%      { opacity: 0; }
        }
      `}</style>

      {/* Sinflar paneli */}
      <div className="w-32 shrink-0 rounded-lg border border-border bg-background p-3">
        <p className="mb-2.5 text-xs font-semibold text-muted-foreground">Sinflar</p>
        <div className="rounded-md border border-primary/40 bg-primary/10 px-2.5 py-2 text-xs font-medium text-foreground">
          Matematika 7-A
        </div>
      </div>

      {/* Mini grid */}
      <div className="grid flex-1 grid-cols-4 grid-rows-6 gap-1.5">
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} className="relative h-8 rounded-md border border-border/70 bg-muted/40">
            {i === TARGET_INDEX && (
              <span
                className="absolute inset-0.5 flex items-center justify-center rounded-[4px] border border-primary/40 bg-primary/15 px-1 text-[9px] font-medium leading-tight text-foreground"
                style={{ animation: "tt-drag-settle 2.6s ease-in-out infinite" }}
              >
                Matematika
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Koʻchayotgan ghost karta */}
      <div
        className="pointer-events-none absolute left-3 top-11 rounded-md bg-primary/80 px-2.5 py-2 text-xs font-medium text-primary-foreground shadow-md"
        style={{ animation: "tt-drag-ghost 2.6s ease-in-out infinite" }}
      >
        Matematika 7-A
      </div>
    </div>
  );
}
