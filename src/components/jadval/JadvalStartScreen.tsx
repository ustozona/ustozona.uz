"use client";

import { useMemo, useState, type ReactNode } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, Check, Minus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Panel, PanelBody, PanelFooter, PanelHeader } from "@/components/ui/panel";
import { SegmentedToggle } from "@/components/ui/segmented-toggle";
import { cn } from "@/lib/utils";
import type { SchoolTimetableDoc } from "@/lib/school-timetable";
import {
  assignStaffBySubject,
  buildSchoolDoc,
  clampLessonsPerDay,
  emptySetup,
  minStaffCount,
  newSubjectId,
  sectionLetters,
  setupClassNames,
  setupGrades,
  setupHours,
  setupWeeklyTotal,
  weeklyCapacity,
  GRADES,
  MAX_LESSONS_PER_DAY,
  MAX_SECTIONS,
  MIN_LESSONS_PER_DAY,
  SUBJECT_NAME_SUGGESTIONS,
  type Grade,
  type SchoolSetup,
  type StaffDraft,
} from "@/lib/school-timetable-curriculum";

/* ════════════════════════════════════════════════════════════════════
   BOSHLASH SEHRGARI.

   ⛔ ASOSIY QOIDA: javobi faqat maktabda boʻlgan savol OLDINDAN
   JAVOBLANMAYDI — na tanlangan variant bilan, na «shablon» bilan.

   4-qadam ilgari shablon soatlarni koʻrsatib «tekshiring» derdi. Bu
   notoʻgʻri yoʻl edi: rasmiy boʻlmagan raqam jadval shaklida ishonch
   uygʻotadi. Endi u maktabning oʻz tasdiqlangan «dars soatlari
   setkasi»ni KOʻCHIRISH qadami: fanlar qoʻshiladi, soatlar yoziladi.
   Zavuchning qoʻlida bu hujjat bor — dastur uni oʻylab topmaydi.

   ── Qadamlar ─────────────────────────────────────────────────────────
   1. Maktab        — nomi, davr
   2. Qoʻngʻiroq    — kuniga nechta dars, necha smena
   3. Sinflar       — darajalar, parallellar, smena
   4. Fanlar        — setkadan soatlar (daraja boʻyicha)
   5. Oʻqituvchilar — ixtiyoriy
   ════════════════════════════════════════════════════════════════════ */

const STEPS = ["Maktab", "Qoʻngʻiroq", "Sinflar", "Fanlar", "Oʻqituvchilar"] as const;
type Step = 0 | 1 | 2 | 3 | 4;
const LAST: Step = 4;

