"use client";

/* Timetable turʼi — sinf kartasini yon paneldan grid katagiga tortishni
   koʻrsatuvchi CSS animatsiya (tashqi faylsiz, tokenlangan). */

export function TimetableDragMock() {
  return (
    <div className="relative flex gap-3 text-xs">
      <style>{`
        @keyframes tt-drag {
          0%   { transform: translate(0, 0); opacity: 0; }
          12%  { opacity: 1; }
          60%  { transform: translate(120px, 26px); opacity: 1; }
          72%  { transform: translate(120px, 26px); opacity: 1; }
          100% { transform: translate(120px, 26px); opacity: 0; }
        }
      `}</style>

      {/* Sinflar paneli */}
      <div className="w-28 shrink-0 rounded-lg border border-border bg-background p-2">
        <p className="mb-2 text-[10px] font-semibold text-muted-foreground">Sinflar</p>
        <div className="rounded-md border border-primary/40 bg-primary/10 px-2 py-1.5 font-medium text-foreground">
          Matematika
        </div>
      </div>

      {/* Mini grid */}
      <div className="grid flex-1 grid-cols-4 grid-rows-3 gap-1">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-7 rounded-sm border border-border/70 bg-muted/40" />
        ))}
      </div>

      {/* Koʻchayotgan ghost karta */}
      <div
        className="pointer-events-none absolute left-2 top-8 rounded-md bg-primary/80 px-2 py-1.5 font-medium text-primary-foreground shadow-md"
        style={{ animation: "tt-drag 2.6s ease-in-out infinite" }}
      >
        Matematika
      </div>
    </div>
  );
}
