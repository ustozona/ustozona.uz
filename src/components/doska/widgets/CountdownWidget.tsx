"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useDoskaStore } from "@/lib/doska/store";
import type { DoskaWidget } from "@/lib/doska/types";
import type { AcademicYearCalendar } from "@/lib/academic-calendar";
import { daysUntil, upcomingEvents, type CountdownEvent } from "@/lib/doska/countdown";
import { todayKey } from "@/lib/date-keys";
import { doskaCalendarAction } from "@/server/actions/doska-calendar";
import { SettingsSection, SettingsSwitch } from "../SettingsFields";
import { IconCountdown } from "../icons";
import { WidgetEmpty } from "./WidgetEmpty";
import { Digits } from "./Digits";

/* ════════════════════════════════════════════════════════════════════
   VOQEA SANOGʻI — «Kuzgi taʼtilgacha 12 kun» (docs/doska-referens-koriklari.md R407).

   Voqea oʻquv kalendaridan tanlanadi (taʼtil, bayram, chorak oxiri,
   yil oxiri) — qoʻlda kiritmasdan. Kirmagan yoki kalendari yoʻq
   oʻqituvchi oʻz voqeasini yozadi (nom + sana).

   Holatda faqat TANLOV saqlanadi (`eventId` yoki `name` + `date`) —
   sana kalendardan har ochilishda olinadi: oʻqituvchi taʼtilni
   Sozlamalarda sursa, doska ham yangi sanani koʻrsatadi.

   «Faqat dars kunlari» — yakshanba va taʼtil kunlari sanalmaydi
   (bolalar uchun «yana 5 marta maktabga kelamiz» aniqroq).
   ════════════════════════════════════════════════════════════════════ */

function readCountdown(state: DoskaWidget["state"]) {
  return {
    eventId: typeof state.eventId === "string" ? state.eventId : null,
    name: typeof state.name === "string" ? state.name : "",
    date: typeof state.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(state.date) ? state.date : "",
    schoolOnly: state.schoolOnly === true,
  };
}

/* ── Kalendar: sahifa davomida bir marta ─────────────────────────── */

let calendarPromise: Promise<AcademicYearCalendar | null> | null = null;

function loadCalendar(): Promise<AcademicYearCalendar | null> {
  calendarPromise ??= doskaCalendarAction()
    .then((res) => (res.ok && res.data.status === "ok" ? res.data.calendar : null))
    .catch(() => {
      calendarPromise = null; // tarmoq xatosi — keyingi safar qayta soʻraladi
      return null;
    });
  return calendarPromise;
}

/** `undefined` — yuklanmoqda; `null` — kalendar yoʻq. */
function useCalendar(): AcademicYearCalendar | null | undefined {
  const [cal, setCal] = React.useState<AcademicYearCalendar | null | undefined>(undefined);
  React.useEffect(() => {
    let alive = true;
    void loadCalendar().then((c) => alive && setCal(c));
    return () => {
      alive = false;
    };
  }, []);
  return cal;
}

/** Sana yarim tunda almashadi — vidjet ertasiga oʻzi yangilansin. */
function useToday(): string {
  const [today, setToday] = React.useState(todayKey);
  React.useEffect(() => {
    const id = setInterval(() => setToday(todayKey()), 60_000);
    return () => clearInterval(id);
  }, []);
  return today;
}

function useEvents(cal: AcademicYearCalendar | null | undefined, today: string): CountdownEvent[] {
  const t = useTranslations("Doska.countdown");
  return React.useMemo(
    () =>
      cal
        ? upcomingEvents(cal, today, { quarterEnd: (name) => t("quarterEnd", { name }), yearEnd: t("yearEnd") })
        : [],
    [cal, today, t],
  );
}

