"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { SegmentedToggle } from "@/components/ui/segmented-toggle";
import { Textarea } from "@/components/ui/textarea";
import { useDoskaStore } from "@/lib/doska/store";
import type { DoskaWidget } from "@/lib/doska/types";
import { parseEntries } from "@/lib/doska/wheel";
import { fmtMin, type TodayLesson } from "@/lib/doska/today";
import { todayKey } from "@/lib/date-keys";
import { doskaTodayAction } from "@/server/actions/doska-today";
import { SettingsSection } from "../SettingsFields";
import { IconToday } from "../icons";
import { WidgetEmpty } from "./WidgetEmpty";

/* ════════════════════════════════════════════════════════════════════
   BUGUN — kun jadvali yoki dars bosqichlari (docs/doska-referens-koriklari.md R409).

   Ikki koʻrinish:
     • «Darslar» — oʻqituvchining bugungi dars jadvali AVTOMATIK
       (vaqt + sinf), hozirgi dars ajratiladi, oʻtganlari xira;
     • «Bosqichlar» — dars bosqichlari roʻyxati (har qator bitta),
       bosqich bosilsa belgilanadi: sinf qayerda turganini koʻradi.

   Bosqichlar hozircha qoʻlda yoziladi; dars rejasidan (planner) olish —
   keyingi qadam. Belgilar (`done`) storeʼda — sahifa yangilansa qoladi.
   ════════════════════════════════════════════════════════════════════ */

type TodayView = "lessons" | "steps";

function readToday(state: DoskaWidget["state"]) {
  const view: TodayView = state.view === "steps" ? "steps" : "lessons";
  const steps = typeof state.steps === "string" ? state.steps : "";
  const done = Array.isArray(state.done) ? state.done.map(Number).filter(Number.isInteger) : [];
  // Belgilar qaysi roʻyxatga tegishli: "manual" yoki "<sana>:<dars boshi>".
  // Eski yozuvlarda yoʻq — qoʻlda yozilgan roʻyxat deb olinadi.
  const doneKey = typeof state.doneKey === "string" ? state.doneKey : "manual";
  return { view, steps, done, doneKey };
}

type TodayLoad = { lessons: TodayLesson[]; holiday: string | null };

let lessonsPromise: { day: string; promise: Promise<TodayLoad | null> } | null = null;

function loadLessons(day: string): Promise<TodayLoad | null> {
  if (lessonsPromise?.day !== day) {
    const promise = doskaTodayAction({ today: day })
      .then((res) =>
        res.ok && res.data.status === "ok" ? { lessons: res.data.lessons, holiday: res.data.holiday ?? null } : null,
      )
      .catch(() => {
        lessonsPromise = null;
        return null;
      });
    lessonsPromise = { day, promise };
  }
  return lessonsPromise.promise;
}

