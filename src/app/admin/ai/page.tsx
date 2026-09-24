import { Suspense } from "react";
import { Bot, CalendarDays, Server } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Panel, PanelBody } from "@/components/ui/panel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { StatCard } from "@/components/StatCard";
import { cn } from "@/lib/utils";
import {
  getAiUsageOverview,
  listAiUsers,
  AI_STATS_DAYS,
  type AiUsageOverview,
  type AiUserRow,
} from "@/server/dal/admin/ai-usage";
import { AdminPanelHeader } from "../_components/AdminPanelHeader";
import { ShareRow } from "../_components/ShareRow";

/* Ustozona AI — foydalanish paneli.

   Nega kerak: AI zanjiri jimgina yiqilishi mumkin (provayder modelni
   olib tashlaydi, kvota tugaydi) va buni foydalanuvchi shikoyat qilguncha
   hech kim koʻrmaydi. Panel shuni uchta raqamda koʻrsatadi:
   javobsiz soʻrovlar, provayder taqsimoti va limitga tegishlar.

   ⚠️ SAHIFA OʻZI HECH NARSA KUTMAYDI — /admin bilan bir xil naqsh:
   ikki mustaqil `<Suspense>`, yengil kesim ogʻir roʻyxatni kutmaydi. */
export const maxDuration = 30;

const PROVIDER_LABEL: Record<string, string> = {
  gemini: "Gemini",
  groq: "Groq",
  openrouter: "OpenRouter",
};

/* ── Yengil oqim: umumiy kesim ── */

async function Overview() {
  const s: AiUsageOverview = await getAiUsageOverview();
  const providerTotal = s.providers.reduce((n, x) => n + x.count, 0);
  const maxDay = Math.max(1, ...s.trend.map((x) => x.messages));

  return (
    <>
      {/* Ogohlantiruvchi ikki karta — nol boʻlmasa qizil: ikkalasi ham
          «kimdir AI dan javob ololmayapti» degani.
          Izohlar ataylab qisqa: StatCard ularni 2 qatorgacha koʻrsatadi,
          mobil 2 ustunli toʻrda esa karta tor. */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Bugun yuborilgan xabar"
          value={s.today.messages}
          sub={`${s.today.users} oʻqituvchi, ${s.today.docs} hujjat`}
        />
        <StatCard
          label={`${s.days} kunda jami`}
          value={s.window.messages}
          sub={`${s.window.users} noyob oʻqituvchi`}
        />
        <StatCard
          label="Javobsiz qolgan"
          value={s.unanswered}
          tone={s.unanswered > 0 ? "destructive" : "default"}
          sub="soʻrov ketgan, provayder javob bermagan"
        />
        <StatCard
          label="Krediti tugagan"
          value={s.creditExhausted}
          tone={s.creditExhausted > 0 ? "destructive" : "default"}
          sub={`joriy oyda · free krediti ${s.monthCredit} xabar`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_2fr]">
        {/* Provayder taqsimoti — qaysi zaxira qanchalik ishlayotgani.
            Gemini ulushi keskin tushsa, kvota tugagani shu yerda koʻrinadi. */}
        <Panel>
          <AdminPanelHeader
            icon={<Server />}
            title="Provayderlar"
            description={`Oxirgi ${s.days} kun javoblari`}
          />
          <PanelBody inset className="flex flex-col gap-3">
            {s.providers.length ? (
              s.providers.map((p) => (
                <ShareRow
                  key={p.provider}
                  label={PROVIDER_LABEL[p.provider] ?? p.provider}
                  value={p.count}
                  share={providerTotal ? Math.round((p.count / providerTotal) * 100) : 0}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Hali hech bir provayder javob bermagan.
              </p>
            )}
          </PanelBody>
        </Panel>

        {/* Kunlik grafik — CSS ustunlar, kutubxonasiz: bu yerda faqat
            "qaysi kun tushib qolgan" koʻrinsa yetarli. */}
        <Panel>
          <AdminPanelHeader
            icon={<CalendarDays />}
            title="Kunlik xabarlar"
            description={`Oxirgi ${s.days} kun`}
          />
          <PanelBody inset className="flex flex-col gap-3">
            <div className="flex h-28 items-end gap-0.5">
              {s.trend.map((d) => (
                <div
                  key={d.day}
                  title={`${d.day}: ${d.messages} xabar, ${d.users} oʻqituvchi`}
                  className="min-h-[2px] flex-1 rounded-t-sm bg-primary/70 hover:bg-primary"
                  style={{ height: `${Math.round((d.messages / maxDay) * 100)}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between text-caption text-muted-foreground tabular-nums">
              <span>{s.trend[0]?.day}</span>
              <span>{s.trend[s.trend.length - 1]?.day}</span>
            </div>
          </PanelBody>
        </Panel>
      </div>
    </>
  );
}

function OverviewSkeleton() {
  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_2fr]">
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
    </>
  );
}

/* ── Ogʻir oqim: kim qancha ishlatgan ── */

async function AiUsersSection() {
  const rows: AiUserRow[] = await listAiUsers();

  return (
    <Panel>
      <AdminPanelHeader
        icon={<Bot />}
        title="Oʻqituvchilar boʻyicha"
        count={rows.length ? `${rows.length} ta` : undefined}
        description={`Oxirgi ${AI_STATS_DAYS} kunda AI ishlatganlar · kredit joriy oy boʻyicha`}
      />
      {!rows.length ? (
        <PanelBody inset>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Bot />
              </EmptyMedia>
              <EmptyTitle>Hali hech kim AI ishlatmagan</EmptyTitle>
            </EmptyHeader>
          </Empty>
        </PanelBody>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Oʻqituvchi</TableHead>
                <TableHead>Tarif</TableHead>
                <TableHead className="text-right">Xabar</TableHead>
                <TableHead className="text-right">Hujjat</TableHead>
                <TableHead className="text-right">Faol kun</TableHead>
                <TableHead className="text-right">Oy / kredit</TableHead>
                <TableHead className="text-right">Bugun</TableHead>
                <TableHead className="pr-5">Oxirgi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.userId} className="tabular-nums">
                  <TableCell className="pl-5">
                    <div className="text-sm font-medium">{r.name}</div>
                    <div className="text-caption text-muted-foreground">{r.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge size="sm" variant={r.plan === "pro" ? "default" : "secondary"}>
                      {r.plan ?? "free"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{r.messages}</TableCell>
                  <TableCell className="text-right">{r.docs}</TableCell>
                  <TableCell className="text-right">{r.activeDays}</TableCell>
                  {/* Joriy oy sarfi va taʼrif krediti — kredit tugagan
                      oʻqituvchi darrov koʻzga tashlansin. */}
                  <TableCell
                    className={cn(
                      "text-right",
                      r.monthMessages > r.credit && "font-medium text-destructive",
                    )}
                  >
                    {r.monthMessages} / {r.credit}
                  </TableCell>
                  <TableCell className="text-right">{r.todayMessages}</TableCell>
                  <TableCell className="pr-5 text-caption text-muted-foreground">
                    {r.lastDay}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Panel>
  );
}

export default function AdminAiPage() {
  return (
    <div className="flex flex-col gap-5 p-5">
      <Suspense fallback={<OverviewSkeleton />}>
        <Overview />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-64 rounded-xl" />}>
        <AiUsersSection />
      </Suspense>
    </div>
  );
}
