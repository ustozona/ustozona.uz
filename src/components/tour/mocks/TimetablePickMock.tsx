"use client";

/* Jadval turʼi — "Jadval" (dars soatlari) koʻrinishida boʻsh katakni
   bosib sinf tanlash (ClassPicker popover) qanday ishlashini koʻrsatuvchi
   mini illyustratsiya (CSS animatsiya, tokenlangan).

   Tanlangandan keyin katak ichida sinf chip'i uzoq vaqt "joyida qoladi" —
   popover esa oʻz vazifasini bajarib yopiladi. */

const TARGET_INDEX = 13; // 4 ustunli setkada 4-qator, 2-ustun

export function TimetablePickMock() {
  return (
    <div className="relative flex w-full max-w-md justify-center text-sm">
      <style>{`
        @keyframes tt-pick-tap {
          0%, 10%   { box-shadow: 0 0 0 0 var(--primary); }
          18%       { box-shadow: 0 0 0 5px color-mix(in oklab, var(--primary) 35%, transparent); }
          28%, 100% { box-shadow: 0 0 0 0 transparent; }
        }
        @keyframes tt-pick-pop {
          0%, 20%   { opacity: 0; transform: translateY(4px) scale(0.98); }
          28%, 58%  { opacity: 1; transform: translateY(0) scale(1); }
          66%, 100% { opacity: 0; transform: translateY(4px) scale(0.98); }
        }
        @keyframes tt-pick-settle {
          0%, 60%  { opacity: 0; }
          68%, 94% { opacity: 1; }
          100%     { opacity: 0; }
        }
      `}</style>

      {/* Mini period grid */}
      <div className="grid w-full grid-cols-4 grid-rows-6 gap-1.5">
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} className="relative h-8 rounded-md border border-border/70 bg-muted/40">
            {i === TARGET_INDEX && (
              <>
                <div
                  className="pointer-events-none absolute inset-0 rounded-md border-2 border-primary/70"
                  style={{ animation: "tt-pick-tap 2.6s ease-in-out infinite" }}
                />
                <span
                  className="absolute inset-0.5 flex items-center justify-center rounded-[4px] border border-primary/40 bg-primary/15 px-1 text-[9px] font-medium leading-tight text-foreground"
                  style={{ animation: "tt-pick-settle 2.6s ease-in-out infinite" }}
                >
                  Matematika
                </span>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Ochiladigan "Sinf tanlang" popover */}
      <div
        className="pointer-events-none absolute left-1/2 top-[7.8rem] w-40 -translate-x-1/2 rounded-lg border border-border bg-background p-2 shadow-lg"
        style={{ animation: "tt-pick-pop 2.6s ease-in-out infinite" }}
      >
        <p className="px-2 pb-1 pt-0.5 text-[10px] font-semibold text-muted-foreground">Sinf tanlang</p>
        <div className="rounded-md bg-primary/10 px-2 py-1.5 text-xs font-medium text-foreground">Matematika 7-A</div>
        <div className="px-2 py-1.5 text-xs text-muted-foreground">Ona tili 8-B</div>
      </div>
    </div>
  );
}
