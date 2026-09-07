"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAdminNav, pendingClass } from "../../_components/use-admin-nav";
import SessionsDialog from "./SessionsDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { SectionIcon } from "@/components/ui/section-icon";
import {
  Users,
  Search,
  MoreHorizontal,
  ShieldCheck,
  Ban,
  Undo2,
  VenetianMask,
  KeyRound,
  Trash2,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  Eye,
  X,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  TriangleAlert,
  MonitorSmartphone,
} from "lucide-react";
import { rolesOf } from "@/lib/auth-roles";
import type {
  AdminUsersPage,
  AdminUserListItem,
  ActivationStatus,
  UserSortKey,
} from "@/server/dal/admin/users";
import {
  ACTIVITY_AREAS,
  AREA_LABELS,
  ACTIVATED_MIN_DAYS,
  QUIET_AFTER_DAYS,
} from "@/lib/faollik";
import {
  setRoleAction,
  banUserAction,
  unbanUserAction,
  removeUserAction,
  resetPasswordAction,
  impersonateUserAction,
  setExcludeFromMetricsAction,
} from "@/server/actions/admin/users";

/* ── Yordamchilar ── */

const ROLE_LABELS: Record<string, string> = {
  teacher: "Oʻqituvchi",
  school_admin: "Maktab admini",
  super_admin: "Super admin",
};

/* ⛔ `toLocaleDateString("uz-UZ", …)` ISHLATMANG — GIDRATATSIYANI BUZADI.

   Node'ning ICU maʼlumoti bilan brauzerniki bir xil emas: server
   «2026-07-18», Chrome esa «18/07/2026» chizardi va React butun
   daraxtni qayta quruvchi hydration xatosi berardi (kuzatilgan
   2026-09-06, «Roʻyxatdan oʻtgan» ustunida).

   Yechim ikki qismli:
     1. Barqaror lokal (`en-GB`) + `formatToParts` — natija ICU
        versiyasiga bogʻliq emas, qismlarni oʻzimiz yigʻamiz.
     2. Vaqt mintaqasi QATʼIY belgilangan. Busiz Vercel (UTC) va
        foydalanuvchi (UTC+5) yarim tundan keyin BOSHQA kun
        koʻrsatardi — xuddi shu xato, faqat kuniga bir marta. */
const DATE_PARTS = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Tashkent",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function fmtDate(d: Date | string | null): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  const p: Record<string, string> = {};
  for (const part of DATE_PARTS.formatToParts(date)) p[part.type] = part.value;
  return `${p.day}.${p.month}.${p.year}`;
}

/* Blok yorligʻi — MUDDAT bilan. Ilgari faqat «Bloklangan» deb yozilardi,
   yaʼni «7 kunga» va «muddatsiz» bir xil koʻrinardi: admin blok qachon
   tugashini bilish uchun bazaga qarashi kerak edi. Muddat bazadan
   allaqachon olinardi (`banExpires`), shunchaki ekranga chiqmagan. */
