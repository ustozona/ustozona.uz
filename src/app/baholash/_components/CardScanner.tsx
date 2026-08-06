"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronRight, Flashlight, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CvImage } from "@/lib/omr/cv";
import { detectCards, makeDetectBuffers } from "@/lib/cards/detect";
import type { CardAnswer } from "@/lib/cards/marker";

/* ════════════════════════════════════════════════════════════════════
   QR-KARTALARNI OʻQISH — butun sinf bitta kadrda

   Plickers naqshi: oʻqituvchi savolni doskaga chiqaradi, bolalar
   kartani BURAB koʻtaradi, oʻqituvchi kamerani sinfga qaratadi.
   Telefonsiz sinf uchun yagona ishlaydigan usul.

   Varaq skaneridan farqi katta:
     • u bitta katta varaqni QR orqali topadi — bu esa oʻnlab kichik
       belgini kontur qidirish bilan topadi (`lib/cards/detect.ts`);
     • u bir varaqda BARCHA savollarni oʻqiydi — bu esa bitta savolga
       BARCHA oʻquvchining javobini yigʻadi.

   Shuning uchun oqim savolma-savol: «Savol 1» yigʻiladi → «Keyingi
   savol» → ... → oxirida hammasi birdan roʻyxatga qoʻshiladi.

   ── IKKI KADR QOIDASI ───────────────────────────────────────────────

   Javob KETMA-KET IKKI KADR bir xil oʻqilgandagina qabul qilinadi.
   Bu tasodifiy xatoni yoʻqotadi: bitta kadrdagi 0,016% notoʻgʻri
   oʻqish ehtimoli ikki kadrda kvadratga koʻtariladi. Bola kartani
   burayotgan payt ham shu bilan chetlab oʻtiladi — oraliq holat ikki
   marta bir xil koʻrinmaydi.

   ⚠️ BAHO BU YERDA HISOBLANMAYDI. Toʻgʻri javob brauzerga
   yuborilmaydi; ekranda faqat «kim javob berdi» koʻrinadi.
   ════════════════════════════════════════════════════════════════════ */

export type CardCapture = {
  /** Oʻquvchi tartib raqami → savol raqami → javob. */
  byStudent: Map<number, Map<number, CardAnswer>>;
};

type Props = {
  questionCount: number;
  /** Tartib raqami → ism (ekranda darhol koʻrsatiladi). */
  nameByRef: Map<number, string>;
  onFinish: (capture: CardCapture) => void;
  onClose: () => void;
};

/** Ishlov beriladigan kadr eni. Kartalar kichik boʻlgani uchun
    varaq skaneridan yuqoriroq — 720 px da 30 ta karta ajraladi. */
const PROCESS_W = 720;
const CONFIRM_FRAMES = 2;
const FRAME_INTERVAL = 60;

