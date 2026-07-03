import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { dashboardPageClass, dashboardGridClass, dashboardStackClass } from "@/components/DashboardPage";

export default function Loading() {
  return (
    <div className={cn(dashboardPageClass, dashboardStackClass)}>
      <div className={cn(dashboardGridClass, "grid-cols-1 xl:grid-cols-[1fr_360px] flex-1 min-h-0")}>
        <div className={cn(dashboardStackClass, "grid-rows-[minmax(220px,0.9fr)_minmax(260px,1.1fr)] grid min-h-0")}>
          <Skeleton className="rounded-xl" />
          <Skeleton className="rounded-xl" />
        </div>
        <div className={cn(dashboardStackClass, "grid-rows-[minmax(280px,1fr)_minmax(220px,0.8fr)] grid min-h-0")}>
          <Skeleton className="rounded-xl" />
          <Skeleton className="rounded-xl" />
        </div>
      </div>
    </div>
  );
}
