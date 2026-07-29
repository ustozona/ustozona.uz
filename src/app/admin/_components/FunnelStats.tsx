"use client";

import { LayoutGrid, GraduationCap, Activity, TrendingUp, Repeat, UserPlus } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import type { ActivationFunnel } from "@/server/dal/admin/stats";

/* StatCard "use client" — lucide ikonka funksiya-referenslari Server
   Component'dan props sifatida serializatsiya qilinmaydi, shuning uchun
   karta roʻyxati shu alohida client komponentda, faqat oddiy `funnel`
   raqamlarini qabul qilib quriladi. */

function pct(n: number, whole: number): number {
  return whole > 0 ? Math.round((n / whole) * 100) : 0;
}

function toneFor(p: number): "default" | "destructive" | "success" {
  return p < 30 ? "destructive" : p >= 70 ? "success" : "default";
}

export default function FunnelStats({ funnel }: { funnel: ActivationFunnel }) {
  const steps = [
    {
      label: "Roʻyxatdan oʻtgan",
      value: funnel.signedUp,
      icon: UserPlus,
      unit: "ta",
      sub: "voronkaning boshlangʻich toʻplami",
    },
    {
      label: "Sinf yaratgan",
      value: funnel.withClass,
      icon: LayoutGrid,
      progress: pct(funnel.withClass, funnel.signedUp),
      tone: toneFor(pct(funnel.withClass, funnel.signedUp)),
      sub: `${pct(funnel.withClass, funnel.signedUp)}% roʻyxatdan oʻtganlardan`,
    },
    {
      label: "Oʻquvchi kiritgan",
      value: funnel.withStudents,
      icon: GraduationCap,
      progress: pct(funnel.withStudents, funnel.signedUp),
      tone: toneFor(pct(funnel.withStudents, funnel.signedUp)),
      sub: `${pct(funnel.withStudents, funnel.signedUp)}% roʻyxatdan oʻtganlardan`,
    },
    {
      label: "Faollashgan",
      value: funnel.activated,
      icon: Activity,
      progress: pct(funnel.activated, funnel.signedUp),
      tone: toneFor(pct(funnel.activated, funnel.signedUp)),
      sub: "davomat yoki baho kiritgan",
    },
    {
      label: "Qaytgan (7+ kun)",
      value: funnel.returned,
      icon: Repeat,
      progress: pct(funnel.returned, funnel.signedUp),
      tone: toneFor(pct(funnel.returned, funnel.signedUp)),
      sub: "roʻyxatdan oʻtgandan 7+ kun keyin ham ishlagan",
    },
    {
      label: "Shu hafta faol",
      value: funnel.wau,
      icon: TrendingUp,
      progress: pct(funnel.wau, funnel.signedUp),
      tone: toneFor(pct(funnel.wau, funnel.signedUp)),
      sub: "oxirgi 7 kunda real ish qilgan (WAU)",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
      {steps.map((s) => (
        <StatCard
          key={s.label}
          icon={s.icon}
          label={s.label}
          value={s.value}
          unit={s.unit}
          progress={s.progress}
          tone={s.tone}
          sub={s.sub}
        />
      ))}
    </div>
  );
}
