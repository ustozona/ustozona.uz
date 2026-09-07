import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity } from "lucide-react";
import {
  getActivationOverview,
  getDeviceBreakdown,
  getSignupTrends,
  type AtRiskTeacher,
} from "@/server/dal/admin/stats";
import { deviceLabel, type DeviceKind } from "@/lib/user-agent";
import { AREA_LABELS } from "@/lib/faollik";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import SignupsChart from "./_components/SignupsChart";
import FunnelStats from "./_components/FunnelStats";

/* Boshqaruv — faollashuv voronkasi.

   Foydalanuvchi/sinf umumiy soni oʻzi hech narsani anglatmaydi — kimdir
   roʻyxatdan oʻtib ketishi ham mumkin. Shuning uchun bosh sahifa endi
   VORONKA (har bosqich oldingisining quyi toʻplami) + kim ketmoqchi
   ekanini koʻrsatadi, terminal skript (scripts/metrics.ts) bilan bir xil
   mantiq boʻyicha.

   ⚠️ SAHIFA OʻZI HECH NARSA KUTMAYDI — IKKI OQIM.

   `page` funksiyasining oʻzi `async` boʻlsa, butun ekran eng sekin
   soʻrov tugagunicha serverda ushlanib turadi va foydalanuvchi
   shu vaqt davomida hech narsa koʻrmaydi. Endi ikki mustaqil
   `<Suspense>`: yengil qism (roʻyxatdan oʻtish grafigi, tarif
   taqsimoti) darhol chiqadi, ogʻir qism (har oʻqituvchi boʻyicha
   agregat) tayyor boʻlgach oʻz skeletini almashtiradi.

   `maxDuration` — ulanish osilib qolsa Fluid compute'ning standart
   300 soniyasi oʻrniga 30 s da xato qaytadi va `error.tsx` koʻrinadi
   (`/admin/users` bilan bir xil sabab). */
export const maxDuration = 30;

const REASON_LABEL: Record<AtRiskTeacher["reason"], string> = {
  no_class: "Sinf yaratmagan",
  no_students: "Oʻquvchi kiritmagan",
  // Jadvaldagi holat yorliqlari bilan bir xil tilda — «Kam ishlagan»,
  // «Toʻxtagan» (UsersTable.tsx dagi STATUS_LABELS).
  no_activity: "Hech nima qilmagan",
  tried_once: "Kam ishlagan, davom etmagan",
  went_quiet: "Ishlagan, keyin toʻxtagan",
};

function daysAgoLabel(d: Date | null): string {
  if (!d) return "hech qachon ishlamagan";
  const diff = Math.floor(
    (Date.now() - new Date(d).getTime()) / (24 * 60 * 60 * 1000),
  );
  if (diff <= 0) return "bugun faol boʻlgan";
  if (diff === 1) return "kecha faol boʻlgan";
  return `${diff} kun oldin faol boʻlgan`;
}

/* ── Yengil oqim: roʻyxatdan oʻtish grafigi + tarif taqsimoti ── */

/* Qurilma taqsimoti — mobil UI'ga qancha kuch berish kerakligini
   koʻrsatadigan yagona raqam.

   ⚠️ Maxraj — SEANS, foydalanuvchi emas (getDeviceBreakdown izohi).
   Sarlavhada shu ataylab yozilgan: «foydalanuvchilarning 40% mobil»
   deb oʻqilib qolmasin. */
function DeviceBreakdownCard({
  rows,
}: {
  rows: Awaited<ReturnType<typeof getDeviceBreakdown>>;
}) {
  const total = rows.reduce((n, r) => n + r.sessions, 0);

  return (
    <Card className="shadow-none gap-0 p-0">
      <div className="border-b border-border px-5 py-4">
        <h2 className="heading-small">Qurilma taqsimoti</h2>
        <p className="text-caption text-muted-foreground">
          Oxirgi 30 kun seanslari boʻyicha
        </p>
      </div>
      <div className="flex flex-col gap-3 p-5">
        {total === 0 && (
          <p className="text-sm text-muted-foreground">Maʼlumot yoʻq</p>
        )}
        {rows.map((r) => (
          <div key={r.device} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-sm">
              <span>{deviceLabel(r.device as DeviceKind)}</span>
              <span className="font-medium tabular-nums">
                {r.share}%
                <span className="ml-2 font-normal text-muted-foreground">
                  {r.sessions}
                </span>
              </span>
            </div>
            {/* Oddiy nisbat chizigʻi — grafik kutubxonasi shu bitta
                koʻrsatkich uchun ortiqcha. */}
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${r.share}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

async function TrendsSection() {
  const [{ signupsByDay, planBreakdown }, devices] = await Promise.all([
    getSignupTrends(),
    getDeviceBreakdown(),
  ]);

  return (
    <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
      <SignupsChart data={signupsByDay} />

      <div className="flex flex-col gap-4">
        <Card className="shadow-none gap-0 p-0">
          <div className="border-b border-border px-5 py-4">
            <h2 className="heading-small">Tarif taqsimoti</h2>
            <p className="text-caption text-muted-foreground">
              teachers.plan boʻyicha
            </p>
          </div>
          <div className="flex flex-col gap-3 p-5">
            {planBreakdown.length === 0 && (
              <p className="text-sm text-muted-foreground">Maʼlumot yoʻq</p>
            )}
            {planBreakdown.map((p) => (
              <div key={p.plan} className="flex items-center justify-between">
                <Badge variant="outline" className="capitalize">
                  {p.plan}
                </Badge>
                <span className="text-sm font-medium tabular-nums">{p.n}</span>
              </div>
            ))}
          </div>
        </Card>

        <DeviceBreakdownCard rows={devices} />
      </div>
    </div>
  );
}

function TrendsSkeleton() {
  return (
    <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
      <Skeleton className="h-[280px] rounded-xl" />
      <Skeleton className="h-[280px] rounded-xl" />
    </div>
  );
}

/* ── Ogʻir oqim: voronka + eʼtibor talab qiladiganlar ── */

async function ActivationSection() {
  const { funnel, atRisk } = await getActivationOverview();

  return (
    <>
      <FunnelStats funnel={funnel} />

      <Card className="shadow-none gap-0 p-0">
        <div className="border-b border-border px-5 py-4">
          <h2 className="heading-small">Eʼtibor talab qiladi</h2>
          <p className="text-caption text-muted-foreground">
            Faollashmagan yoki 14+ kun jim — sababini soʻrash kerak
          </p>
        </div>
        {atRisk.length === 0 ? (
          <Empty className="py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Activity />
              </EmptyMedia>
              <EmptyTitle>Hech kim tashlab ketmagan</EmptyTitle>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="divide-y divide-border">
            {atRisk.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 px-5 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {r.name || r.email}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.email}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge variant="outline" className="text-[10px]">
                    {REASON_LABEL[r.reason]}
                  </Badge>
                  {/* Oxirgi ish QAYSI boʻlimda edi — «14 kun oldin faol
                      boʻlgan» oʻzi nima qilganini aytmasdi, va aynan shu
                      savol («nima qilyapti bu odam?») roʻyxatni ochishga
                      sabab boʻladi. */}
                  <span className="text-caption whitespace-nowrap text-muted-foreground">
                    {r.lastArea
                      ? `${AREA_LABELS[r.lastArea] ?? r.lastArea} · `
                      : ""}
                    {daysAgoLabel(r.lastActiveAt)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

function ActivationSkeleton() {
  return (
    <>
      <Skeleton className="h-[120px] rounded-xl" />
      <Skeleton className="h-[320px] rounded-xl" />
    </>
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
    </div>
  );
}