export default function CardScanner({ questionCount, nameByRef, onFinish, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [question, setQuestion] = useState(1);
  const [status, setStatus] = useState("Kamera ochilmoqda...");
  const [fatal, setFatal] = useState<string | null>(null);
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  /** Shu savolda tasdiqlangan javoblar — ekranni yangilash uchun. */
  const [confirmed, setConfirmed] = useState<Map<number, CardAnswer>>(new Map());
  const [seenNow, setSeenNow] = useState(0);

  const trackRef = useRef<MediaStreamTrack | null>(null);
  const runningRef = useRef(true);
  /** Savol → oʻquvchi → javob. Kadrlar orasida yashaydi. */
  const captureRef = useRef<Map<number, Map<number, CardAnswer>>>(new Map());
  /** Tasdiqlanmagan kuzatuvlar: oʻquvchi → {javob, necha kadr}. */
  const pendingRef = useRef<Map<number, { answer: CardAnswer; count: number }>>(new Map());
  const questionRef = useRef(1);
  questionRef.current = question;

  /** Joriy savolning tasdiqlangan javoblari. */
  const answersFor = useCallback((q: number) => {
    let map = captureRef.current.get(q);
    if (!map) {
      map = new Map<number, CardAnswer>();
      captureRef.current.set(q, map);
    }
    return map;
  }, []);

  useEffect(() => {
    runningRef.current = true;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    let raf = 0;
    let last = 0;
    let gray: CvImage | null = null;
    let buffers: ReturnType<typeof makeDetectBuffers> | null = null;

    function processFrame(video: HTMLVideoElement) {
      if (!ctx) return;
      const scale = video.videoWidth > PROCESS_W ? video.videoWidth / PROCESS_W : 1;
      const w = Math.round(video.videoWidth / scale);
      const h = Math.round(video.videoHeight / scale);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gray = new CvImage(w, h, new Uint8Array(w * h));
        buffers = makeDetectBuffers(w, h);
      }
      if (!gray || !buffers) return;

      ctx.drawImage(video, 0, 0, w, h);
      const frame = ctx.getImageData(0, 0, w, h).data;
      const g = gray.data;
      for (let i = 0, j = 0; i < frame.length; i += 4, j++) {
        g[j] = (frame[i] * 77 + frame[i + 1] * 150 + frame[i + 2] * 29) >> 8;
      }

      /* Kartaning kadrdagi eng kichik tomoni. Sinfda toʻrtburchak
         koʻp (deraza, plakat, kitob) — kichiklarini tashlash eng
         arzon filtr. */
      const found = detectCards(gray, buffers, { minEdgePx: Math.round(w / 40) });
      setSeenNow(found.length);

      const pending = pendingRef.current;
      const current = answersFor(questionRef.current);
      const nowSeen = new Set<number>();
      let changed = false;

      for (const card of found) {
        const { studentNo, answer } = card.match;
        nowSeen.add(studentNo);
        const prev = pending.get(studentNo);
        if (prev && prev.answer === answer) {
          prev.count++;
          if (prev.count >= CONFIRM_FRAMES && current.get(studentNo) !== answer) {
            current.set(studentNo, answer);
            changed = true;
          }
        } else {
          // Javob oʻzgardi (bola kartani burayapti) — sanoq boshidan.
          pending.set(studentNo, { answer, count: 1 });
        }
      }
      // Kadrdan chiqib ketganlar unutiladi, lekin TASDIQLANGANI
      // qoladi: bola qoʻlini tushirsa ham javobi yozilgan.
      for (const key of [...pending.keys()]) {
        if (!nowSeen.has(key)) pending.delete(key);
      }

      if (changed) setConfirmed(new Map(current));
    }

    function loop(ts: number) {
      if (!runningRef.current) return;
      raf = requestAnimationFrame(loop);
      const video = videoRef.current;
      if (!video || video.readyState < video.HAVE_ENOUGH_DATA) return;
      if (ts - last < FRAME_INTERVAL) return;
      last = ts;
      try {
        processFrame(video);
      } catch {
        // Bitta kadr xatosi oqimni toʻxtatmasin.
      }
    }

    async function start() {
      const attempts: MediaStreamConstraints[] = [
        {
          audio: false,
          video: {
            facingMode: { exact: "environment" },
            width: { min: 720, ideal: 1920 },
            height: { min: 480, ideal: 1080 },
            // @ts-expect-error — focusMode standart tiplarda yoʻq
            focusMode: { ideal: "continuous" },
          },
        },
        { audio: false, video: { facingMode: { exact: "environment" }, width: { ideal: 1280 } } },
        { audio: false, video: { facingMode: "environment" } },
      ];
      let stream: MediaStream | null = null;
      for (const c of attempts) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(c);
          break;
        } catch {
          // keyingisi
        }
      }
      if (!stream) {
        setFatal("Kamera ochilmadi — brauzerda kameraga ruxsat bering.");
        return;
      }
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play().catch(() => undefined);

      const track = stream.getVideoTracks()[0] ?? null;
      trackRef.current = track;
      if (track) setHasTorch("torch" in (track.getCapabilities?.() ?? {}));
      setStatus("Kartalarni kameraga koʻrsating");
      raf = requestAnimationFrame(loop);
    }

    void start();
    const videoEl = videoRef.current;
    return () => {
      runningRef.current = false;
      cancelAnimationFrame(raf);
      trackRef.current?.stop();
      if (videoEl) videoEl.srcObject = null;
    };
  }, [answersFor]);

  function nextQuestion() {
    pendingRef.current.clear();
    const next = Math.min(question + 1, questionCount);
    setQuestion(next);
    setConfirmed(new Map(answersFor(next)));
  }

  function finish() {
    /* Savol boʻyicha yigʻilgani OʻQUVCHI boʻyicha qayta tiziladi —
       roʻyxat va jurnal oʻquvchi qatoriga tayanadi. */
    const byStudent = new Map<number, Map<number, CardAnswer>>();
    for (const [q, answers] of captureRef.current) {
      for (const [studentNo, answer] of answers) {
        let row = byStudent.get(studentNo);
        if (!row) {
          row = new Map<number, CardAnswer>();
          byStudent.set(studentNo, row);
        }
        row.set(q, answer);
      }
    }
    onFinish({ byStudent });
  }

  const totalCaptured = [...captureRef.current.values()].reduce((n, m) => n + m.size, 0);

  return (
    <div className="fixed inset-0 z-[60] bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 size-full object-cover"
      />

      <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 bg-gradient-to-b from-black/70 to-transparent px-4 py-3">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-white">
            Savol {question}/{questionCount}
          </span>
          <span className="text-xs text-white/60">
            {confirmed.size} javob · kadrda {seenNow} karta
          </span>
        </div>
        <div className="flex items-center gap-2">
          {hasTorch && (
            <Button
              size="icon"
              variant={torchOn ? "default" : "secondary"}
              aria-label="Chiroq"
              onClick={async () => {
                const track = trackRef.current;
                if (!track) return;
                const next = !torchOn;
                try {
                  await track.applyConstraints({
                    advanced: [{ torch: next } as MediaTrackConstraintSet],
                  });
                  setTorchOn(next);
                } catch {
                  setHasTorch(false);
                }
              }}
            >
              <Flashlight className="size-4" />
            </Button>
          )}
          <Button size="icon" variant="secondary" aria-label="Yopish" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* Tasdiqlangan javoblar — oʻqituvchi kimni kutayotganini
          koʻrsin. Ism bilan: raqamdan koʻra tezroq oʻqiladi. */}
      <div className="absolute inset-x-0 top-16 max-h-[45%] overflow-y-auto px-3">
        <div className="flex flex-wrap gap-1.5">
          {[...confirmed.entries()]
            .sort((a, b) => a[0] - b[0])
            .map(([no, answer]) => (
              <span
                key={no}
                className="rounded-full bg-emerald-500/90 px-2.5 py-1 text-xs font-semibold text-black"
              >
                {nameByRef.get(no) ?? `#${no}`} · {answer}
              </span>
            ))}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 bg-gradient-to-t from-black/85 to-transparent px-4 pb-7 pt-6">
        {fatal ? (
          <p className="text-center text-sm font-medium text-red-300">{fatal}</p>
        ) : (
          <p className="text-center text-sm text-white/80">{status}</p>
        )}
        <div className="flex items-center justify-center gap-2">
          <Button
            size="lg"
            variant="secondary"
            disabled={question >= questionCount}
            onClick={nextQuestion}
          >
            Keyingi savol <ChevronRight className="size-4" />
          </Button>
          <Button size="lg" disabled={totalCaptured === 0} onClick={finish}>
            <Check className="size-4" /> Tugatish
          </Button>
        </div>
      </div>

      {!fatal && status === "Kamera ochilmoqda..." && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Loader2 className="size-8 animate-spin text-white/70" />
        </div>
      )}
    </div>
  );
}
