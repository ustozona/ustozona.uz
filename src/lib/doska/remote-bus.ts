"use client";

/* ════════════════════════════════════════════════════════════════════
   TAQDIMOT ↔ PULT KOʻPRIGI (Doska ichida, xotirada).

   Taqdimot vidjeti oʻz boshqaruvini (keyingi/oldingi qadam, javobni
   ochish) va joriy holatini shu yerga eʼlon qiladi; Doskadagi pult
   xosti (`RemoteHost`) esa telefondan kelgan buyruqni AYNAN shu
   funksiyalar orqali bajaradi.

   Nega `patchWidgetState` emas: qadam oʻzgarganda vidjet jonli
   sessiyani ham surishi kerak (`setLiveStepAction` — oʻquvchi
   telefonlari shunga ergashadi). Bu mantiq vidjet ichida; tashqaridan
   holatni yamash uni chetlab oʻtib, proyektor bilan oʻquvchilarni
   ajratib qoʻyardi. Shuning uchun pult vidjetning OʻZ tugmalarini bosadi.
   ════════════════════════════════════════════════════════════════════ */

export type PresentationControl = {
  next: () => void;
  prev: () => void;
  reveal: () => void;
};

export type PresentationStatus = {
  setId: string;
  classId: string | null;
  title: string;
  index: number;
  total: number;
  shape: string | null;
  stepText: string;
  revealed: boolean;
  canReveal: boolean;
  live: { joinCode: string; joined: number } | null;
  mcqCount: number;
};

type Entry = { control: PresentationControl; status: PresentationStatus };

const entries = new Map<string, Entry>();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

/** Vidjet: boshqaruv va holatni eʼlon qilish (har oʻzgarishda chaqiriladi). */
export function publishPresentation(widgetId: string, control: PresentationControl, status: PresentationStatus) {
  const prev = entries.get(widgetId);
  entries.set(widgetId, { control, status });
  if (!prev || JSON.stringify(prev.status) !== JSON.stringify(status)) emit();
}

export function unpublishPresentation(widgetId: string) {
  if (entries.delete(widgetId)) emit();
}

export function presentationEntry(widgetId: string): Entry | undefined {
  return entries.get(widgetId);
}

export function subscribePresentations(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/* ── Radio pult (PultRunner) — Doskada ochiq boʻlsa, telefon qadam va
   «Javobni koʻrsatish» ni unga yuboradi (taqdimot oʻrniga). ── */

export type PultStatus = {
  title: string;
  index: number;
  total: number;
  answered: number;
  rosterSize: number;
  revealed: boolean;
  connected: boolean;
};

let pult: { control: PresentationControl; status: PultStatus } | null = null;

export function publishPult(control: PresentationControl, status: PultStatus) {
  const changed = !pult || JSON.stringify(pult.status) !== JSON.stringify(status);
  pult = { control, status };
  if (changed) emit();
}

export function unpublishPult() {
  if (pult) {
    pult = null;
    emit();
  }
}

export function pultEntry() {
  return pult;
}
