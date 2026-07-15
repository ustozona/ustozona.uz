import { listAuditLogs } from "@/server/dal/admin/audit";
import AuditList from "./_components/AuditList";

/* Audit jurnali — barcha admin harakatlari xronologiyasi. */

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const first = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  const page = Math.max(1, Number(first(sp.page)) || 1);
  const action = first(sp.action) || undefined;

  const data = await listAuditLogs({ action, page, pageSize: 50 });

  return (
    <div className="p-5">
      <AuditList data={data} activeAction={action ?? ""} />
    </div>
  );
}
