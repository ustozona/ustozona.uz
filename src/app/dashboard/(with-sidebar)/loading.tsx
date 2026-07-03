import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { withSidebarRowPageClass, dashboardDenseGridGapClass } from "@/components/DashboardPage";

export default function Loading() {
  return (
    <div className={withSidebarRowPageClass}>
      <Skeleton className="hidden lg:block w-[25%] min-w-[260px] rounded-xl" />
      <div className="flex-1 min-w-0 rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Skeleton className="size-11 rounded-xl" />
            <Skeleton className="h-6 w-40" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
        <div className={cn("mt-6 grid", dashboardDenseGridGapClass)}>
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-14 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
