import { listUsersForAdmin } from "@/server/dal/admin/users";
import { requireAdmin } from "@/server/session";
import UsersTable from "./_components/UsersTable";

/* Foydalanuvchilar — kross-tenant admin jadvali. Filtr/sahifa holati
   URL searchParams'da (server-side soʻrov). */

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const { actor } = await requireAdmin();

  const first = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  const page = Math.max(1, Number(first(sp.page)) || 1);
  const search = first(sp.q)?.trim() || undefined;
  const role = first(sp.role) || undefined;
  const plan = first(sp.plan) || undefined;
  const bannedParam = first(sp.banned);
  const banned =
    bannedParam === "1" ? true : bannedParam === "0" ? false : undefined;

  const data = await listUsersForAdmin({
    search,
    role,
    plan,
    banned,
    page,
    pageSize: 25,
  });

  return (
    <div className="p-5">
      <UsersTable
        data={data}
        currentUserId={actor.id}
        filters={{ q: search ?? "", role: role ?? "", plan: plan ?? "", banned: bannedParam ?? "" }}
      />
    </div>
  );
}
