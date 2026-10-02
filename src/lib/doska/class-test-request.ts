"use client";

import type { ClassTestSource } from "@/lib/class-test";

/* ════════════════════════════════════════════════════════════════════
   SINF TESTINI OCHISH SOʻROVI — Doska ichida (docs/sinf-testi-spec.md).

   Sahnani `DoskaRemote` chizadi (u ustoz pulti kanalini ham ushlaydi —
   karta javoblari telefondan shu yerga keladi). Ochish soʻrovi boshqa
   joylardan keladi: taqdimot vidjetidagi tugma, `?mode=cards` havolasi
   (Topshiriqlar → QR-kartalar → «Doskaga chiqarish»).

   Soʻrov `DoskaRemote` chizilishidan OLDIN kelishi mumkin (sahifa endi
   ochilyapti) — shuning uchun eslab qolinadi, `requestOpenRemote` bilan
   bir xil naqsh.
   ════════════════════════════════════════════════════════════════════ */

export type ClassTestRequest = { source: ClassTestSource; setId: string; classId: string };

const EVENT = "doska:open-class-test";
let pending: ClassTestRequest | null = null;

export function requestClassTest(req: ClassTestRequest) {
  pending = req;
  window.dispatchEvent(new Event(EVENT));
}

/** Kutilayotgan soʻrovni oladi (bir marta). */
export function takeClassTestRequest(): ClassTestRequest | null {
  const req = pending;
  pending = null;
  return req;
}

export function onClassTestRequest(cb: () => void): () => void {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}
