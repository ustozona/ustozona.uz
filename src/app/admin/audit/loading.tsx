import { AdminTableSkeleton } from "../_components/AdminSkeletons";

/* Audit jurnali kutish ekrani — sabab: `src/app/admin/loading.tsx`.
   Bir sahifada 50 yozuv, lekin skelet ekran boʻyi bilan cheklanadi. */

export default function Loading() {
  return <AdminTableSkeleton rows={12} filters={1} />;
}
