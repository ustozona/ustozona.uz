"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { type DateRange } from "react-day-picker";
import {
  GraduationCap,
  CalendarRange,
  ArrowRight,
  ArrowLeft,
  Check,
  BookOpen,
  Users,
  User,
  School,
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
import { DateKeyPicker } from "@/components/ui/date-key-picker";
import { BirthDatePicker } from "@/components/ui/birth-date-picker";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AppleEmoji } from "@/components/ui/apple-emoji";
import { Illustration } from "@/components/ui/illustration";
import { FeatureLoop } from "@/components/onboarding/FeatureLoop";
import { confettiPresets } from "@/lib/confetti-presets";
import { PRODUCT_FEATURES } from "@/lib/product-features";
import { AnimatedTextRoller } from "@/components/shadcn-space/animated-text/animated-text-04";
import {
  Stepper,
  StepperNav,
  StepperItem,
  StepperTrigger,
  StepperIndicator,
  StepperSeparator,
  StepperTitle,
  StepperDescription,
  StepperPanel,
  StepperContent,
} from "@/components/ui/stepper";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useCalendarStore } from "@/store/useCalendarStore";
import {
  makeCalendarForYear,
  makeCalendarForRange,
  fmtDayMonthUz,
  currentAcademicStartYear,
  isCalendarConfigured,
} from "@/lib/academic-calendar";
import { dateKeyToDate, dateToKey } from "@/lib/date-keys";

/* ════════════════════════════════════════════════════════════════════
   ONBOARDING SEHRGARI — yangi oʻqituvchi uchun birinchi ishga tushirish.

   4 qadam: Xush kelibsiz → Profil → Oʻquv yili → Tayyor. Har qadam oʻz
   maʼlumotini tegishli store'ga yozadi (SettingsServerSync/CalendarServerSync
   avtomatik serverga sinxronlaydi). Yakunda `onboardingCompleted = true`.

   Oʻquv yili qadami — "yaratish" emas, TASDIQLASH: kalendar allaqachon
   CalendarServerSync tomonidan joriy sanadan rasmiy oʻzbek oʻquv yili bilan
   eager-seed qilingan (~90% oʻqituvchiga toʻgʻri keladi). Foydalanuvchi
   sukut qiymatini bir klik bilan tasdiqlaydi yoki «Sanalarni oʻzgartirish»
   orqali SHADCN KALENDARIDA oraliqni tuzatadi (choraklar/taʼtillar rasmiy
   jadval boʻyicha qayta toʻldiriladi; keyin Sozlamalar → "Oʻquv yili"da
   ham tahrirlanadi).

   `OnboardingGate` faqat hydration tugagach va onboarding tugamagan
   boʻlsa render qiladi. Yopish/Esc/tashqariga bosish bloklangan —
   chiqish faqat "Keyinroq" yoki qadamlarni tugatish orqali.
   ════════════════════════════════════════════════════════════════════ */

/** Vertikal stepper navigatsiyasi — 4 qadam (id, ikonka; sarlavha/tavsif t() orqali). */
const STEP_IDS = ["welcome", "profile", "academic-year", "done"] as const;
const STEP_ICONS = [<GraduationCap key="welcome" />, <Users key="profile" />, <CalendarRange key="academic-year" />, <Check key="done" />];
const STEP_COUNT = STEP_IDS.length;

