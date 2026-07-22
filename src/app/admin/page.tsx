import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionIcon } from "@/components/ui/section-icon";
import { Users, LayoutGrid, GraduationCap, Activity } from "lucide-react";
import { getAdminStats } from "@/server/dal/admin/stats";
import { AnimatedCounter } from "@/components/dashboard/AnimatedCounter";
import SignupsChart from "./_components/SignupsChart";

/* Boshqaruv — platforma KPI koʻrsatkichlari. */

export default async function AdminHomePage() {
  const stats = await getAdminStats();

  const tiles = [
    { label: "Foydalanuvchilar", value: stats.userCount, icon: Users },
    { label: "Faol (7 kun)", value: stats.activeUsers7d, icon: Activity },
    { label: "Sinflar", value: stats.classCount, icon: LayoutGrid },
    { label: "Oʻquvchilar", value: stats.studentCount, icon: GraduationCap },
  ];

  return (
    <div className="flex flex-col gap-5 p-5">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label} className="shadow-none flex-row items-center gap-3.5 p-5">
            <SectionIcon size="lg">
              <t.icon />
            </SectionIcon>
            <div className="min-w-0">
              <AnimatedCounter
                value={t.value}
                className="text-2xl font-bold tabular-nums"
              />
              <p className="text-caption truncate text-muted-foreground">{t.label}</p>
            </div>
          </Card>
        ))}
      </div>

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
    </div>
  );
}
