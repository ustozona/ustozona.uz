import { Skeleton } from "@/components/ui/skeleton";

/* Ustozona AI paneli kutish ekrani — sabab: `src/app/admin/loading.tsx`.
   Joylashuv page.tsx bilan bir xil: 4 karta, provayder + kunlik grafik,
   oʻqituvchilar jadvali. */

export default function Loading() {
  return (
    <div className="flex flex-col gap-5 p-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_2fr]">
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
