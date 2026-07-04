"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  CalendarRange,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  BookOpen,
  Users,
  ClipboardCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useCalendarStore } from "@/store/useCalendarStore";
import { makeCalendarForYear } from "@/lib/academic-calendar";

/* ════════════════════════════════════════════════════════════════════
   ONBOARDING SEHRGARI — yangi oʻqituvchi uchun birinchi ishga tushirish.

   4 qadam: Xush kelibsiz → Profil → Oʻquv yili → Tayyor. Har qadam oʻz
   maʼlumotini tegishli store'ga yozadi (SettingsServerSync/CalendarServerSync
   avtomatik serverga sinxronlaydi). Yakunda `onboardingCompleted = true`.

   Oʻquv yili BOʻSH boshlanadi — bu yerda foydalanuvchi yilni tanlaydi,
   choraklar/taʼtillar rasmiy jadval boʻyicha avtomatik toʻldiriladi
   (keyin Sozlamalar → "Oʻquv yili"da tahrirlanadi).

   `OnboardingGate` faqat hydration tugagach va onboarding tugamagan
   boʻlsa render qiladi. Yopish/Esc/tashqariga bosish bloklangan —
   chiqish faqat "Keyinroq" yoki qadamlarni tugatish orqali.
   ════════════════════════════════════════════════════════════════════ */

const STEP_COUNT = 4;

/** Bugungi sanadan taxminiy joriy oʻquv yili boshlanish yili: iyun (6) va
    undan keyin — shu yil, aks holda oldingi yil. */
function defaultStartYear(): number {
  const now = new Date();
  return now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1;
}

const FEATURES = [
  { icon: GraduationCap, title: "Sinflar va baholar", desc: "Oʻquvchilar, jurnal va baholash bir joyda." },
  { icon: BookOpen, title: "Dars rejalashtirish", desc: "Jadval, mavzular va dars materiallari." },
  { icon: ClipboardCheck, title: "Davomat va rivoj", desc: "Har bir oʻquvchining oʻsishini kuzating." },
];

