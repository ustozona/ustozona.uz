import { Skeleton } from "@/components/ui/skeleton";

/* Sozlamalar kutish ekrani — sabab: `src/app/admin/loading.tsx`. */

export default function Loading() {
  return (
    <div className="p-4 md:p-6">
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}