/** Daqiqa aniqligidagi joriy vaqt (kun boshidan) va sana — mountdan keyin. */
function useNowMin(): { day: string; min: number } | null {
  const [now, setNow] = React.useState<{ day: string; min: number } | null>(null);
  React.useEffect(() => {
    const tick = () => {
      const d = new Date();
      setNow({ day: todayKey(), min: d.getHours() * 60 + d.getMinutes() });
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function TodayWidget({ widget }: { widget: DoskaWidget }) {
  const { view } = readToday(widget.state);
  return view === "steps" ? <StepsView widget={widget} /> : <LessonsView />;
}

/** Joriy vaqt va bugungi darslar (`undefined` — yuklanmoqda, `null` — jadval yoʻq). */
function useTodayLoad() {
  const now = useNowMin();
  const [load, setLoad] = React.useState<TodayLoad | null | undefined>(undefined);
  const day = now?.day ?? null;

  React.useEffect(() => {
    if (!day) return;
    let alive = true;
    void loadLessons(day).then((l) => alive && setLoad(l));
    return () => {
      alive = false;
    };
  }, [day]);
  return { now, load };
}

function LessonsView() {
  const t = useTranslations("Doska.today");
  const { now, load } = useTodayLoad();

  const lessons = load?.lessons ?? [];
  const message =
    load === undefined
      ? t("loading")
      : load === null
        ? t("noTimetable")
        : load.holiday
          ? t("holiday", { name: load.holiday })
          : lessons.length === 0
            ? t("noLessons")
            : null;

  return (
    <div className="doska-card flex size-full flex-col gap-[2cqw] p-[4cqw]" data-card="slate">
      <h3 className="leading-tight font-semibold" style={{ fontSize: "clamp(0.85rem, 6cqw, 2.25rem)" }}>
        {t("title")}
      </h3>
      {message ? (
        <p className="grid flex-1 place-items-center text-center leading-snug opacity-75" style={{ fontSize: "clamp(0.8rem, 4.5cqw, 1.6rem)" }}>
          {message}
        </p>
      ) : (
        <ol translate="no" className="flex min-h-0 flex-1 flex-col gap-[1cqw] overflow-hidden" style={{ fontSize: "clamp(0.8rem, 5cqw, 2rem)" }}>
          {lessons.map((l, i) => {
            const current = now !== null && now.min >= l.startMin && now.min < l.endMin;
            const past = now !== null && now.min >= l.endMin;
            return (
              <li
                key={i}
                className={cn(
                  "flex items-baseline gap-[2.5cqw] rounded-[0.6rem] px-[2cqw] py-[0.8cqw]",
                  current && "bg-primary text-primary-foreground font-semibold",
                  past && "opacity-45",
                )}
              >
                <span className="font-mono tabular-nums">{fmtMin(l.startMin)}</span>
                <span className="shrink-0">{l.className}</span>
                {l.title && <span className="min-w-0 truncate opacity-75">{l.title}</span>}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function StepsView({ widget }: { widget: DoskaWidget }) {
  const patch = useDoskaStore((s) => s.patchWidgetState);
  const toggleSettings = useDoskaStore((s) => s.toggleSettings);
  const t = useTranslations("Doska.today");
  const { steps, done: savedDone, doneKey } = readToday(widget.state);
  const { now, load } = useTodayLoad();
  const manual = parseEntries(steps);

  // Qoʻlda yozilmagan boʻlsa — hozirgi (yoki keyingi) darsning rejasidagi
  // sarlavhalar. Belgilar shu darsga bogʻlanadi: keyingi dars boshlanganda
  // eski belgilar uning bosqichlariga oʻtib qolmasin.
  const lesson =
    manual.length === 0 && now && load
      ? (load.lessons.find((l) => l.steps?.length && now.min < l.endMin) ?? null)
      : null;
  const items = manual.length > 0 ? manual : (lesson?.steps ?? []);
  const key = manual.length > 0 ? "manual" : lesson && now ? `${now.day}:${lesson.startMin}` : "";
  const done = doneKey === key ? savedDone : [];

  if (items.length === 0 && (manual.length > 0 || load !== undefined)) {
    return (
      <WidgetEmpty Icon={IconToday} text={t("stepsEmpty")} action={t("stepsWrite")} onAction={() => toggleSettings(widget.id)} />
    );
  }

  const toggle = (i: number) =>
    patch(widget.id, { doneKey: key, done: done.includes(i) ? done.filter((x) => x !== i) : [...done, i] });

  return (
    <div className="doska-card flex size-full flex-col gap-[2cqw] p-[4cqw]" data-card="slate">
      <h3 className="leading-tight font-semibold" style={{ fontSize: "clamp(0.85rem, 6cqw, 2.25rem)" }}>
        {lesson?.title ?? t("stepsTitle")}
      </h3>
      {items.length === 0 ? (
        <p className="grid flex-1 place-items-center text-center leading-snug opacity-75" style={{ fontSize: "clamp(0.8rem, 4.5cqw, 1.6rem)" }}>
          {t("stepsEmpty")}
        </p>
      ) : (
        <ol className="flex min-h-0 flex-1 flex-col gap-[1cqw] overflow-hidden" style={{ fontSize: "clamp(0.8rem, 5cqw, 2rem)" }}>
          {items.map((item, i) => {
            const checked = done.includes(i);
            return (
              <li key={i}>
                <button
                  type="button"
                  data-doska-no-drag=""
                  aria-pressed={checked}
                  onClick={() => toggle(i)}
                  className="flex w-full items-center gap-[2cqw] rounded-[0.6rem] px-[1.5cqw] py-[0.6cqw] text-left hover:bg-current/10"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "grid size-[1.1em] shrink-0 place-items-center rounded-[0.25em] border-2 border-current leading-none",
                      checked && "bg-primary border-primary text-primary-foreground",
                    )}
                  >
                    {checked ? "✓" : ""}
                  </span>
                  <span className={cn("truncate", checked && "line-through opacity-50")}>{item}</span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

/* ── Sozlama kartasi ─────────────────────────────────────────────── */

export function TodaySettings({ widget }: { widget: DoskaWidget }) {
  const patch = useDoskaStore((s) => s.patchWidgetState);
  const t = useTranslations("Doska.today");
  const { view, steps, done } = readToday(widget.state);

  return (
    <>
      <SettingsSection label={t("view")}>
        <SegmentedToggle
          aria-label={t("view")}
          value={view}
          options={[
            { value: "lessons", label: t("viewLessons") },
            { value: "steps", label: t("viewSteps") },
          ]}
          onValueChange={(v) => patch(widget.id, { view: v })}
        />
      </SettingsSection>

      {view === "lessons" ? (
        <p className="text-muted-foreground text-xs leading-snug">{t("lessonsHint")}</p>
      ) : (
        <SettingsSection label={t("steps")}>
          <Textarea
            value={steps}
            rows={6}
            placeholder={t("stepsPlaceholder")}
            aria-label={t("steps")}
            className="resize-none select-text"
            // Matn oʻzgarsa qator raqamlari siljiydi — eski belgilar boshqa bosqichga tushmasin.
            onChange={(e) => patch(widget.id, { steps: e.target.value, done: [], doneKey: "manual" })}
          />
          <p className="text-muted-foreground text-xs leading-snug">{t("stepsAuto")}</p>
          {done.length > 0 && (
            <button type="button" className="text-primary self-start text-sm" onClick={() => patch(widget.id, { done: [] })}>
              {t("uncheckAll")}
            </button>
          )}
        </SettingsSection>
      )}
    </>
  );
}