export function CountdownWidget({ widget }: { widget: DoskaWidget }) {
  const t = useTranslations("Doska.countdown");
  const toggleSettings = useDoskaStore((s) => s.toggleSettings);
  const { eventId, name, date, schoolOnly } = readCountdown(widget.state);
  const cal = useCalendar();
  const today = useToday();
  const events = useEvents(cal, today);

  // Kalendar voqeasi; topilmasa (oʻtib ketgan yoki oʻchirilgan) — yaqinidagisi.
  const event: CountdownEvent | null =
    eventId !== null
      ? (events.find((e) => e.id === eventId) ?? events[0] ?? null)
      : date
        ? { id: "custom", name: name.trim() || t("customDefault"), date }
        : (events[0] ?? null);

  if (!event) {
    return (
      <WidgetEmpty
        Icon={IconCountdown}
        card="blue"
        text={cal === undefined ? t("loading") : t("empty")}
        action={cal === undefined ? undefined : t("choose")}
        onAction={() => toggleSettings(widget.id)}
      />
    );
  }

  const left = daysUntil(today, event.date, schoolOnly, cal ?? null);
  const isToday = event.date === today;

  return (
    <div className="doska-card flex size-full flex-col items-center justify-center gap-[2cqw] p-[5cqw] text-center" data-card="blue">
      <p className="w-full truncate leading-tight font-semibold" style={{ fontSize: "clamp(0.85rem, 6cqw, 2.5rem)" }}>
        {t("until", { name: event.name })}
      </p>
      {isToday ? (
        <p className="leading-none font-semibold" style={{ fontSize: "clamp(1.5rem, 16cqw, 9rem)" }}>
          {t("today")}
        </p>
      ) : (
        <Digits text={String(left)} style={{ fontSize: "clamp(2rem, 30cqw, 16rem)" }} />
      )}
      {!isToday && (
        <p className="opacity-75" style={{ fontSize: "clamp(0.75rem, 4.5cqw, 1.75rem)" }}>
          {schoolOnly ? t("schoolDays", { count: left }) : t("days", { count: left })}
        </p>
      )}
    </div>
  );
}

/* ── Sozlama kartasi ─────────────────────────────────────────────── */

export function CountdownSettings({ widget }: { widget: DoskaWidget }) {
  const patch = useDoskaStore((s) => s.patchWidgetState);
  const t = useTranslations("Doska.countdown");
  const { eventId, name, date, schoolOnly } = readCountdown(widget.state);
  const cal = useCalendar();
  const today = useToday();
  const events = useEvents(cal, today);
  const custom = eventId === null && date !== "";

  const option = (active: boolean) =>
    cn(
      "flex min-h-11 w-full items-center justify-between gap-2 rounded-md border px-3 text-left text-sm transition-colors",
      active ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted",
    );

  return (
    <>
      {events.length > 0 && (
        <SettingsSection label={t("fromCalendar")}>
          <div className="flex max-h-56 flex-col gap-1.5 overflow-y-auto">
            {events.slice(0, 8).map((e) => (
              <button
                key={e.id}
                type="button"
                aria-pressed={eventId === e.id}
                onClick={() => patch(widget.id, { eventId: e.id })}
                className={option(eventId === e.id)}
              >
                <span className="truncate">{e.name}</span>
                <span className="shrink-0 font-mono text-xs opacity-75">{e.date.slice(5).split("-").reverse().join(".")}</span>
              </button>
            ))}
          </div>
        </SettingsSection>
      )}
      {cal === null && <p className="text-muted-foreground text-xs leading-snug">{t("noCalendar")}</p>}

      <SettingsSection label={t("custom")}>
        <Input
          value={name}
          maxLength={40}
          placeholder={t("customPlaceholder")}
          aria-label={t("customName")}
          onChange={(e) => patch(widget.id, { name: e.target.value, eventId: null })}
        />
        <Input
          type="date"
          value={date}
          min={today}
          aria-label={t("customDate")}
          className={cn(custom && "border-primary")}
          onChange={(e) => patch(widget.id, { date: e.target.value, eventId: null })}
        />
      </SettingsSection>

      <SettingsSwitch
        label={t("schoolOnly")}
        checked={schoolOnly}
        onChange={(on) => patch(widget.id, { schoolOnly: on })}
      />
    </>
  );
}
