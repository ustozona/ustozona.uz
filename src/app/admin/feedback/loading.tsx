import { AdminFeedSkeleton } from "../_components/AdminSkeletons";

/* Fikrlar markazi kutish ekrani — sabab: `src/app/admin/loading.tsx`.
   Bu boʻlim jadval emas, karta lentasi — shakli ham shunga mos. */

export default function Loading() {
  return <AdminFeedSkeleton rows={5} />;
}
