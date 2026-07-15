import { listAllFeedback } from "@/server/dal/admin/feedback";
import AdminFeedbackList from "./_components/AdminFeedbackList";

/* Admin fikrlar markazi — barcha oʻqituvchilar feedback'i bir joyda. */

export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const first = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  const page = Math.max(1, Number(first(sp.page)) || 1);
  const status = first(sp.status) || undefined;
  const category = first(sp.category) || undefined;

  const data = await listAllFeedback({ status, category, page, pageSize: 20 });

  return (
    <div className="p-4 md:p-6">
      <AdminFeedbackList data={data} activeStatus={status ?? ""} activeCategory={category ?? ""} />
    </div>
  );
}