function banLabel(expires: Date | string | null): string {
  if (!expires) return "Bloklangan · muddatsiz";
  const until = typeof expires === "string" ? new Date(expires) : expires;
  const days = Math.ceil((until.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  // Muddati oʻtgan, lekin bayroq hali tushmagan (better-auth uni keyingi
  // kirishda tozalaydi) — «bloklangan» deb koʻrsatish chalgʻitardi.
  if (days <= 0) return "Blok muddati tugagan";
  return `Bloklangan · ${days} kun qoldi`;
}

function initialsOf(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

type Filters = {
  q: string;
  role: string;
  plan: string;
  banned: string;
  status: string;
  area: string;
  sort: string;
  dir: "asc" | "desc";
};

function filterHref(f: Filters, page = 1): string {
  const params = new URLSearchParams();
  if (f.q) params.set("q", f.q);
  if (f.role) params.set("role", f.role);
  if (f.plan) params.set("plan", f.plan);
  if (f.banned) params.set("banned", f.banned);
  if (f.status) params.set("status", f.status);
  if (f.area) params.set("area", f.area);
  if (f.sort) params.set("sort", f.sort);
  // Standart `desc` — URL'ni keraksiz parametr bilan toʻldirmaymiz.
  if (f.sort && f.dir === "asc") params.set("dir", "asc");
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return `/admin/users${qs ? `?${qs}` : ""}`;
}

/* ⚠️ ODDIY OʻZBEKCHA, ATAMA EMAS.

   Ilgari bu yerda «Sinab koʻrgan» va «Jim qolgan» turardi — ikkalasi ham
   tarjima hidi keladigan, ekranda nima anglatishi tushunarsiz soʻzlar
   edi. Endi hammasi bir xil shakldagi oddiy feʼl: kim ishlayapti, kim
   kam ishlagan, kim toʻxtagan, kim umuman ishlamagan.

   Yangi holat qoʻshsangiz shu qatorni buzmang — badge'da bir-ikki
   soʻzdan oshmasin va oʻqigan odam izohsiz tushunsin. */
const STATUS_LABELS: Record<ActivationStatus, string> = {
  activated: "Ishlayapti",
  trying: "Kam ishlagan",
  quiet: "Toʻxtagan",
  never: "Ishlamagan",
};

/** Badge ustidagi tushuntirish — chegaralar qayerdan kelganini aytadi. */
const STATUS_HINTS: Record<ActivationStatus, string> = {
  activated: `Kamida ${ACTIVATED_MIN_DAYS} kun ishlagan va oxirgi ${QUIET_AFTER_DAYS} kun ichida ham ishlagan`,
  trying: `${ACTIVATED_MIN_DAYS} kundan kam ishlagan — odat shakllanmagan`,
  quiet: `Yaxshi ishlagan, lekin ${QUIET_AFTER_DAYS}+ kundan beri jim`,
  never: "Hech qanday ish yozuvi yoʻq",
};

/** «15 kun oldin» — sanadan koʻra tezroq oʻqiladi.

    Ilgari bu ustunda quruq sana turardi (`2026-08-22`) va uni bugungi
    kun bilan solishtirish oʻquvchining zimmasida edi. */
function agoLabel(d: Date | string | null): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  const days = Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));
  if (days <= 0) return "bugun";
  if (days === 1) return "kecha";
  if (days < 30) return `${days} kun oldin`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 oy oldin" : `${months} oy oldin`;
}

/* Faqat «Ishlayapti» yashil. «Kam ishlagan» va «Toʻxtagan» — neytral,
   chunki ikkalasi ham harakat talab qiladi; «Ishlamagan» eng ogʻiri. */
const STATUS_VARIANT: Record<
  ActivationStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  activated: "default",
  trying: "secondary",
  quiet: "outline",
  never: "destructive",
};

/** Sortlanadigan sarlavha — bosilganda yoʻnalishni almashtiradi.

    Birinchi bosishda `desc`: «eng koʻp faol kun» yoki «eng oxirgi ish»
    odatda qidirilayotgan narsa, «eng kam» emas. */
function SortHead({
  label,
  sortKey,
  filters,
  onSort,
  className,
}: {
  label: string;
  sortKey: UserSortKey;
  filters: Filters;
  onSort: (key: UserSortKey, dir: "asc" | "desc") => void;
  className?: string;
}) {
  const active = filters.sort === sortKey;
  const next = active && filters.dir === "desc" ? "asc" : "desc";
  const Icon = !active ? ArrowUpDown : filters.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey, next)}
        aria-label={`${label} boʻyicha saralash`}
        className={cn(
          "inline-flex items-center gap-1 whitespace-nowrap transition-colors hover:text-foreground",
          active ? "text-foreground font-medium" : "text-muted-foreground",
        )}
      >
        {label}
        <Icon className={cn("size-3", !active && "opacity-40")} />
      </button>
    </TableHead>
  );
}

/* ── Asosiy jadval ── */

