"use client";

import { ClassTestRunner } from "@/components/class-test/ClassTestRunner";

/* ════════════════════════════════════════════════════════════════════
   PULT REJIMI — radio pultlar bilan test, natija Ustozona jurnaliga.

   Endi umumiy SINF TESTI sahnasining radio pult manbasi
   (`components/class-test/`, docs/sinf-testi-spec.md): QR-karta testi
   bilan bir xil koʻrinish — kutish zali, savol, savol natijasi,
   yakuniy natijalar. Qabul qilgich (Web Serial) — `usePultSerial`.

   Interfeys (props) oʻzgarmagan: Topshiriqlar (`useLaunchFlow`) va
   Doska (`DoskaRemote`) uni avvalgidek ochadi. Tugallanmagan dars
   localStorage'dan tiklanadi (kalit avvalgidek `ustozona_pult_…`).
   ════════════════════════════════════════════════════════════════════ */

export { parsePultSignal } from "@/components/class-test/usePultSerial";

export function PultRunner({
  setId,
  classId,
  onClose,
  onSaved,
}: {
  setId: string;
  classId: string;
  onClose: () => void;
  /** Javoblar yozildi — natija ekranini ochish uchun. */
  onSaved: (sessionId: string) => void;
}) {
  return <ClassTestRunner source="pult" setId={setId} classId={classId} onClose={onClose} onSaved={onSaved} />;
}
