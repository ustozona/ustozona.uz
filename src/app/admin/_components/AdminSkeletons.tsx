import { Skeleton } from "@/components/ui/skeleton";

/* ════════════════════════════════════════════════════════════════════
   ADMIN SKELETLARI — `loading.tsx` fayllari uchun umumiy shakllar.

   NEGA UMUMIY FAYL: har boʻlim oʻz `loading.tsx` iga ega boʻlishi
   kerak (Next har segment uchun alohida oʻqiydi), lekin ular bir xil
   koʻrinishi kerak — aks holda boʻlimdan boʻlimga oʻtganda kutish
   ekranining oʻzi sakrab turadi.

   ⚠️ SKELET SHAKLI HAQIQIY EKRANGA MOS BOʻLSIN. Umumiy kulrang
   toʻrtburchak «yuklanmoqda» deydi, lekin NIMA yuklanayotganini
   aytmaydi va kelgan kontent joyini surib yuboradi. Shuning uchun
   toolbar balandligi, ustunlar soni va qator balandligi haqiqiy
   jadval bilan bir xil olingan.
   ════════════════════════════════════════════════════════════════════ */

/** Karta ichidagi toolbar (ikona + sarlavha + oʻngdagi filtrlar). */
function ToolbarSkeleton({ filters = 3 }: { filters?: number }) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
      <Skeleton className="size-9 shrink-0 rounded-lg" />
      <div className="flex min-w-0 flex-col gap-1.5">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        {Array.from({ length: filters }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-36 rounded-md" />
        ))}
      </div>
    </div>
  );
}

/** Toolbar + qatorli roʻyxat — jadval koʻrinishidagi boʻlimlar uchun. */
export function AdminTableSkeleton({
  rows = 8,
  filters = 3,
}: {
  rows?: number;
  filters?: number;
}) {
  return (
    <div className="p-5">
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <ToolbarSkeleton filters={filters} />
        <div className="divide-y divide-border">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3">
              <Skeleton className="size-9 shrink-0 rounded-full" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Skeleton className="h-3.5 w-1/3" />
                <Skeleton className="h-3 w-1/5" />
              </div>
              <Skeleton className="hidden h-5 w-20 rounded-full sm:block" />
              <Skeleton className="hidden h-3.5 w-24 md:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Toolbar + kartalar lentasi — Fikrlar markazi shakli. */
export function AdminFeedSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto w-full max-w-3xl">
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <ToolbarSkeleton filters={2} />
          <div className="flex flex-col gap-3 p-4 md:p-5">
            {Array.from({ length: rows }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
