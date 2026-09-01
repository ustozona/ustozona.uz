import { AdminTableSkeleton } from "../_components/AdminSkeletons";

/* Foydalanuvchilar jadvali kutish ekrani — sabab va qoida:
   `src/app/admin/loading.tsx` dagi izoh. Filtr soni haqiqiy
   toolbar bilan bir xil (qidiruv + rol + tarif + holat). */

export default function Loading() {
  return <AdminTableSkeleton rows={10} filters={4} />;
}