export default function OnboardingWizard() {
  const router = useRouter();

  const profile = useSettingsStore((s) => s.profile);
  const setProfile = useSettingsStore((s) => s.setProfile);
  const setAcademicYear = useSettingsStore((s) => s.setAcademicYear);
  const setOnboardingCompleted = useSettingsStore((s) => s.setOnboardingCompleted);
  const setCalendar = useCalendarStore((s) => s.setCalendar);

  const [step, setStep] = React.useState(0);

  // Profil qadam formasi (profildan oldindan toʻldirilgan — Google ism/email beradi)
  const firstName = React.useMemo(() => profile.name.trim().split(/\s+/)[0] || "", [profile.name]);
  const [name, setName] = React.useState(profile.name);
  const [school, setSchool] = React.useState(profile.school);
  const [subject, setSubject] = React.useState(profile.subject);

  // Oʻquv yili qadam
  const base = React.useMemo(defaultStartYear, []);
  const [startYear, setStartYear] = React.useState(base);
  const yearOptions = [base - 1, base, base + 1];

  const complete = React.useCallback(
    (navigateToClasses: boolean) => {
      setOnboardingCompleted(true);
      if (navigateToClasses) router.push("/dashboard/classes");
    },
    [setOnboardingCompleted, router]
  );

  const next = () => {
    if (step === 1) setProfile({ name: name.trim() || profile.name, school: school.trim(), subject: subject.trim() });
    if (step === 2) {
      const cal = makeCalendarForYear(startYear);
      setCalendar(cal);
      setAcademicYear(cal.yearLabel);
    }
    setStep((s) => Math.min(s + 1, STEP_COUNT - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const yearLabel = `${startYear}–${startYear + 1}`;
  const canContinueProfile = name.trim().length > 0;

  return (
    <Dialog open>
      <DialogContent
        showCloseButton={false}
        width="30rem"
        className="gap-0 overflow-hidden p-0"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Progress */}
        <div className="flex items-center gap-1.5 px-6 pt-5">
          {Array.from({ length: STEP_COUNT }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-300",
                i <= step ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        <div className="px-6 py-6">
          {/* ── 0: Xush kelibsiz ── */}
          {step === 0 && (
            <div className="flex flex-col items-center gap-5 text-center animate-in fade-in-50 duration-300">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="size-7" />
              </div>
              <div className="space-y-1.5">
                <DialogTitle className="text-xl">
                  Ustozona'ga xush kelibsiz{firstName ? `, ${firstName}` : ""}!
                </DialogTitle>
                <DialogDescription className="text-balance">
                  Bir necha qadamda ishchi maydoningizni sozlaymiz. Bu bir daqiqadan koʻp vaqt olmaydi.
                </DialogDescription>
              </div>
              <div className="flex w-full flex-col gap-2.5 pt-1 text-left">
                {FEATURES.map((f) => (
                  <div key={f.title} className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-background text-foreground">
                      <f.icon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-tight">{f.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 1: Profil ── */}
          {step === 1 && (
            <div className="flex flex-col gap-5 animate-in fade-in-50 duration-300">
              <StepHeader
                icon={<Users className="size-5" />}
                title="Oʻzingiz haqingizda"
                desc="Bu maʼlumotlar profil va hisobotlarda koʻrinadi. Keyin Sozlamalarda oʻzgartirasiz."
              />
              <div className="flex flex-col gap-4">
                <Field label="Ism-familiya" htmlFor="ob-name">
                  <Input id="ob-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Masalan, Otabek Abdusattorov" autoFocus />
                </Field>
                <Field label="Maktab / muassasa" htmlFor="ob-school" optional>
                  <Input id="ob-school" value={school} onChange={(e) => setSchool(e.target.value)} placeholder="Masalan, 24-maktab" />
                </Field>
                <Field label="Asosiy fan" htmlFor="ob-subject" optional>
                  <Input id="ob-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Masalan, Ingliz tili" />
                </Field>
              </div>
            </div>
          )}

          {/* ── 2: Oʻquv yili ── */}
          {step === 2 && (
            <div className="flex flex-col gap-5 animate-in fade-in-50 duration-300">
              <StepHeader
                icon={<CalendarRange className="size-5" />}
                title="Oʻquv yilini tanlang"
                desc="Choraklar va taʼtillar rasmiy jadval boʻyicha avtomatik toʻldiriladi — keyin Sozlamalar → «Oʻquv yili»da aniqlashtirasiz."
              />
              <div className="grid grid-cols-3 gap-2">
                {yearOptions.map((y) => {
                  const active = y === startYear;
                  return (
                    <button
                      key={y}
                      type="button"
                      onClick={() => setStartYear(y)}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-xl border px-3 py-3.5 text-sm transition-colors",
                        active
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                      )}
                    >
                      <span className="font-semibold tabular-nums">{y}–{y + 1}</span>
                      {active && <Check className="size-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
              <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
                <p className="text-xs text-muted-foreground">Tanlangan yil</p>
                <p className="text-sm font-medium mt-0.5 tabular-nums">{yearLabel} · 2-sentabr — 25-may · 4 chorak</p>
              </div>
            </div>
          )}

          {/* ── 3: Tayyor ── */}
          {step === 3 && (
            <div className="flex flex-col items-center gap-5 text-center animate-in fade-in-50 duration-300">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Check className="size-7" strokeWidth={2.5} />
              </div>
              <div className="space-y-1.5">
                <DialogTitle className="text-xl">Hammasi tayyor!</DialogTitle>
                <DialogDescription className="text-balance">
                  {yearLabel} oʻquv yili sozlandi. Endi birinchi sinfingizni yaratib, oʻquvchilar, baholar va davomatni boshlashingiz mumkin.
                </DialogDescription>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between gap-3 border-t border-border px-6 py-4">
          {step === 0 ? (
            <Button variant="ghost" className="text-muted-foreground" onClick={() => complete(false)}>
              Keyinroq
            </Button>
          ) : step < 3 ? (
            <Button variant="ghost" className="gap-1.5 text-muted-foreground" onClick={back}>
              <ArrowLeft className="size-4" />
              Orqaga
            </Button>
          ) : (
            <Button variant="ghost" className="text-muted-foreground" onClick={() => complete(false)}>
              Dashboardga oʻtish
            </Button>
          )}

          {step < 3 ? (
            <Button className="gap-1.5" onClick={next} disabled={step === 1 && !canContinueProfile}>
              Davom etish
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button className="gap-1.5" onClick={() => complete(true)}>
              <GraduationCap className="size-4" />
              Birinchi sinfni yaratish
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StepHeader({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="min-w-0">
        <DialogTitle className="text-base leading-tight">{title}</DialogTitle>
        <DialogDescription className="mt-1 text-xs/relaxed">{desc}</DialogDescription>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  optional,
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor} className="flex items-center gap-1.5">
        {label}
        {optional && <span className="text-xs font-normal text-muted-foreground">(ixtiyoriy)</span>}
      </Label>
      {children}
    </div>
  );
}
