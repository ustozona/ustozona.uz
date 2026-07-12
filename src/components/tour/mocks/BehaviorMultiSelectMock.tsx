"use client";

/* Xulq turʼi — kartochkaga sichqoncha olib borilganda chiqadigan doiracha
   orqali bir nechta oʻquvchini tanlab, ularga birga ball berishni
   koʻrsatuvchi mini illyustratsiya (CSS animatsiya, tokenlangan). */

const SELECTED = [0, 2];

export function BehaviorMultiSelectMock() {
  return (
    <div className="relative flex w-full max-w-xs flex-col items-center gap-4 text-xs">
      <style>{`
        @keyframes bh-select-ring {
          0%, 8%    { opacity: 0; transform: scale(0.9); }
          16%, 82%  { opacity: 1; transform: scale(1); }
          92%, 100% { opacity: 0; transform: scale(0.9); }
        }
        @keyframes bh-select-check {
          0%, 12%   { opacity: 0; transform: scale(0.6); }
          20%, 82%  { opacity: 1; transform: scale(1); }
          92%, 100% { opacity: 0; transform: scale(0.6); }
        }
        @keyframes bh-select-bar {
          0%, 14%   { opacity: 0; transform: translateY(6px); }
          22%, 82%  { opacity: 1; transform: translateY(0); }
          92%, 100% { opacity: 0; transform: translateY(6px); }
        }
      `}</style>

      <div className="grid grid-cols-4 gap-2.5">
        {Array.from({ length: 4 }).map((_, i) => {
          const active = SELECTED.includes(i);
          return (
            <div key={i} className="relative flex flex-col items-center gap-1">
              <span
                className="relative flex size-9 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                style={{ backgroundColor: "color-mix(in oklab, var(--primary) 55%, var(--muted-foreground))" }}
              >
                {String.fromCharCode(65 + i)}
                {active && (
                  <>
                    <span
                      className="pointer-events-none absolute -inset-1 rounded-full ring-2 ring-primary"
                      style={{ animation: `bh-select-ring 3.2s ease-in-out ${i * 0.2}s infinite` }}
                    />
                    <span
                      className="absolute -right-0.5 -top-0.5 flex size-3.5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                      style={{ animation: `bh-select-check 3.2s ease-in-out ${i * 0.2}s infinite` }}
                    >
                      <svg viewBox="0 0 12 12" className="size-2" fill="none">
                        <path d="M2.5 6.2 5 8.5l4.5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </>
                )}
              </span>
              <div className="h-1.5 w-8 rounded-full bg-muted" />
            </div>
          );
        })}
      </div>

      <div
        className="pointer-events-none flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 shadow-sm"
        style={{ animation: "bh-select-bar 3.2s ease-in-out infinite" }}
      >
        <span className="tabular-nums text-muted-foreground">2 ta tanlandi</span>
        <span className="rounded-md bg-primary px-2 py-1 font-medium text-primary-foreground">Ball berish</span>
      </div>
    </div>
  );
}
