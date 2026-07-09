"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckIcon, ChevronDown, GraduationCap, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useGradesStore } from "@/store/useGradesStore";
import { useLessonStore } from "@/store/useLessonStore";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import { confettiPresets } from "@/lib/confetti-presets";

/* ════════════════════════════════════════════════════════════════════
   BOSHLASH ROʻYXATI — onboarding sehrgaridan keyingi yoʻl xaritasi.

   Wizard faqat profil/oʻquv yilini yigʻadi; haqiqiy "aha-moment" (sinf,
   oʻquvchi, dars, davomat) foydalanuvchining oʻz harakati orqali sodir
   boʻladi. Bu karta o'sha harakatlarni yoʻnaltiradi va bajarilganini
   MAVJUD store'lardan hisoblaydi (yangi persisted maydon shart emas) —
   shu sababli serverga sinxronlanmaydi, faqat "yopilgan"ligi localStorage
   'da saqlanadi (qurilma darajasida yetarli, boshqa ish stanogʻiga
   koʻchirish shart emas).

   Hamma band bajarilganda — nishonlash (confettiPresets.center) va
   avtomatik yopiladi. Foydalanuvchi istalgan payt X bilan yopishi ham
   mumkin.
   ════════════════════════════════════════════════════════════════════ */

const DISMISS_KEY = "us-getting-started-dismissed";

type ChecklistStep = {
  id: string;
  label: string;
  href: string;
  done: boolean;
};

export default function GettingStartedChecklist() {
  const pathname = usePathname();
  const onboarded = useSettingsStore((s) => s.onboardingCompleted);
  const settingsHydrated = useSettingsStore((s) => s._hasHydrated);

  const classDataMap = useGradesStore((s) => s.classDataMap);
  const gradesHydrated = useGradesStore((s) => s._hasHydrated);
  const lessons = useLessonStore((s) => s.lessons);
  const recordsByClass = useAttendanceStore((s) => s.recordsByClass);
  const attendanceHydrated = useAttendanceStore((s) => s._hasHydrated);

  const [dismissed, setDismissed] = React.useState(true);
  const [collapsed, setCollapsed] = React.useState(false);
  React.useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  const dismiss = React.useCallback(() => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }, []);

  const classes = Object.values(classDataMap);
  const steps: ChecklistStep[] = [
    {
      id: "class",
      label: "Birinchi sinfni yaratish",
      href: "/dashboard/classes?new=1",
      done: classes.length > 0,
    },
    {
      id: "students",
      label: "Oʻquvchilarni qoʻshish",
      href: "/dashboard/students",
      done: classes.some((c) => c.students.length > 0),
    },
    {
      id: "lessons",
      label: "Dars rejalashtirish",
      href: "/dashboard/lessons",
      done: lessons.length > 0,
    },
    {
      id: "attendance",
      label: "Birinchi davomatni belgilash",
      href: "/dashboard/attendance",
      done: Object.values(recordsByClass).some((r) => r.length > 0),
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;

  // Hammasi bajarilganda bir marta nishonlab, yopamiz.
  const celebratedRef = React.useRef(false);
  React.useEffect(() => {
    if (allDone && !celebratedRef.current && !dismissed) {
      celebratedRef.current = true;
      confettiPresets.center();
      const t = setTimeout(dismiss, 1400);
      return () => clearTimeout(t);
    }
  }, [allDone, dismissed, dismiss]);

  const ready = settingsHydrated && gradesHydrated && attendanceHydrated;
  if (!ready || !onboarded || dismissed) return null;
  // Onboarding sehrgari hali yopilmoqda boʻlishi mumkin (pendingRoute) —
  // dashboard sahifalaridan tashqarida koʻrsatmaymiz.
  if (!pathname.startsWith("/dashboard")) return null;

  return (
    <div className="fixed bottom-5 right-5 z-40 w-72 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-lg">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="flex w-full items-center gap-2.5 px-4 py-3 text-left"
        >
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <GraduationCap className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium leading-tight">Boshlash</p>
            <Progress value={(doneCount / steps.length) * 100} className="mt-1.5 h-1.5" />
          </div>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {doneCount}/{steps.length}
          </span>
          <ChevronDown
            className={cn("size-4 shrink-0 text-muted-foreground transition-transform", collapsed && "-rotate-90")}
          />
          <span
            role="button"
            tabIndex={0}
            aria-label="Yopish"
            onClick={(e) => {
              e.stopPropagation();
              dismiss();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                dismiss();
              }
            }}
            className="ml-1 flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-3.5" />
          </span>
        </button>

        {!collapsed && (
          <div className="flex flex-col gap-0.5 border-t border-border px-2 pb-2 pt-1.5">
            {steps.map((s) => (
              <Link
                key={s.id}
                href={s.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm hover:bg-muted",
                  s.done && "text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex size-4.5 shrink-0 items-center justify-center rounded-full border",
                    s.done ? "border-primary bg-primary text-primary-foreground" : "border-border"
                  )}
                >
                  {s.done && <CheckIcon className="size-3" strokeWidth={3} />}
                </span>
                <span className={cn(s.done && "line-through")}>{s.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
