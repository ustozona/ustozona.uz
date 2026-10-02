"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { LoaderCircle, PlugZap } from "lucide-react";
import type { ClassTestSource } from "@/lib/class-test";
import type { ClassTestStatus } from "@/lib/doska/remote-protocol";
import { publishClassTest, unpublishClassTest } from "@/lib/doska/remote-bus";
import { ClassTestBoard, type BoardPhone } from "./ClassTestBoard";
import { useClassTest, type ReceiveResult } from "./useClassTest";
import { usePultSerial } from "./usePultSerial";

/* ════════════════════════════════════════════════════════════════════
   SINF TESTI — ishga tushiruvchi (docs/sinf-testi-spec.md).

   `useClassTest` (holat) + `ClassTestBoard` (sahna) + javob manbai:
     • `cards` — javob telefondan keladi: Doskadagi ustoz pulti kanali
       `card` buyrugʻini `remote-bus` orqali shu yerga yuboradi;
     • `pult`  — radio pult qabul qilgichi (Web Serial) shu yerda.

   Ustoz pulti uchun holat va boshqaruv `remote-bus` ga eʼlon qilinadi —
   telefon testni boshlaydi, savolni oʻtkazadi, javobni ochadi va
   saqlaydi (Doskaning OʻZ amallari, ikkinchi mantiq yoʻq).
   ════════════════════════════════════════════════════════════════════ */

const NOTICE_MS = 4000;

export function ClassTestRunner({
  source,
  setId,
  classId,
  phone,
  onClose,
  onSaved,
}: {
  source: ClassTestSource;
  setId: string;
  classId: string;
  /** QR-karta testi: ustoz pulti (telefon) holati — kutish zalida QR. */
  phone?: BoardPhone;
  onClose: () => void;
  /** Saqlangach «Natijani ochish» — Topshiriqlardagi natija ekrani. */
  onSaved?: (sessionId: string) => void;
}) {
  const t = useTranslations("ClassTest");
  const tl = useTranslations("LaunchHub");
  const test = useClassTest({
    setId,
    classId,
    source,
    loadFailedText: tl("loadFailed"),
    actionFailedText: tl("actionFailed"),
  });

  /* ── Qisqa xabar (notanish pult, allaqachon kiritilgan) — oʻzi soʻnadi ── */
  const [notice, setNotice] = React.useState<{ text: string; at: number } | null>(null);
  React.useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(null), NOTICE_MS);
    return () => window.clearTimeout(id);
  }, [notice]);

  const explain = React.useCallback(
    (no: number, r: ReceiveResult) => {
      if (r.kind === "unknown") setNotice({ text: t("unknownNo", { no }), at: Date.now() });
      else if (r.kind === "entered") setNotice({ text: tl("pultAlreadyEntered", { name: r.name }), at: Date.now() });
    },
    [t, tl],
  );

  /* ── Radio pult ── */
  const serial = usePultSerial({
    enabled: source === "pult",
    onSignal: (no, letter) => explain(no, test.receive(no, letter)),
    onUnsupported: () => toast.error(tl("pultUnsupported")),
    onFailed: () => toast.error(tl("pultConnectFailed")),
  });

  /* Saqlangan boʻlsa yopish natija ekraniga olib boradi (Topshiriqlar) —
     avvalgi pult oqimi bilan bir xil: yozilgan javoblar darhol koʻrinsin. */
  const savedId = test.saved?.sessionId ?? null;
  const close = React.useCallback(() => {
    void serial.disconnect();
    if (savedId && onSaved) onSaved(savedId);
    else onClose();
  }, [serial, onClose, onSaved, savedId]);

  /* ── Ustoz pulti: boshqaruv va holat ── */
  const controlRef = React.useRef({ test, close, explain });
  React.useEffect(() => {
    controlRef.current = { test, close, explain };
  });
  React.useEffect(() => {
    if (!test.plan) return;
    const status: ClassTestStatus = {
      source,
      setId,
      classId,
      title: test.plan.title,
      className: test.plan.className,
      phase: test.phase,
      index: test.index,
      questionNo: test.question?.no ?? 0,
      total: test.questions.length,
      answered: test.phase === "lobby" ? test.present.length : test.answeredCount,
      rosterSize: test.available.length,
      revealed: test.isRevealed,
      connected: source === "pult" ? serial.conn === "connected" : true,
      saving: test.saving,
      saved: Boolean(test.saved),
    };
    publishClassTest(
      {
        start: () => controlRef.current.test.start(),
        reveal: () => controlRef.current.test.reveal(),
        next: () => controlRef.current.test.next(),
        prev: () => controlRef.current.test.prev(),
        finish: () => controlRef.current.test.finish(),
        save: () => void controlRef.current.test.save(),
        // Saqlanmagan javob boʻlsa telefondan yopilmaydi — tasdiq Doskada.
        close: () => {
          const { test: tt, close: done } = controlRef.current;
          if (!tt.hasAnything || tt.saved) done();
        },
        receive: (no, letter, q) => {
          const { test: tt, explain: say } = controlRef.current;
          say(no, tt.receive(no, letter, q));
        },
      },
      status,
    );
  });
  React.useEffect(() => () => unpublishClassTest(), []);

  const connection =
    source === "pult"
      ? { live: serial.conn === "connected", label: tl(`pultState_${serial.conn}`) }
      : { live: Boolean(phone?.online), label: phone?.online ? t("phoneOnline") : t("phoneWaiting") };

  const topExtra =
    source === "pult" && serial.conn !== "connected" ? (
      <button type="button" className="ct-btn" data-primary="true" disabled={serial.conn === "connecting"} onClick={serial.connect}>
        {serial.conn === "connecting" ? <LoaderCircle className="animate-spin" /> : <PlugZap />}
        {tl("pultConnect")}
      </button>
    ) : null;

  return (
    <ClassTestBoard
      test={test}
      connection={connection}
      topExtra={topExtra}
      notice={notice?.text ?? null}
      phone={source === "cards" ? phone : undefined}
      onClose={close}
      onOpenResults={onSaved ? close : undefined}
    />
  );
}
