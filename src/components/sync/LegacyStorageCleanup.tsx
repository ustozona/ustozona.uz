"use client";

import { useEffect } from "react";

/* ════════════════════════════════════════════════════════════════════
   ESKI localStorage KALITLARINI TOZALASH (9-bosqich, bir martalik).

   Backend migratsiyasigacha barcha domen maʼlumotlari localStorage'da
   edi; endi yagona manba — Postgres. Eski persist kalitlari oʻqilmaydi,
   lekin brauzerlarda joy egallab yotibdi (feedback rasmlari bilan bir
   necha MB boʻlishi mumkin) — shu roʻyxat boʻyicha oʻchiriladi.

   ATAYIN QOLADIGANLAR (qurilma darajasidagi UX/holat, serverga
   koʻchirilmagan): murabbiyona-blocked-days, murabbiyona-timetable-tip,
   ustozona-cookie-consent, next-themes'ning "theme" kaliti.
   ════════════════════════════════════════════════════════════════════ */

const LEGACY_KEYS = [
  "ustozona-grades-v1",
  "ustozona-attendance-v1",
  "ustozona-calendar-v1",
  "ustozona-timetable-versions-v1",
  "ustozona-class-notes-v1",
  "ustozona-notifications-v1",
  "ustozona-feedback-v5",
  "murabbiyona-tasks-v1",
  "murabbiyona-lessons-v2",
  "murabbiyona-standard-sets-storage",
  "murabbiyona-class-storage",
  "murabbiyona-timetable-events",
  "murabbiyona-bell-config-v1",
  // Jadval sahifasining lokal sinf roʻyxati davri (jonli sinflarga oʻtildi)
  "murabbiyona-timetable-overrides-v1",
  "murabbiyona-timetable-custom-classes-v1",
  "ems.relations.v1",
];

export default function LegacyStorageCleanup() {
  useEffect(() => {
    try {
      for (const key of LEGACY_KEYS) localStorage.removeItem(key);
    } catch {
      // localStorage yopiq (private mode) — tozalash shart emas
    }
  }, []);

  return null;
}
