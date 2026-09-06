import {
  listPlanOptions,
  listUsersForAdmin,
  USER_SORT_KEYS,
  type ActivationStatus,
  type UserSortKey,
} from "@/server/dal/admin/users";
import { ACTIVITY_AREAS } from "@/lib/faollik";
import { requireAdmin } from "@/server/session";
import UsersTable from "./_components/UsersTable";

/* Foydalanuvchilar — kross-tenant admin jadvali. Filtr/sahifa holati
   URL searchParams'da (server-side soʻrov). */

/* Sahifaning butun DB ishi ~200 ms (oʻlchangan: `v_teacher_totals`
   118 ms + davomat/baho agregatlari ~60 ms). Standart chegara — Fluid
   compute'ning 300 soniyasi, yaʼni ulanish osilib qolsa foydalanuvchi
   BESH DAQIQA oq ekranga qarab turardi va oxirida 504 olardi.

   30 s — normal ishga oʻn baravar zaxira bilan yetadi, nosozlikda esa
   tezda xato qaytaradi (`error.tsx` koʻrinadi, qayta urinish mumkin). */
export const maxDuration = 30;

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

  /* ⚠️ URL'dan kelgan qiymatlar OQ ROʻYXAT orqali oʻtkaziladi.
     `sort` toʻgʻridan-toʻgʻri ORDER BY ga tushadi — tekshirilmagan
     matn u yerga hech qachon yetib bormasligi kerak. Notoʻgʻri qiymat
     xato emas, standart tartibga qaytish bilan tugaydi (eski xatcho'p
     yoki yuborilgan havola sahifani yiqitmasin). */
  const statusParam = first(sp.status);
  const status = (["never", "trying", "activated", "quiet"] as const).includes(
    statusParam as ActivationStatus,
  )
    ? (statusParam as ActivationStatus)
    : undefined;

  const areaParam = first(sp.area);
  const area = ACTIVITY_AREAS.includes(areaParam as (typeof ACTIVITY_AREAS)[number])
    ? areaParam
    : undefined;

  const sortParam = first(sp.sort);
  const sort = USER_SORT_KEYS.includes(sortParam as UserSortKey)
    ? (sortParam as UserSortKey)
    : undefined;
  const dir = first(sp.dir) === "asc" ? "asc" : "desc";

  const [data, planOptions] = await Promise.all([
    listUsersForAdmin({
      search,
      role,
      plan,
      banned,
      status,
      area,
      sort,
      dir,
      page,
      pageSize: 25,
    }),
    listPlanOptions(),
  ]);

  return (
    <div className="p-5">
      <UsersTable
        data={data}
        currentUserId={actor.id}
        planOptions={planOptions}
        filters={{
          q: search ?? "",
          role: role ?? "",
          plan: plan ?? "",
          banned: bannedParam ?? "",
          status: status ?? "",
          area: area ?? "",
          sort: sort ?? "",
          dir,
        }}
      />
    </div>
  );
}
