"use client";

/* Lessons turʼi — darsni yon roʻyxatdan kalendarga tortib rejalashtirishni
   koʻrsatuvchi mini illyustratsiya (CSS animatsiya, tokenlangan). */

export function LessonsCalendarMock() {
  return (
    <div className="relative flex gap-3 text-xs">
      <style>{`
        @keyframes ls-drop {
          0%   { transform: translate(0,0); opacity: 0; }
          15%  { opacity: 1; }
          65%  { transform: translate(-96px, 34px); opacity: 1; }
          78%  { transform: translate(-96px, 34px); opacity: 1; }
          100% { transform: translate(-96px, 34px); opacity: 0; }
        }
      `}</style>

      {/* Mini oy grid */}
      <div className="grid flex-1 grid-cols-5 grid-rows-3 gap-1">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="relative h-8 rounded-sm border border-border/70 bg-muted/40">
            {i === 6 && (
              <span className="absolute inset-x-0.5 top-0.5 truncate rounded-sm bg-primary/20 px-1 text-[9px] font-medium text-foreground">
                Kasrlar
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Darslar roʻyxati */}
      <div className="w-24 shrink-0 rounded-lg border border-border bg-background p-2">
        <p className="mb-2 text-[10px] font-semibold text-muted-foreground">Darslar</p>
        <div className="rounded-md border border-primary/40 bg-primary/10 px-2 py-1.5 font-medium text-foreground">
          Kasrlar
        </div>
      </div>

      {/* Koʻchayotgan ghost dars */}
      <div
        className="pointer-events-none absolute right-3 top-9 rounded-md bg-primary/80 px-2 py-1.5 font-medium text-primary-foreground shadow-md"
        style={{ animation: "ls-drop 2.8s ease-in-out infinite" }}
      >
        Kasrlar
      </div>
    </div>
  );
}