export default function OnboardingWizard() {
  const t = useTranslations("OnboardingWizard");
  const STEPS = React.useMemo(
    () =>
      STEP_IDS.map((id, i) => ({
        id,
        title: t(`steps.${id}.title`),
        description: t(`steps.${id}.description`),
        icon: STEP_ICONS[i],
      })),
    [t]
  );
  const profile = useSettingsStore((s) => s.profile);
  const setProfile = useSettingsStore((s) => s.setProfile);
  const setAcademicYear = useSettingsStore((s) => s.setAcademicYear);
  const setOnboardingCompleted = useSettingsStore((s) => s.setOnboardingCompleted);
  const setCalendar = useCalendarStore((s) => s.setCalendar);
  const seededCalendar = useCalendarStore((s) => s.calendar);

  const [step, setStep] = React.useState(0);

  // "Tayyor" qadamiga yetganda ikki tomondan pushka effekti.
  React.useEffect(() => {
    if (step !== STEP_COUNT - 1) return;
    confettiPresets.sideCannons();
  }, [step]);

  // Profil qadam formasi (profildan oldindan toʻldirilgan — Google ism/email beradi)
  const firstName = React.useMemo(() => profile.name.trim().split(/\s+/)[0] || "", [profile.name]);
  const [name, setName] = React.useState(profile.name);
  const [school, setSchool] = React.useState(profile.school);
  const [subject, setSubject] = React.useState(profile.subject);
  const [birthDate, setBirthDate] = React.useState(profile.birthDate);

  // Oʻquv yili qadam — kalendar allaqachon eager-seed qilingan; foydalanuvchi
  // sukut oraligʻini tasdiqlaydi yoki tuzatadi (editing). Sukut oraligʻi
  // seed'langan kalendardan olinadi (aks holda joriy yildan hisoblanadi).
  const base = React.useMemo(
    () =>
      isCalendarConfigured(seededCalendar) && seededCalendar.range.start
        ? Number(seededCalendar.range.start.slice(0, 4))
        : currentAcademicStartYear(),
    [seededCalendar]
  );
  const defaultRange = React.useMemo<DateRange>(() => {
    const c = isCalendarConfigured(seededCalendar) ? seededCalendar : makeCalendarForYear(base);
    return { from: dateKeyToDate(c.range.start), to: dateKeyToDate(c.range.end) };
  }, [seededCalendar, base]);
  const [range, setRange] = React.useState<DateRange | undefined>(defaultRange);
  const [editing, setEditing] = React.useState(false);
  const hasFullRange = Boolean(range?.from && range?.to);
  const startKey = range?.from ? dateToKey(range.from) : "";
  const endKey = range?.to ? dateToKey(range.to) : "";

  // Wizard bosh sahifada tugaydi — navigatsiya yoʻq. Flag qoʻyilgach
  // TourProvider home turʼini shu yerning oʻzida avtomatik boshlaydi.
  const complete = React.useCallback(() => {
    setOnboardingCompleted(true);
  }, [setOnboardingCompleted]);

  // Tez-ikki-bosish himoyasi: footer tugmalari qadamlar orasida bir xil
  // joyda turadi — masalan oxirgi "Davom etish"ni tez ikki marta bosgan
  // foydalanuvchining ikkinchi bosishi allaqachon "Birinchi sinfni
  // yaratish"ga tegib, uni bexosdan sinf modaliga otib yuborardi (yoki
  // "Orqaga"×2 → "Keyinroq" wizard'ni butunlay yopardi). Qadam almashgandan
  // keyingi ~0.5s ichidagi yakunlovchi bosishlar eʼtiborsiz qoldiriladi.
  const stepChangedAt = React.useRef(0);
  React.useEffect(() => {
    stepChangedAt.current = Date.now();
  }, [step]);
  const safeComplete = React.useCallback(() => {
    if (Date.now() - stepChangedAt.current < 500) return;
    complete();
  }, [complete]);

  const next = () => {
    if (step === 1)
      setProfile({ name: name.trim() || profile.name, school: school.trim(), subject: subject.trim(), birthDate });
    if (step === 2 && startKey && endKey) {
      const cal = makeCalendarForRange(startKey, endKey);
      setCalendar(cal);
      setAcademicYear(cal.yearLabel);
    }
    setStep((s) => Math.min(s + 1, STEP_COUNT - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const yearLabel = startKey ? makeCalendarForRange(startKey, endKey || startKey).yearLabel : "";
  const canContinueProfile = name.trim().length > 0;

  // Dialog ochilganda radix birinchi fokuslanadigan elementga (odatda "Keyinroq")
  // fokus qoʻyadi — bu ghost tugmani doimiy ring bilan bordery qilib koʻrsatadi.
  // Buning oʻrniga asosiy CTA'ga ("Davom etish") fokus beriladi.
  const primaryButtonRef = React.useRef<HTMLButtonElement>(null);

  return (
    <Dialog open>
      <DialogContent
        showCloseButton={false}
        width="46rem"
        className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          primaryButtonRef.current?.focus();
        }}
      >
        {/* Header — landing logotip tuzilishi (ikonka + "Ustozona" + aylanuvchi
            ost-loyiha soʻzi), lekin ikonka qutisi Rainbow Button "default"
            uslubida (qora fon + aylanuvchi gradient border/nurlanish).
            "Ustozona" — dashboard shrifti (DM Sans, font-sans), rolling soʻz
            oʻzining Instrument Serif kursivida qoladi (AnimatedTextRoller). */}
        <div className="flex shrink-0 items-center justify-center border-b border-border bg-muted/20 px-6 py-5">
          <div className="flex items-center gap-1.5">
            <div
              className={cn(
                "relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg text-primary-foreground",
                "animate-rainbow bg-[length:200%]",
                "[border:calc(0.125rem)_solid_transparent] [background-clip:padding-box,border-box,border-box] [background-origin:border-box]",
                "bg-[linear-gradient(var(--primary),var(--primary)),linear-gradient(var(--primary)_50%,transparent_80%),linear-gradient(90deg,var(--color-1),var(--color-5),var(--color-3),var(--color-4),var(--color-2))]",
                "before:absolute before:bottom-[-20%] before:left-1/2 before:z-0 before:h-1/5 before:w-3/5 before:-translate-x-1/2 before:animate-rainbow before:bg-[linear-gradient(90deg,var(--color-1),var(--color-5),var(--color-3),var(--color-4),var(--color-2))] before:bg-[length:200%] before:blur-md"
              )}
            >
              <GraduationCap className="relative z-10 size-4.5" strokeWidth={2} />
            </div>
            <span className="font-sans text-lg font-bold tracking-tight text-foreground">Ustozona</span>
            <AnimatedTextRoller className="-ml-0.5" />
          </div>
        </div>

        <Stepper
          steps={STEPS}
          value={STEPS[step].id}
          onValueChange={(id) => {
            // Nav orqali faqat orqaga (yoki joriy) qadamga oʻtish mumkin —
            // oldinga sakrash validatsiyani (ism/sana majburiyligi) chetlab
            // oʻtmasin. Kelajakdagi qadamlar StepperItem'da disabled.
            const idx = STEPS.findIndex((s) => s.id === id);
            if (idx !== -1 && idx <= step) setStep(idx);
          }}
          orientation="vertical"
          className="flex min-h-0 flex-1 flex-row items-stretch gap-0"
        >
        {/* Chap navigatsiya — referens (shadcn-studio stepper-09) uslubi: fonsiz,
            "suzuvchi" roʻyxat; qadamlar orasi keng (pb-15), ajratuvchi chiziq
            indikator markazidan absolyut oʻtadi. Faol qadam halqasi indikatorda
            (ring), butun qator emas. Orqaga qaytish uchun bosiladi, oldinga
            sakrash taqiqlangan (disabled) — odatiy oqim footerdagi tugmalar. */}
        <StepperNav className="w-60 shrink-0 justify-center gap-0 overflow-y-auto border-r border-border bg-muted/40 px-6 py-8">
          {STEPS.map((s, i) => (
            <StepperItem
              key={s.id}
              stepId={s.id}
              completed={i < step}
              disabled={i > step}
              className="relative items-start"
            >
              <StepperTrigger className="items-center gap-4 pb-15 last:pb-0">
                <StepperIndicator />
                <div className="flex flex-col gap-0.5 text-left">
                  <StepperTitle>{s.title}</StepperTitle>
                  <StepperDescription>{s.description}</StepperDescription>
                </div>
              </StepperTrigger>
              {i < STEPS.length - 1 && (
                // Chiziq ikon ustuni (`size-9`=36px) kengligiga aniq teng qutida
                // `justify-center` bilan markazlanadi — gorizontal tekislash piksel
                // taxminiga bogʻliq emas. Vertikal: icon ostidan boshlab keyingi
                // iconning tepasigacha (my-2 = ikki tomondan boʻshliq).
                <div className="absolute top-9 bottom-0 left-0 flex w-9 flex-col items-center">
                  <StepperSeparator className="my-2 group-data-[orientation=vertical]/stepper-nav:h-auto group-data-[orientation=vertical]/stepper-nav:flex-1" />
                </div>
              )}
            </StepperItem>
          ))}
        </StepperNav>

        <StepperPanel className="min-w-0 min-h-0 flex-1 overflow-y-auto px-6 py-6">
          {/* ── 0: Xush kelibsiz ── */}
          <StepperContent value="welcome">
            <div className="flex flex-col gap-5 text-center animate-in fade-in-50 duration-base">
              <div className="space-y-1">
                <DialogTitle className="text-lg">
                  {firstName ? t("welcome.greetingWithName", { name: firstName }) : t("welcome.greeting")}{" "}
                  <AppleEmoji code="1f60a" label={t("welcome.smileLabel")} />
                </DialogTitle>
                <DialogDescription className="text-sm/relaxed">
                  {t("welcome.subtitle")}
                </DialogDescription>
              </div>
              <FeatureLoop items={PRODUCT_FEATURES} className="pt-1" />
            </div>
          </StepperContent>

          {/* ── 1: Profil ── */}
          <StepperContent value="profile">
            <div className="flex flex-col gap-5 animate-in fade-in-50 duration-base">
              <StepHeader
                title={t("profileStep.title")}
                desc={t("profileStep.desc")}
              />
              <div className="flex flex-col gap-4">
                <Field label={t("profileStep.nameLabel")} htmlFor="ob-name" required>
                  <InputGroup>
                    <InputGroupAddon>
                      <User className="size-4" />
                    </InputGroupAddon>
                    <InputGroupInput
                      id="ob-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t("profileStep.namePlaceholder")}
                      autoFocus
                    />
                  </InputGroup>
                </Field>

                {/* Ixtiyoriy maydonlar — yupqa ajratuvchi chiziq bilan guruhlangan
                    (qutiga oʻralmaydi — Ism-familiya bilan bir xil chekkada
                    tekislanishi uchun qoʻshimcha gorizontal padding yoʻq).
                    Majburiy "Ism-familiya" — "*" + tooltip bilan. */}
                <div className="flex flex-col gap-4 border-t border-border pt-4">
                  <div className="grid grid-cols-1 gap-x-3 gap-y-4 sm:grid-cols-2">
                    <Field label={t("profileStep.schoolLabel")} htmlFor="ob-school">
                      <InputGroup>
                        <InputGroupAddon>
                          <School className="size-4" />
                        </InputGroupAddon>
                        <InputGroupInput
                          id="ob-school"
                          value={school}
                          onChange={(e) => setSchool(e.target.value)}
                          placeholder={t("profileStep.schoolPlaceholder")}
                        />
                      </InputGroup>
                    </Field>
                    <Field label={t("profileStep.subjectLabel")} htmlFor="ob-subject">
                      <InputGroup>
                        <InputGroupAddon>
                          <BookOpen className="size-4" />
                        </InputGroupAddon>
                        <InputGroupInput
                          id="ob-subject"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder={t("profileStep.subjectPlaceholder")}
                        />
                      </InputGroup>
                    </Field>
                  </div>
                  <Field label={t("profileStep.birthDateLabel")} htmlFor="ob-birth-date">
                    <BirthDatePicker value={birthDate} onChange={setBirthDate} />
                  </Field>
                </div>
              </div>
            </div>
          </StepperContent>

          {/* ── 2: Oʻquv yili (tasdiqlash yoki tuzatish) ── */}
          <StepperContent value="academic-year">
            <div className="flex flex-col gap-4 animate-in fade-in-50 duration-base">
              <StepHeader
                title={t("yearStep.title")}
                desc={t("yearStep.desc")}
              />

              {!editing ? (
                <>
                  <div className="rounded-xl border border-border bg-muted/30 px-4 py-4">
                    {hasFullRange ? (
                      <>
                        <p className="text-lg font-semibold tabular-nums">{t("yearStep.academicYearLabel", { year: yearLabel })}</p>
                        <p className="text-sm text-muted-foreground mt-0.5 tabular-nums">
                          {t("yearStep.rangeSummary", { start: fmtDayMonthUz(startKey), end: fmtDayMonthUz(endKey) })}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {t("yearStep.setDatesHint")}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="self-start gap-1.5"
                    onClick={() => setEditing(true)}
                  >
                    <CalendarRange className="size-4" />
                    {t("yearStep.changeDates")}
                  </Button>
                </>
              ) : (
                <>
                  {/* "Oʻquv yili nomi" — qoʻlda kiritilmaydi, sanalardan avtomatik
                      hosil boʻladi (2026–2027 kabi), CreateSemesterModal'dagi
                      jonli sharh naqshi bilan bir xil. Foydalanuvchi faqat
                      boshlanish/tugash sanasini tanlaydi. */}
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-4 py-3">
                    <CalendarRange className="size-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm font-semibold tabular-nums">
                      {hasFullRange ? yearLabel : t("yearStep.yearNamePlaceholder")}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">{t("yearStep.periodLabel")}</Label>
                    <div className="flex items-center gap-1.5">
                      <DateKeyPicker
                        value={startKey}
                        onChange={(v) => setRange((r) => ({ from: dateKeyToDate(v), to: r?.to }))}
                        ariaLabel={t("yearStep.startDateAria")}
                        className="flex-1"
                      />
                      <span className="text-muted-foreground">—</span>
                      <DateKeyPicker
                        value={endKey}
                        onChange={(v) => setRange((r) => ({ from: r?.from, to: dateKeyToDate(v) }))}
                        ariaLabel={t("yearStep.endDateAria")}
                        className="flex-1"
                      />
                    </div>
                    {hasFullRange && (
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {t("yearStep.rangeSummary", { start: fmtDayMonthUz(startKey), end: fmtDayMonthUz(endKey) })}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </StepperContent>

          {/* ── 3: Tayyor ── */}
          <StepperContent value="done" className="h-full">
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center animate-in fade-in-50 duration-base">
              <Illustration name="48" className="h-32 text-black dark:text-white" />
              <div className="space-y-1.5">
                <DialogTitle className="text-xl">{t("doneStep.title")}</DialogTitle>
                <DialogDescription className="text-balance">
                  {t("doneStep.subtitle", { year: yearLabel })}
                </DialogDescription>
              </div>
            </div>
          </StepperContent>
        </StepperPanel>
        </Stepper>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between gap-3 border-t border-border px-6 py-4">
          {/* Har variant alohida `key` bilan — React DOM tugmani qayta
              ishlatmasin: aks holda fokus/kursor eski tugmadan yangisiga
              «koʻchib», tez ikkinchi bosish yoki ushlab turilgan Enter
              boshqa maʼnodagi tugmani bosib yuborardi. */}
          {step === 0 ? (
            <Button key="later" variant="ghost" className="text-muted-foreground" onClick={safeComplete}>
              {t("footer.later")}
            </Button>
          ) : (
            <Button key="back" variant="ghost" className="gap-1.5 text-muted-foreground" onClick={back}>
              <ArrowLeft className="size-4" />
              {t("footer.back")}
            </Button>
          )}

          {step < 3 ? (
            <Button
              key="next"
              ref={primaryButtonRef}
              className="gap-1.5 focus-visible:ring-2 focus-visible:ring-ring/25"
              onClick={next}
              disabled={(step === 1 && !canContinueProfile) || (step === 2 && !hasFullRange)}
            >
              {t("footer.continue")}
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button
              key="start"
              ref={primaryButtonRef}
              className="gap-1.5 focus-visible:ring-2 focus-visible:ring-ring/25"
              onClick={safeComplete}
            >
              {t("footer.start")}
              <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


/** Qadam sarlavhasi — ikonkasiz, chunki bir xil ikonka navda allaqachon
    koʻrsatilgan (rangli "card" quti neytral stepper uslubiga mos kelmasdi). */
function StepHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="space-y-1 text-center">
      <DialogTitle className="text-lg">{title}</DialogTitle>
      <DialogDescription className="text-sm/relaxed">{desc}</DialogDescription>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  /** Majburiy maydon — qizil "*" + tooltip bilan belgilanadi. */
  required?: boolean;
  children: React.ReactNode;
}) {
  const t = useTranslations("OnboardingWizard");
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor} className="flex items-center gap-1">
        {label}
        {required && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-destructive cursor-default" aria-label={t("requiredFieldAria")}>
                *
              </span>
            </TooltipTrigger>
            <TooltipContent>{t("requiredFieldTooltip")}</TooltipContent>
          </Tooltip>
        )}
      </Label>
      {children}
    </div>
  );
}
