import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";
import { getAdminStats, type AtRiskTeacher } from "@/server/dal/admin/stats";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import SignupsChart from "./_components/SignupsChart";
import FunnelStats from "./_components/FunnelStats";

/* Boshqaruv — faollashuv voronkasi.

   Foydalanuvchi/sinf umumiy soni oʻzi hech narsani anglatmaydi — kimdir
   roʻyxatdan oʻtib ketishi ham mumkin. Shuning uchun bosh sahifa endi
   VORONKA (har bosqich oldingisining quyi toʻplami) + kim ketmoqchi
   ekanini koʻrsatadi, terminal skript (scripts/metrics.ts) bilan bir xil
   mantiq boʻyicha. */

const REASON_LABEL: Record<AtRiskTeacher["reason"], string> = {
  no_class: "Sinf yaratmagan",
  no_students: "Oʻquvchi kiritmagan",
  no_attendance: "Davomat/baho belgilamagan",
  went_quiet: "Boshlagan, keyin toʻxtagan",
};

function daysAgoLabel(d: Date | null): string {
  if (!d) return "hech qachon ishlamagan";
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / (24 * 60 * 60 * 1000));
  if (diff <= 0) return "bugun faol boʻlgan";
  if (diff === 1) return "kecha faol boʻlgan";
  return `${diff} kun oldin faol boʻlgan`;
}

export default async function AdminHomePage() {
  const stats = await getAdminStats();

  return (
    <div className="flex flex-col gap-5 p-5">
      <FunnelStats funnel={stats.funnel} />

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <SignupsChart data={stats.signupsByDay} />

        <Card className="shadow-none gap-0 p-0">
          <div className="border-b border-border px-5 py-4">
            <h2 className="heading-small">Tarif taqsimoti</h2>
            <p className="text-caption text-muted-foreground">
              teachers.plan boʻyicha
            </p>
          </div>
          <div className="flex flex-col gap-3 p-5">
            {stats.planBreakdown.length === 0 && (
              <p className="text-sm text-muted-foreground">Maʼlumot yoʻq</p>
            )}
            {stats.planBreakdown.map((p) => (
              <div key={p.plan} className="flex items-center justify-between">
                <Badge variant="outline" className="capitalize">
                  {p.plan}
                </Badge>
                <span className="text-sm font-medium tabular-nums">{p.n}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="shadow-none gap-0 p-0">
        <div className="border-b border-border px-5 py-4">
          <h2 className="heading-small">Eʼtibor talab qiladi</h2>
          <p className="text-caption text-muted-foreground">
            Faollashmagan yoki 14+ kun jim — sababini soʻrash kerak
          </p>
        </div>
        {stats.atRisk.length === 0 ? (
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
            {stats.atRisk.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.name || r.email}</p>
                  <p className="truncate text-xs text-muted-foreground">{r.email}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge variant="outline" className="text-[10px]">
                    {REASON_LABEL[r.reason]}
                  </Badge>
                  <span className="text-caption whitespace-nowrap text-muted-foreground">
                    {daysAgoLabel(r.lastActiveAt)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
