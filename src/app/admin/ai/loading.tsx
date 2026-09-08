import { Skeleton } from "@/components/ui/skeleton";

/* Ustozona AI paneli kutish ekrani — sabab: `src/app/admin/loading.tsx`. */

export default function Loading() {
  return (
    <div className="space-y-4 p-5">
      <Skeleton className="h-12 w-64" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-40" />
      <Skeleton className="h-64" />
    </div>
  );
}
