import { AdminTableSkeleton } from "../_components/AdminSkeletons";

/* Maktablar jadvali kutish ekrani — sabab: `src/app/admin/loading.tsx`.
   Toolbarda faqat «Maktab qoʻshish» tugmasi bor, shu bois filters=1. */

export default function Loading() {
  return <AdminTableSkeleton rows={8} filters={1} />;
}
