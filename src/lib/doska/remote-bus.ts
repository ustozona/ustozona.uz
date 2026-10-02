"use client";

import type { ClassTestStatus } from "@/lib/doska/remote-protocol";

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

/* ── Sinf testi (QR-karta yoki radio pult, `ClassTestRunner`) — Doskada
   ochiq boʻlsa, telefon qadam, «Javobni koʻrsatish» va karta javoblarini
   unga yuboradi (taqdimot orqada qoladi). ── */

export type ClassTestControl = {
  start: () => void;
  reveal: () => void;
  next: () => void;
  prev: () => void;
  finish: () => void;
  save: () => void;
  close: () => void;
  /** Bitta javob: `q` — savol raqami (0 yoki yoʻq — joriy / roʻyxatda «keldi»). */
  receive: (no: number, letter: string | null, q?: number) => void;
};

let classTest: { control: ClassTestControl; status: ClassTestStatus } | null = null;

export function publishClassTest(control: ClassTestControl, status: ClassTestStatus) {
  const changed = !classTest || JSON.stringify(classTest.status) !== JSON.stringify(status);
  classTest = { control, status };
  if (changed) emit();
}

export function unpublishClassTest() {
  if (classTest) {
    classTest = null;
    emit();
  }
}

export function classTestEntry() {
  return classTest;
}