export default function JadvalStartScreen({
  onReady,
}: {
  onReady: (doc: SchoolTimetableDoc) => void;
}) {
  const [step, setStep] = useState<Step>(0);
  const [setup, setSetup] = useState<SchoolSetup>(emptySetup);
  const [names, setNames] = useState<Record<string, string>>({});
  const [newSubject, setNewSubject] = useState("");

  /* Ekranga chiqadigan qiymatlar normallashtiriladi — `NaN`/`undefined`
     React'ga yetib bormasin. */
  const lessonsPerDay = clampLessonsPerDay(setup.lessonsPerDay);
  const capacity = weeklyCapacity(lessonsPerDay);
  const subjects = setup.subjects ?? [];

  const grades = useMemo(() => setupGrades(setup), [setup]);
  const classNames = useMemo(() => setupClassNames(setup), [setup]);
  const draftDoc = useMemo(() => buildSchoolDoc(setup), [setup]);

  /** Kamida bitta darajada soati bor fanlar — 5-qadamda soʻraladi. */
  const taughtSubjects = useMemo(
    () => draftDoc.subjects.filter((s) => draftDoc.classes.some((c) => (c.plan[s.id] ?? 0) > 0)),
    [draftDoc]
  );

  const overGrade = grades.find((g) => setupWeeklyTotal(setup, g) > capacity);

  /* Toʻsiq SABABI bilan — tugma shunchaki oʻchib turmaydi. */
  const blocker =
    step === 0 && (setup.schoolName ?? "").trim().length === 0
      ? "Maktab nomini kiriting — u chop etiladigan varaqda chiqadi."
      : step === 2 && grades.length === 0
        ? "Kamida bitta sinf darajasini tanlang."
        : step === 3 && taughtSubjects.length === 0
          ? "Kamida bitta fan qoʻshing va unga soat yozing."
          : step === 3 && overGrade != null
            ? `${overGrade}-sinfda haftalik soat ${setupWeeklyTotal(setup, overGrade)} — haftada faqat ${capacity} katak bor. Bunday jadval tuzilmaydi.`
            : null;

  function patch(next: Partial<SchoolSetup>) {
    setSetup((s) => ({ ...s, ...next }));
  }

  function toggleGrade(grade: Grade) {
    setSetup((s) => {
      const sections = { ...s.sections };
      if (sections[grade]) delete sections[grade];
      else sections[grade] = 1; /* mumkin boʻlgan eng kichik qiymat, taxmin emas */
      return { ...s, sections };
    });
  }

  function addSubject(raw: string) {
    const name = raw.trim();
    if (!name) return;
    setSetup((s) => {
      const list = s.subjects ?? [];
      if (list.some((x) => x.name.toLowerCase() === name.toLowerCase())) return s;
      return { ...s, subjects: [...list, { id: newSubjectId(name, list), name }] };
    });
    setNewSubject("");
  }

  function removeSubject(id: string) {
    setSetup((s) => {
      const hours = { ...s.hours };
      delete hours[id];
      return { ...s, subjects: (s.subjects ?? []).filter((x) => x.id !== id), hours };
    });
  }

  function setHour(subjectId: string, grade: Grade, raw: string) {
    const n = raw === "" ? 0 : Math.max(0, Math.min(capacity, Math.floor(Number(raw) || 0)));
    setSetup((s) => ({
      ...s,
      hours: { ...s.hours, [subjectId]: { ...(s.hours?.[subjectId] ?? {}), [grade]: n } },
    }));
  }

  function finish() {
    const draft: StaffDraft = {};
    for (const s of taughtSubjects) {
      draft[s.id] = (names[s.id] ?? "")
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean);
    }
    onReady(assignStaffBySubject(draftDoc, draft));
  }

  const unusedSuggestions = SUBJECT_NAME_SUGGESTIONS.filter(
    (n) => !subjects.some((s) => s.name.toLowerCase() === n.toLowerCase())
  );

  return (
    /* Kenglik hamma qadamda BIR XIL — qadam almashganda karta enini
       oʻzgartirsa, ekran sakraydi. 4-qadamdagi soat matritsasi eng keng
       qism, shuning uchun oʻlcham shunga qarab tanlangan. */
    <main className="mx-auto flex min-h-svh w-full max-w-2xl flex-col justify-center p-6">
      <Panel className="h-auto">
        <PanelHeader className="flex items-end gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span
                className={cn(
                  "h-1 rounded-full transition-colors duration-fast",
                  i <= step ? "bg-primary" : "bg-border"
                )}
              />
              <span
                className={cn(
                  "text-micro truncate",
                  i === step ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
          ))}
        </PanelHeader>

        <PanelBody inset>
          {step === 0 && (
            <Question
              title="Maktabingiz nomi?"
              hint="Chop etiladigan varaq sarlavhasida shu nom chiqadi."
            >
              <Input
                autoFocus
                value={setup.schoolName ?? ""}
                placeholder="Maktab nomi"
                className="h-11"
                onChange={(e) => patch({ schoolName: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !blocker) setStep(1);
                }}
              />
              <Field label="Davr" hint="Erkin matn — oʻquv yili, yarim yillik yoki chorak.">
                <Input
                  value={setup.periodLabel ?? ""}
                  onChange={(e) => patch({ periodLabel: e.target.value })}
                />
              </Field>
            </Question>
          )}

          {step === 1 && (
            <Question title="Qoʻngʻiroq jadvali" hint="Toʻrdagi katak soni shundan kelib chiqadi.">
              <Field label="Kuniga nechta dars">
                <Stepper
                  value={lessonsPerDay}
                  min={MIN_LESSONS_PER_DAY}
                  max={MAX_LESSONS_PER_DAY}
                  onChange={(v) => patch({ lessonsPerDay: v })}
                  suffix={`bitta sinfga haftada ${capacity} katak`}
                />
              </Field>
              <Field
                label="Maktab necha smenali"
                hint="Ikki smenali boʻlsa, qaysi sinf qaysi smenada oʻqishini keyingi qadamda oʻzingiz belgilaysiz."
              >
                <SegmentedToggle<"1" | "2">
                  variant="pill"
                  value={setup.twoShift ? "2" : "1"}
                  onValueChange={(v) => patch({ twoShift: v === "2" })}
                  options={[
                    { value: "1", label: "Bir smena" },
                    { value: "2", label: "Ikki smena" },
                  ]}
                />
              </Field>
            </Question>
          )}

          {step === 2 && (
            <Question
              title="Qaysi sinflar bor?"
              hint="Darajani tanlang, keyin har birida nechta parallel borligini koʻrsating."
            >
              <div className="flex flex-wrap gap-2">
                {GRADES.map((grade) => {
                  const on = (setup.sections?.[grade] ?? 0) > 0;
                  return (
                    <button
                      key={grade}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleGrade(grade)}
                      className={cn(
                        "text-body flex h-11 w-12 items-center justify-center rounded-md border font-semibold transition-colors duration-fast",
                        on
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      {grade}
                    </button>
                  );
                })}
              </div>

              {grades.length > 0 && (
                <div className="flex flex-col divide-y divide-border overflow-hidden rounded-md border border-border">
                  {grades.map((grade) => {
                    const count = setup.sections?.[grade] ?? 1;
                    return (
                      <div key={grade} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
                        <span className="heading-small w-16 shrink-0">{grade}-sinf</span>
                        <span className="text-caption min-w-0 flex-1 truncate">
                          {sectionLetters(count)
                            .map((l) => `${grade}-${l}`)
                            .join(", ")}
                        </span>
                        {setup.twoShift && (
                          <SegmentedToggle<"1" | "2">
                            variant="pill"
                            value={String(setup.shifts?.[grade] ?? 1) as "1" | "2"}
                            onValueChange={(v) =>
                              patch({ shifts: { ...setup.shifts, [grade]: Number(v) as 1 | 2 } })
                            }
                            options={[
                              { value: "1", label: "1-smena" },
                              { value: "2", label: "2-smena" },
                            ]}
                          />
                        )}
                        <Stepper
                          value={count}
                          min={1}
                          max={MAX_SECTIONS}
                          onChange={(v) => patch({ sections: { ...setup.sections, [grade]: v } })}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </Question>
          )}

          {step === 3 && (
            <Question
              title="Fanlar va haftalik soatlar"
              hint="Maktabingizning tasdiqlangan dars soatlari setkasidan koʻchiring. Soat daraja boʻyicha yoziladi — bir darajadagi hamma parallelga bir xil qoʻllanadi."
            >
              <div className="flex gap-2">
                <Input
                  value={newSubject}
                  placeholder="Fan nomi"
                  onChange={(e) => setNewSubject(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addSubject(newSubject);
                  }}
                />
                <Button variant="outline" onClick={() => addSubject(newSubject)}>
                  <Plus />
                  Qoʻshish
                </Button>
              </div>

              {unusedSuggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {unusedSuggestions.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => addSubject(n)}
                      className="text-caption rounded-full border border-dashed border-border px-2.5 py-1 transition-colors duration-fast hover:border-primary hover:text-foreground"
                    >
                      + {n}
                    </button>
                  ))}
                </div>
              )}

              {subjects.length > 0 && (
                <div className="scrollbar-hover max-h-[40vh] overflow-auto rounded-md border border-border">
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 z-10 bg-card">
                      <tr className="border-b border-border">
                        <th className="text-label sticky left-0 bg-card px-3 py-2 text-left">Fan</th>
                        {grades.map((g) => (
                          <th key={g} className="text-label px-1 py-2 text-center tabular-nums">
                            {g}
                          </th>
                        ))}
                        <th className="w-8" />
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.map((s) => (
                        <tr key={s.id} className="border-b border-border last:border-0">
                          <td className="text-caption sticky left-0 max-w-40 truncate bg-card px-3 py-1 text-foreground">
                            {s.name}
                          </td>
                          {grades.map((g) => {
                            const h = setupHours(setup, s.id, g);
                            return (
                              <td key={g} className="px-1 py-1">
                                <Input
                                  type="number"
                                  inputMode="numeric"
                                  min={0}
                                  max={capacity}
                                  aria-label={`${s.name}, ${g}-sinf, haftalik soat`}
                                  value={h === 0 ? "" : h}
                                  placeholder="—"
                                  onChange={(e) => setHour(s.id, g, e.target.value)}
                                  className="h-8 w-12 px-1 text-center tabular-nums"
                                />
                              </td>
                            );
                          })}
                          <td className="px-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label={`${s.name} fanini olib tashlash`}
                              onClick={() => removeSubject(s.id)}
                            >
                              <X />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-muted/40">
                        <td className="text-caption sticky left-0 bg-muted/40 px-3 py-2 font-semibold text-foreground">
                          Jami / {capacity}
                        </td>
                        {grades.map((g) => {
                          const total = setupWeeklyTotal(setup, g);
                          return (
                            <td
                              key={g}
                              className={cn(
                                "text-caption px-1 py-2 text-center font-semibold tabular-nums",
                                total > capacity ? "text-destructive" : "text-foreground"
                              )}
                            >
                              {total}
                            </td>
                          );
                        })}
                        <td />
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </Question>
          )}

          {step === 4 && (
            <Question
              title="Kim oʻqitadi?"
              hint="Ismlarni vergul bilan yozing — ular sinflar orasida navbat bilan taqsimlanadi. Bu qadamni oʻtkazib yuborsangiz ham boʻladi."
            >
              <div className="scrollbar-hover flex max-h-[42vh] flex-col gap-2.5 overflow-y-auto pr-1">
                {taughtSubjects.map((s) => {
                  const min = minStaffCount(draftDoc, s.id);
                  const given = (names[s.id] ?? "").split(",").filter((x) => x.trim()).length;
                  return (
                    <div key={s.id} className="flex items-center gap-3">
                      <Label htmlFor={`stf-${s.id}`} className="w-32 shrink-0 truncate">
                        {s.name}
                      </Label>
                      <Input
                        id={`stf-${s.id}`}
                        value={names[s.id] ?? ""}
                        placeholder="Familiya I., Familiya I."
                        onChange={(e) => setNames((n) => ({ ...n, [s.id]: e.target.value }))}
                      />
                      {/* «Kamida» — arifmetik minimum, tavsiya emas. */}
                      <span
                        className={cn(
                          "text-caption w-20 shrink-0 text-right tabular-nums",
                          given > 0 && given < min && "text-destructive"
                        )}
                        title="Bitta oʻqituvchi haftasiga katak sonidan koʻp oʻqita olmaydi"
                      >
                        kamida {min}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Question>
          )}
        </PanelBody>

        <PanelFooter className="flex-col items-stretch gap-3">
          {blocker && (
            <p className="text-caption flex items-center gap-2 text-destructive">
              <AlertCircle className="size-4 shrink-0" aria-hidden />
              {blocker}
            </p>
          )}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              disabled={step === 0}
              onClick={() => setStep((s) => (s - 1) as Step)}
            >
              <ArrowLeft />
              Orqaga
            </Button>
            {step === LAST ? (
              <Button onClick={finish}>
                <Check />
                {classNames.length} sinflik jadval yaratish
              </Button>
            ) : (
              <Button disabled={blocker != null} onClick={() => setStep((s) => (s + 1) as Step)}>
                Davom etish
                <ArrowRight />
              </Button>
            )}
          </div>
        </PanelFooter>
      </Panel>
    </main>
  );
}

/* ─── Qayta ishlatiladigan qismlar ──────────────────────────────────── */

function Question({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-5">
      <div>
        <h1 className="heading-page">{title}</h1>
        <p className="text-body mt-1.5 text-muted-foreground">{hint}</p>
      </div>
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-caption">{hint}</p>}
    </div>
  );
}

function Stepper({
  value,
  min,
  max,
  onChange,
  suffix,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  suffix?: string;
}) {
  const safe = Number.isFinite(value) ? value : min;
  return (
    <div className="flex shrink-0 items-center gap-2">
      <Button
        size="icon"
        variant="outline"
        aria-label="Kamaytirish"
        disabled={safe <= min}
        onClick={() => onChange(safe - 1)}
      >
        <Minus />
      </Button>
      <span className="text-body w-6 text-center font-semibold tabular-nums">{safe}</span>
      <Button
        size="icon"
        variant="outline"
        aria-label="Koʻpaytirish"
        disabled={safe >= max}
        onClick={() => onChange(safe + 1)}
      >
        <Plus />
      </Button>
      {suffix && <span className="text-caption ml-1">{suffix}</span>}
    </div>
  );
}
