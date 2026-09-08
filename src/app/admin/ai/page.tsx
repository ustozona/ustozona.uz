import { Suspense } from "react";
import { Bot } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  getAiUsageOverview,
  listAiUsers,
  AI_STATS_DAYS,
  type AiUsageOverview,
  type AiUserRow,
} from "@/server/dal/admin/ai-usage";

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

function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "warn";
}) {
  return (
    <Card className="gap-1 p-4">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div
        className={`text-2xl font-semibold tabular-nums ${
          tone === "warn" && Number(value) > 0 ? "text-destructive" : ""
        }`}
      >
        {value}
      </div>
      {hint ? (
        <div className="text-muted-foreground text-xs">{hint}</div>
      ) : null}
    </Card>
  );
}

/* ── Yengil oqim: umumiy kesim ── */

async function Overview() {
  const s: AiUsageOverview = await getAiUsageOverview();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Bugun yuborilgan xabar"
          value={s.today.messages}
          hint={`${s.today.users} oʻqituvchi, ${s.today.docs} hujjat`}
        />
        <StatCard
          label={`${s.days} kunda jami`}
          value={s.window.messages}
          hint={`${s.window.users} noyob oʻqituvchi`}
        />
        <StatCard
          label="Javobsiz qolgan"
          value={s.unanswered}
          hint="soʻrov ketgan, provayder javob bermagan"
          tone="warn"
        />
        <StatCard
          label="Limitga tegish"
          value={s.limitHits}
          hint={`kunlik limit ${s.dailyLimit} xabar`}
          tone="warn"
        />
      </div>

      {/* Provayder taqsimoti — qaysi zaxira qanchalik ishlayotgani.
          Gemini ulushi keskin tushsa, kvota tugagani shu yerda koʻrinadi. */}
      <Card className="gap-3 p-4">
        <div className="text-sm font-medium">
          Provayderlar ({s.days} kun)
        </div>
        {s.providers.length ? (
          <div className="space-y-2">
            {s.providers.map((p) => {
              const total = s.providers.reduce((n, x) => n + x.count, 0);
              const pct = total ? Math.round((p.count / total) * 100) : 0;
              return (
                <div key={p.provider} className="flex items-center gap-3">
                  <div className="w-28 shrink-0 text-sm">
                    {PROVIDER_LABEL[p.provider] ?? p.provider}
                  </div>
                  <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-muted-foreground w-24 shrink-0 text-right text-xs tabular-nums">
                    {p.count} ({pct}%)
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-muted-foreground text-sm">
            Hali hech bir provayder javob bermagan.
          </div>
        )}
      </Card>

      {/* Kunlik grafik — CSS ustunlar, kutubxonasiz: bu yerda faqat
          "qaysi kun tushib qolgan" koʻrinsa yetarli. */}
      <Card className="gap-3 p-4">
        <div className="text-sm font-medium">Kunlik xabarlar</div>
        <div className="flex h-28 items-end gap-[3px]">
          {s.trend.map((d) => {
            const max = Math.max(1, ...s.trend.map((x) => x.messages));
            const h = Math.round((d.messages / max) * 100);
            return (
              <div
                key={d.day}
                title={`${d.day}: ${d.messages} xabar, ${d.users} oʻqituvchi`}
                className="bg-primary/70 hover:bg-primary min-h-[2px] flex-1 rounded-t-sm"
                style={{ height: `${h}%` }}
              />
            );
          })}
        </div>
        <div className="text-muted-foreground flex justify-between text-xs">
          <span>{s.trend[0]?.day}</span>
          <span>{s.trend[s.trend.length - 1]?.day}</span>
        </div>
      </Card>
    </div>
  );
}

/* ── Ogʻir oqim: kim qancha ishlatgan ── */

async function UsersTable() {
  const rows: AiUserRow[] = await listAiUsers();

  if (!rows.length) {
    return (
      <Card className="p-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Bot />
            </EmptyMedia>
            <EmptyTitle>Hali hech kim AI ishlatmagan</EmptyTitle>
          </EmptyHeader>
        </Empty>
      </Card>
    );
  }

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:text-left [&>th]:font-medium">
              <th>Oʻqituvchi</th>
              <th>Tarif</th>
              <th className="text-right">Xabar</th>
              <th className="text-right">Hujjat</th>
              <th className="text-right">Faol kun</th>
              <th className="text-right">Limitga tegish</th>
              <th className="text-right">Bugun</th>
              <th>Oxirgi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.userId}
                className="border-t [&>td]:px-3 [&>td]:py-2 [&>td]:tabular-nums"
              >
                <td>
                  <div className="font-medium">{r.name}</div>
                  <div className="text-muted-foreground text-xs">{r.email}</div>
                </td>
                <td>
                  <Badge variant={r.plan === "premium" ? "default" : "secondary"}>
                    {r.plan ?? "free"}
                  </Badge>
                </td>
                <td className="text-right">{r.messages}</td>
                <td className="text-right">{r.docs}</td>
                <td className="text-right">{r.activeDays}</td>
                <td
                  className={`text-right ${r.limitHits > 0 ? "text-destructive font-medium" : ""}`}
                >
                  {r.limitHits}
                </td>
                <td className="text-right">{r.todayMessages}</td>
                <td className="text-muted-foreground text-xs">{r.lastDay}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default function AdminAiPage() {
  return (
    <div className="space-y-4 p-5">
      <div>
        <h1 className="text-lg font-semibold">Ustozona AI</h1>
        <p className="text-muted-foreground text-sm">
          Soʻnggi {AI_STATS_DAYS} kunlik foydalanish, provayder zanjiri va
          kunlik limit holati.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        }
      >
        <Overview />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-64" />}>
        <UsersTable />
      </Suspense>
    </div>
  );
}
