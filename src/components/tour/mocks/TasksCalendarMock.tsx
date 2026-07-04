"use client";

/* Tasks turʼi — vazifani kalendar kuniga tortib muddat belgilashni
   koʻrsatuvchi mini illyustratsiya (CSS animatsiya, tokenlangan). */

export function TasksCalendarMock() {
  return (
    <div className="relative flex gap-3 text-xs">
      <style>{`
        @keyframes tk-drop {
          0%   { transform: translate(0,0); opacity: 0; }
          15%  { opacity: 1; }
          65%  { transform: translate(104px, 30px); opacity: 1; }
          78%  { transform: translate(104px, 30px); opacity: 1; }
          100% { transform: translate(104px, 30px); opacity: 0; }
        }
      `}</style>

      {/* Vazifalar roʻyxati */}
      <div className="w-24 shrink-0 rounded-lg border border-border bg-background p-2">
        <p className="mb-2 text-[10px] font-semibold text-muted-foreground">Vazifalar</p>
        <div className="rounded-md border border-primary/40 bg-primary/10 px-2 py-1.5 font-medium text-foreground">
          Baholash
        </div>
      </div>

      {/* Mini oy grid */}
      <div className="grid flex-1 grid-cols-5 grid-rows-3 gap-1">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="h-8 rounded-sm border border-border/70 bg-muted/40" />
        ))}
      </div>

      {/* Koʻchayotgan ghost vazifa */}
      <div
        className="pointer-events-none absolute left-3 top-9 rounded-md bg-primary/80 px-2 py-1.5 font-medium text-primary-foreground shadow-md"
        style={{ animation: "tk-drop 2.7s ease-in-out infinite" }}
      >
        Baholash
      </div>
    </div>
  );
}
