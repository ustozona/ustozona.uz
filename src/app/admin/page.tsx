import { Suspense } from "react";
import { Send } from "lucide-react";
import { Panel, PanelBody } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getActivationOverview,
  getDeviceBreakdown,
  getSignupTrends,
} from "@/server/dal/admin/stats";
import { unstable_rethrow } from "next/navigation";
import { getTelegramStats, type TelegramStats } from "@/server/dal/admin/telegram";
import { deviceLabel, type DeviceKind } from "@/lib/user-agent";
import SignupsChart from "./_components/SignupsChart";
import { AdminPanelHeader } from "./_components/AdminPanelHeader";
import { AtRiskPanel } from "./_components/AtRiskPanel";
import { DistributionPanel } from "./_components/DistributionPanel";
import { FunnelPanel } from "./_components/FunnelPanel";
import { ShareRow } from "./_components/ShareRow";

/* Boshqaruv — faollashuv voronkasi.

   Foydalanuvchi/sinf umumiy soni oʻzi hech narsani anglatmaydi — kimdir
   roʻyxatdan oʻtib ketishi ham mumkin. Shuning uchun bosh sahifa endi
   VORONKA + kim ketmoqchi ekanini koʻrsatadi, terminal skript
   (scripts/metrics.ts) bilan bir xil mantiq boʻyicha.

   ⚠️ SAHIFA OʻZI HECH NARSA KUTMAYDI — IKKI OQIM.

   `page` funksiyasining oʻzi `async` boʻlsa, butun ekran eng sekin
   soʻrov tugagunicha serverda ushlanib turadi va foydalanuvchi
   shu vaqt davomida hech narsa koʻrmaydi. Endi ikki mustaqil
   `<Suspense>`: yengil qism (roʻyxatdan oʻtish grafigi, taqsimotlar)
   darhol chiqadi, ogʻir qism (har oʻqituvchi boʻyicha agregat) tayyor
   boʻlgach oʻz skeletini almashtiradi.

   `maxDuration` — ulanish osilib qolsa Fluid computeʼning standart
   300 soniyasi oʻrniga 30 s da xato qaytadi va `error.tsx` koʻrinadi
   (`/admin/users` bilan bir xil sabab). */
export const maxDuration = 30;

/* ── Yengil oqim: roʻyxatdan oʻtish grafigi + taqsimotlar ── */

async function TrendsSection() {
  const [{ signupsByDay, planBreakdown }, devices] = await Promise.all([
    getSignupTrends(),
    getDeviceBreakdown(),
  ]);

  return (
    <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
      <SignupsChart data={signupsByDay} />
      <DistributionPanel
        plans={planBreakdown.map((p) => ({
          key: p.plan,
          // Tarif kaliti bazada kichik harfda («free», «pro»).
          label: p.plan.charAt(0).toUpperCase() + p.plan.slice(1),
          value: p.n,
        }))}
        devices={devices.map((d) => ({
          key: d.device,
          label: deviceLabel(d.device as DeviceKind),
          value: d.sessions,
        }))}
      />
    </div>
  );
}

function TrendsSkeleton() {
  return (
    <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
      <Skeleton className="h-[320px] rounded-xl" />
      <Skeleton className="h-[320px] rounded-xl" />
    </div>
  );
}

/* ── Ogʻir oqim: voronka + eʼtibor talab qiladiganlar ──
   Ikkalasi bitta mavzu (kim qayerda toʻxtadi), shuning uchun keng
   ekranda yonma-yon turadi. */

async function ActivationSection() {
  const { funnel, atRisk } = await getActivationOverview();

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <FunnelPanel funnel={funnel} />
      <AtRiskPanel rows={atRisk} />
    </div>
  );
}

function ActivationSkeleton() {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Skeleton className="h-[380px] rounded-xl" />
      <Skeleton className="h-[380px] rounded-xl" />
    </div>
  );
}

/* ── Telegram: ulanish zanjiri ──
   Har qator oldingisining quyi toʻplami EMAS (bloklangan, marketing —
   yon koʻrsatkich), shuning uchun voronka emas, oddiy ulushlar roʻyxati.
   Maxraj hamma joyda bitta — oʻqituvchilar soni. */
async function TelegramSection() {
  /* Panel oʻz xatosini oʻzi ushlaydi: ushlamasa xato admin/error.tsx gacha
     koʻtarilib, ishlab turgan voronka va grafiklarni ham oʻchirardi
     (masalan 0048 migratsiyasi qoʻllanmagan bazada). */
  let s: TelegramStats;
  try {
    s = await getTelegramStats();
  } catch (err) {
    unstable_rethrow(err);
    console.error("[admin] telegram koʻrsatkichlari:", err);
    return (
      <Panel>
        <AdminPanelHeader
          icon={<Send />}
          title="Telegram bot"
          description="Maʼlumotni yuklab boʻlmadi"
          divider={false}
        />
      </Panel>
    );
  }

  const pctOf = (n: number) => (s.teachers ? Math.round((n / s.teachers) * 100) : 0);
  const rows: { label: string; value: number; hint?: string }[] = [
    { label: "Telegram ulangan", value: s.linked },
    {
      label: "Botni ochmagan",
      value: s.linkedNoBot,
      hint: "ulangan, lekin /start yoʻq — xabar olmaydi",
    },
    { label: "Xabar yetib boradi", value: s.botActive },
    { label: "Oxirgi 7 kunda xabar olgan", value: s.digestWeek },
    { label: "Telefon raqami bor", value: s.withPhone },
    { label: "Marketingga rozi", value: s.marketingYes },
    { label: "Botni bloklagan", value: s.blocked },
  ];

  return (
    <Panel>
      <AdminPanelHeader
        icon={<Send />}
        title="Telegram bot"
        description={`${s.teachers} oʻqituvchidan ulush`}
      />
      <PanelBody inset className="grid gap-x-8 gap-y-3 md:grid-cols-2">
        {rows.map((r) => (
          <ShareRow key={r.label} {...r} share={pctOf(r.value)} />
        ))}
      </PanelBody>
    </Panel>
  );
}

export default function AdminHomePage() {
  return (
    <div className="flex flex-col gap-5 p-5">
      {/* Voronka tepada turadi, lekin ogʻirroq — shuning uchun grafik
          uni kutmaydi: ikki chegara mustaqil oqadi. */}
      <Suspense fallback={<ActivationSkeleton />}>
        <ActivationSection />
      </Suspense>

      <Suspense fallback={<TrendsSkeleton />}>
        <TrendsSection />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-[240px] rounded-xl" />}>
        <TelegramSection />
      </Suspense>
    </div>
  );
}