export default function UsersTable({
  data,
  currentUserId,
  planOptions,
  filters,
}: {
  data: AdminUsersPage;
  currentUserId: string;
  planOptions: string[];
  filters: Filters;
}) {
  /* `router` FAQAT `refresh()` uchun qoldi (mutatsiyadan keyin qayta
     oʻqish). Filtr/sahifa navigatsiyasi `go()` orqali — u kutishni
     `pending` bilan koʻrsatadi (_components/use-admin-nav.ts). */
  const router = useRouter();
  const { pending, go } = useAdminNav();
  const [q, setQ] = React.useState(filters.q);

  /* Yozilgan matn URL bilan sinxron turadi. Busiz: «ali» deb yozib, Enter
     bosmasdan Rol filtrini oʻzgartirsangiz — sahifa «ali»siz qayta
     yuklanardi, maydonda esa «ali» qolib turardi. Yaʼni ekran natijaga
     zid boʻlardi. */
  React.useEffect(() => setQ(filters.q), [filters.q]);

  const plansWithActive = React.useMemo(
    () =>
      filters.plan && !planOptions.includes(filters.plan)
        ? [...planOptions, filters.plan]
        : planOptions,
    [planOptions, filters.plan],
  );
  const [busy, setBusy] = React.useState(false);
  const [roleDialog, setRoleDialog] = React.useState<AdminUserListItem | null>(null);
  const [banDialog, setBanDialog] = React.useState<AdminUserListItem | null>(null);
  const [deleteDialog, setDeleteDialog] = React.useState<AdminUserListItem | null>(null);
  const [sessionsDialog, setSessionsDialog] = React.useState<AdminUserListItem | null>(null);

  /* Filtr oʻzgarganda 1-sahifaga qaytiladi (`filterHref` standarti).
     Busiz: 4-sahifada turib filtr qoʻysangiz, natija 1 sahifaga sigʻib,
     ekran boʻsh chiqardi va «hech narsa topilmadi» deb tushunilardi. */
  const applyFilters = (next: Partial<Filters>) => {
    go(filterHref({ ...filters, ...next }));
  };

  const applySort = (sort: UserSortKey, dir: "asc" | "desc") => {
    go(filterHref({ ...filters, sort, dir }));
  };

  const activeFilterCount = [
    filters.q,
    filters.role,
    filters.plan,
    filters.banned,
    filters.status,
    filters.area,
  ].filter(Boolean).length;

  const run = async (fn: () => Promise<unknown>, okMsg: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(okMsg);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Xatolik yuz berdi");
    } finally {
      setBusy(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <Card className="shadow-none gap-0 overflow-hidden p-0">
      {/* Sarlavha + toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
        <SectionIcon>
          <Users />
        </SectionIcon>
        <div className="min-w-0">
          <h2 className="heading-small">Foydalanuvchilar</h2>
          <p className="text-caption text-muted-foreground">{data.total} ta hisob</p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              applyFilters({ q });
            }}
            className="relative"
          >
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ism yoki email…"
              className="h-9 w-52 pl-8 pr-8"
            />
            {q && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Qidiruvni tozalash"
                className="absolute right-0.5 top-1/2 size-8 -translate-y-1/2 text-muted-foreground"
                onClick={() => {
                  setQ("");
                  applyFilters({ q: "" });
                }}
              >
                <X className="size-3.5" />
              </Button>
            )}
          </form>
          <Select
            value={filters.role || "all"}
            onValueChange={(v) => applyFilters({ role: v === "all" ? "" : v })}
          >
            <SelectTrigger className="h-9 w-40" size="sm">
              <SelectValue placeholder="Rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha rollar</SelectItem>
              <SelectItem value="teacher">Oʻqituvchi</SelectItem>
              <SelectItem value="school_admin">Maktab admini</SelectItem>
              <SelectItem value="super_admin">Super admin</SelectItem>
            </SelectContent>
          </Select>
          {/* Tarif filtri: server (`?plan=`) va DAL uni allaqachon
              qoʻllab-quvvatlardi, faqat tanlash joyi qoʻyilmagan edi —
              yaʼni filtr bor, lekin unga yetib boʻlmasdi.

              ⚠️ `|| filters.plan` SHART. Bitta tarif boʻlsa tanlovni
              koʻrsatishning maʼnosi yoʻq, LEKIN havolada `?plan=` turgan
              boʻlsa (eski xatcho'p, yuborilgan havola, yoki oxirgi pullik
              hisob bepulga oʻtgan) filtr jimgina ishlab, roʻyxatni boʻsh
              qilardi va uni OʻCHIRADIGAN tugma boʻlmasdi — yuqoridagi
              xatoning aynan oʻzi, boshqa koʻrinishda. */}
          {(planOptions.length > 1 || filters.plan) && (
            <Select
              value={filters.plan || "all"}
              onValueChange={(v) => applyFilters({ plan: v === "all" ? "" : v })}
            >
              <SelectTrigger className="h-9 w-36" size="sm">
                <SelectValue placeholder="Tarif" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha tarif</SelectItem>
                {/* Faol tarif roʻyxatda boʻlmasligi mumkin (havoladagi
                    `?plan=` bazada endi yoʻq tarifni koʻrsatsa). Uni
                    qoʻshmasak tanlov boʻsh koʻrinardi va admin qaysi
                    filtr ishlayotganini bilmasdi. */}
                {plansWithActive.map((p) => (
                  <SelectItem key={p} value={p} className="capitalize">
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select
            value={filters.banned || "all"}
            onValueChange={(v) => applyFilters({ banned: v === "all" ? "" : v })}
          >
            <SelectTrigger className="h-9 w-36" size="sm">
              <SelectValue placeholder="Blok" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Blok: hammasi</SelectItem>
              <SelectItem value="0">Bloklanmagan</SelectItem>
              <SelectItem value="1">Bloklangan</SelectItem>
            </SelectContent>
          </Select>

          {/* Faollashuv holati — ustun ilgari ham koʻrinardi, lekin unga
              FILTR yoʻq edi: «kim sinab koʻrib tashlab ketdi?» degan
              savolga javob olish uchun 87 qatorni koʻz bilan koʻrish
              kerak boʻlardi. */}
          <Select
            value={filters.status || "all"}
            onValueChange={(v) => applyFilters({ status: v === "all" ? "" : v })}
          >
            <SelectTrigger className="h-9 w-40" size="sm">
              <SelectValue placeholder="Holat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha holat</SelectItem>
              {(
                ["activated", "trying", "quiet", "never"] as ActivationStatus[]
              ).map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Boʻlim filtri — qaysi funksiya haqiqatan ishlatilayotganini
              koʻrsatadi. «Test boʻlimini oxirgi oyda kim ochdi?» degan
              savolga boshqa yoʻl bilan javob yoʻq edi. */}
          <Select
            value={filters.area || "all"}
            onValueChange={(v) => applyFilters({ area: v === "all" ? "" : v })}
          >
            <SelectTrigger className="h-9 w-40" size="sm">
              <SelectValue placeholder="Boʻlim" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha boʻlim</SelectItem>
              {ACTIVITY_AREAS.map((a) => (
                <SelectItem key={a} value={a}>
                  {AREA_LABELS[a]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Nechta filtr yoqilganini koʻrsatuvchi tozalash tugmasi.
              Oltita tanlov boʻlgach, qaysi biri yoqiqligini koʻz bilan
              tekshirish qiyin — natija kutilmagan boʻlsa sabab shu. */}
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 text-muted-foreground"
              onClick={() =>
                go(
                  filterHref({
                    q: "",
                    role: "",
                    plan: "",
                    banned: "",
                    status: "",
                    area: "",
                    sort: filters.sort,
                    dir: filters.dir,
                  }),
                )
              }
            >
              <X />
              Tozalash ({activeFilterCount})
            </Button>
          )}
        </div>
      </div>

      {/* Koʻrinish qoʻllanmagan boʻlsa — jimgina nol koʻrsatmaymiz.
          Eski taʼrifga qaytish aynan tuzatilayotgan xatoni koʻrinmas
          holda tiklardi (drizzle/views/faollik.sql). */}
      {!data.activityAvailable && (
        <div className="flex items-start gap-2.5 border-b border-border bg-destructive/5 px-5 py-3">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
          <p className="text-sm text-muted-foreground">
            Faollik koʻrinishlari bazaga qoʻllanmagan — «Faollik» va «Oxirgi
            ish» ustunlari boʻsh. Qoʻllash:{" "}
            <code className="text-xs">drizzle/views/faollik.sql</code>
          </p>
        </div>
      )}

      {/* Jadval */}
      {data.items.length === 0 ? (
        <Empty className={pendingClass(pending)}>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users />
            </EmptyMedia>
            <EmptyTitle>Foydalanuvchi topilmadi</EmptyTitle>
            <EmptyDescription>Qidiruv yoki filtrlarni oʻzgartirib koʻring.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className={cn("overflow-x-auto", pendingClass(pending))}>
          <Table>
            <TableHeader>
              <TableRow>
                <SortHead
                  label="Foydalanuvchi"
                  sortKey="name"
                  filters={filters}
                  onSort={applySort}
                  className="pl-5"
                />
                <TableHead>Rollar</TableHead>
                <TableHead>Holat</TableHead>
                <TableHead>Tarif</TableHead>
                <TableHead className="text-right">Sinflar</TableHead>
                <TableHead className="text-right">Oʻquvchilar</TableHead>
                <SortHead
                  label="Ishlagan kunlar"
                  sortKey="active_days"
                  filters={filters}
                  onSort={applySort}
                />
                <SortHead
                  label="Roʻyxatdan oʻtgan"
                  sortKey="created"
                  filters={filters}
                  onSort={applySort}
                />
                <SortHead
                  label="Oxirgi ish"
                  sortKey="last_active"
                  filters={filters}
                  onSort={applySort}
                />
                <TableHead className="w-12 pr-5" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((u) => {
                const isSelf = u.id === currentUserId;
                const userRoles = rolesOf(u);
                return (
                  <TableRow key={u.id} className={u.banned ? "opacity-60" : undefined}>
                    <TableCell className="pl-5">
                      <div className="flex items-center gap-2.5">
                        <Avatar size="sm">
                          {u.image && <AvatarImage src={u.image} alt={u.name} />}
                          <AvatarFallback>{initialsOf(u.name) || "F"}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-sm font-medium">{u.name}</span>
                            {isSelf && (
                              <Badge variant="secondary" className="text-[10px]">Siz</Badge>
                            )}
                            {u.banned && (
                              <Badge
                                variant="destructive"
                                className="text-[10px]"
                                title={u.banReason ?? undefined}
                              >
                                {banLabel(u.banExpires)}
                              </Badge>
                            )}
                            {u.excludeFromMetrics && (
                              <Badge variant="outline" className="text-[10px] gap-1">
                                <EyeOff className="size-2.5" />
                                Test hisob
                              </Badge>
                            )}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">{u.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    {/* Rollar USTMA-UST. Yonma-yon turganda ikki rolli
                        hisob ustunni kengaytirib, qatorni siljitardi va
                        koʻz bilan «kimda qaysi rol» deb solishtirish
                        qiyin edi — ustun boʻyicha oʻqilsa tekis chiqadi. */}
                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        {userRoles.map((r) => (
                          <Badge
                            key={r}
                            variant={r === "super_admin" ? "default" : "secondary"}
                            className="text-[10px] whitespace-nowrap"
                          >
                            {ROLE_LABELS[r] ?? r}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={STATUS_VARIANT[u.activationStatus]}
                        className="text-[10px] whitespace-nowrap"
                        title={STATUS_HINTS[u.activationStatus]}
                      >
                        {STATUS_LABELS[u.activationStatus]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {u.plan ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{u.classCount}</TableCell>
                    <TableCell className="text-right tabular-nums">{u.studentCount}</TableCell>

                    {/* ⭐ ISHLAGAN KUNLAR — yozuvlar soni EMAS.
                        Bir kunda kiritilgan 400 ta davomat bitta ommaviy
                        amal; 12 ta ish kuni esa haqiqiy foydalanuvchi.

                        ⚠️ Bitta katakka uchta raqam SIQILMAYDI. Ilgari
                        shu yerda «2 kun (2 · 30k)» va ostida «2 / 12
                        boʻlim» turardi — «30k» 30 ming deb oʻqilardi va
                        katak umuman tushunilmasdi. Endi ekranda ikki
                        oddiy qator, qolgani sichqoncha ostida toʻliq
                        jumla bilan. */}
                    <TableCell>
                      <div
                        className="leading-tight"
                        title={
                          u.activeDaysTotal > 0
                            ? [
                                `Jami ${u.activeDaysTotal} kun ishlagan.`,
                                `Oxirgi 30 kunda ${u.activeDays30d} kun,`,
                                `${ACTIVITY_AREAS.length} boʻlimdan ${u.areas30d} tasida.`,
                                u.sessions30d > 0
                                  ? `${u.sessions30d} marta kirgan` +
                                    (u.medianMinutes30d
                                      ? `, odatda ${Math.round(u.medianMinutes30d)} daqiqadan.`
                                      : ".")
                                  : "",
                              ]
                                .filter(Boolean)
                                .join(" ")
                            : "Hech qanday ish yozuvi yoʻq"
                        }
                      >
                        {u.activeDaysTotal > 0 ? (
                          <>
                            <div className="text-sm tabular-nums">
                              {u.activeDaysTotal} kun
                            </div>
                            <div className="text-caption text-muted-foreground">
                              oxirgi oyda {u.activeDays30d}
                            </div>
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-sm text-muted-foreground">
                      {fmtDate(u.createdAt)}
                    </TableCell>

                    {/* Sana emas, «necha kun oldin» — admin baribir uni
                        bugungi kun bilan solishtirar edi. Aniq sana
                        sichqoncha ostida. Ostida esa NIMA qilgani:
                        «14 kun oldin» oʻzi odam nima qilayotganini
                        aytmasdi, roʻyxatni ochishga sabab esa aynan shu. */}
                    <TableCell className="text-sm leading-tight">
                      {/* `suppressHydrationWarning` — «necha kun oldin»
                          `Date.now()` ga tayanadi, serverda va brauzerda
                          esa u boshqa lahzada hisoblanadi. Odatda natija
                          bir xil, lekin kun chegarasida «13 kun» va
                          «14 kun» boʻlib ajralib qolishi mumkin. Bu
                          kutilgan farq, xato emas. */}
                      <div
                        suppressHydrationWarning
                        className={
                          u.lastActiveAt ? "text-foreground" : "text-muted-foreground"
                        }
                        title={u.lastActiveAt ? fmtDate(u.lastActiveAt) : undefined}
                      >
                        {agoLabel(u.lastActiveAt)}
                      </div>
                      {u.lastArea && (
                        <div className="text-caption text-muted-foreground">
                          {AREA_LABELS[u.lastArea] ?? u.lastArea}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8" disabled={busy}>
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem onSelect={() => setSessionsDialog(u)}>
                            <MonitorSmartphone />
                            Seanslar va qurilmalar
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setRoleDialog(u)}>
                            <ShieldCheck />
                            Rollarni oʻzgartirish
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={isSelf}
                            onSelect={() =>
                              run(async () => {
                                await impersonateUserAction({ userId: u.id });
                                window.location.href = "/dashboard";
                              }, "Impersonatsiya boshlandi")
                            }
                          >
                            <VenetianMask />
                            Sifatida kirish
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() =>
                              run(
                                () => resetPasswordAction({ email: u.email }),
                                "Parol tiklash xati yuborildi",
                              )
                            }
                          >
                            <KeyRound />
                            Parolni tiklash xati
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() =>
                              run(
                                () =>
                                  setExcludeFromMetricsAction({
                                    userId: u.id,
                                    excluded: !u.excludeFromMetrics,
                                  }),
                                u.excludeFromMetrics
                                  ? "Statistikaga qaytarildi"
                                  : "Statistikadan istisno qilindi",
                              )
                            }
                          >
                            {u.excludeFromMetrics ? <Eye /> : <EyeOff />}
                            {u.excludeFromMetrics
                              ? "Statistikaga qaytarish"
                              : "Statistikadan istisno qilish"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {u.banned ? (
                            <DropdownMenuItem
                              onSelect={() =>
                                run(() => unbanUserAction({ userId: u.id }), "Blokdan chiqarildi")
                              }
                            >
                              <Undo2 />
                              Blokdan chiqarish
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem disabled={isSelf} onSelect={() => setBanDialog(u)}>
                              <Ban />
                              Bloklash
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            variant="destructive"
                            disabled={isSelf}
                            onSelect={() => setDeleteDialog(u)}
                          >
                            <Trash2 />
                            Hisobni oʻchirish
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Paginatsiya */}
      {totalPages > 1 && (
        <div
          className={cn(
            "flex items-center justify-between border-t border-border px-5 py-3",
            pendingClass(pending),
          )}
        >
          <span className="text-caption text-muted-foreground">
            {data.page}-sahifa / {totalPages}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={data.page <= 1}
              onClick={() => go(filterHref(filters, data.page - 1))}
            >
              <ChevronLeft />
              Oldingi
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={data.page >= totalPages}
              onClick={() => go(filterHref(filters, data.page + 1))}
            >
              Keyingi
              <ChevronRight />
            </Button>
          </div>
        </div>
      )}

      {/* Seanslar — qaysi qurilmadan kirilgan */}
      <SessionsDialog user={sessionsDialog} onClose={() => setSessionsDialog(null)} />

      {/* Rol dialogi */}
      <RoleDialog
        user={roleDialog}
        isSelf={roleDialog?.id === currentUserId}
        busy={busy}
        onClose={() => setRoleDialog(null)}
        onSave={(roles) =>
          run(async () => {
            await setRoleAction({ userId: roleDialog!.id, roles });
            setRoleDialog(null);
          }, "Rollar yangilandi")
        }
      />

      {/* Ban dialogi */}
      <BanDialog
        user={banDialog}
        busy={busy}
        onClose={() => setBanDialog(null)}
        onBan={(reason, days) =>
          run(async () => {
            await banUserAction({
              userId: banDialog!.id,
              reason,
              expiresInDays: days,
            });
            setBanDialog(null);
          }, "Foydalanuvchi bloklandi")
        }
      />

      {/* Oʻchirish tasdigʻi */}
      <AlertDialog open={!!deleteDialog} onOpenChange={(o) => !o && setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hisobni butunlay oʻchirasizmi?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteDialog?.name}</strong> ({deleteDialog?.email}) hisobiga tegishli
              BARCHA maʼlumotlar — sinflar, oʻquvchilar, baholar, davomat — qaytarib
              boʻlmas tarzda oʻchiriladi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={() =>
                run(async () => {
                  await removeUserAction({
                    userId: deleteDialog!.id,
                    email: deleteDialog!.email,
                  });
                  setDeleteDialog(null);
                }, "Hisob oʻchirildi")
              }
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Oʻchirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

/* ── Rol dialogi ── */

const ALL_ROLES = ["teacher", "school_admin", "super_admin"] as const;
type RoleValue = (typeof ALL_ROLES)[number];

function RoleDialog({
  user,
  isSelf,
  busy,
  onClose,
  onSave,
}: {
  user: AdminUserListItem | null;
  isSelf: boolean;
  busy: boolean;
  onClose: () => void;
  onSave: (roles: RoleValue[]) => void;
}) {
  const [selected, setSelected] = React.useState<RoleValue[]>([]);
  React.useEffect(() => {
    if (user) setSelected(rolesOf(user).filter((r): r is RoleValue => ALL_ROLES.includes(r as RoleValue)));
  }, [user]);

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Rollarni oʻzgartirish</DialogTitle>
          <DialogDescription>{user?.email}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-1">
          {ALL_ROLES.map((r) => {
            // Oʻz hisobidan super_admin'ni olib tashlashga yoʻl qoʻymaymiz —
            // aks holda admin paneldan oʻzini qulflab qoʻyadi.
            const lockSelf = isSelf && r === "super_admin";
            return (
              <Label key={r} className="flex items-center gap-2.5 text-sm font-normal">
                <Checkbox
                  checked={selected.includes(r)}
                  disabled={lockSelf}
                  onCheckedChange={(c) =>
                    setSelected((prev) =>
                      c ? [...prev, r] : prev.filter((x) => x !== r),
                    )
                  }
                />
                {ROLE_LABELS[r]}
              </Label>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Bekor qilish
          </Button>
          <Button
            disabled={busy || selected.length === 0}
            onClick={() => onSave(selected)}
          >
            Saqlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Ban dialogi ── */

function BanDialog({
  user,
  busy,
  onClose,
  onBan,
}: {
  user: AdminUserListItem | null;
  busy: boolean;
  onClose: () => void;
  onBan: (reason: string, expiresInDays?: number) => void;
}) {
  const [reason, setReason] = React.useState("");
  const [duration, setDuration] = React.useState("forever");
  React.useEffect(() => {
    if (user) {
      setReason("");
      setDuration("forever");
    }
  }, [user]);

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Foydalanuvchini bloklash</DialogTitle>
          <DialogDescription>
            {user?.email} — bloklanganda barcha sessiyalari darhol bekor qilinadi.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-1">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ban-reason">Sabab</Label>
            <Textarea
              id="ban-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Bloklash sababi…"
              rows={3}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Muddat</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 kun</SelectItem>
                <SelectItem value="7">7 kun</SelectItem>
                <SelectItem value="30">30 kun</SelectItem>
                <SelectItem value="forever">Muddatsiz</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Bekor qilish
          </Button>
          <Button
            variant="destructive"
            disabled={busy || !reason.trim()}
            onClick={() =>
              onBan(
                reason.trim(),
                duration === "forever" ? undefined : Number(duration),
              )
            }
          >
            Bloklash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
