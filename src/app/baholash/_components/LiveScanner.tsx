"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Check, Flashlight, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CvImage, adaptiveThreshold, warp } from "@/lib/omr/cv";
import { findSheetCorners, readBubbles, answersMatch, type SheetAnswers } from "@/lib/omr/read-sheet";
import { parseSheetQr } from "@/lib/omr/sheet-layout";

/* ════════════════════════════════════════════════════════════════════
   JONLI SKANER — varaqni tutasiz, oʻzi oʻqiydi

   Bitta-bitta surat tortish oqimi sekin edi: har varaq uchun kadr
   olish, 3-8 MB yuklash, dvigatel javobini kutish. 30 ta varaq —
   yarim soatlik ish.

   Bu yerda kamera OQIMI kadrma-kadr oʻqiladi va hammasi TELEFONDA
   bajariladi: QR topiladi → varaq burchaklari hisoblanadi →
   toʻgʻrilanadi → kataklar oʻqiladi. Tarmoqqa hech narsa
   yuborilmaydi, shuning uchun natija bir soniyada chiqadi.

   ── UCH KADR QOIDASI ────────────────────────────────────────────────

   Natija KETMA-KET UCH KADR bir xil oʻqilgandagina qabul qilinadi.
   Bu ayni paytda harakat tekshiruvi ham: telefon qimirlasa warp
   siljiydi, chegaradagi kataklar oʻzgaradi, oʻqishlar mos kelmaydi va
   sanoq nolga tushadi. Alohida «qimirlamang» detektori kerak emas.

   ⚠️ BAHO BU YERDA HISOBLANMAYDI. Ekran faqat «qaysi katak
   belgilangan» ni koʻrsatadi; toʻgʻri javob brauzerga umuman
   yuborilmaydi va ball serverda hisoblanadi (docs §7).
   ════════════════════════════════════════════════════════════════════ */

/** Bitta oʻqilgan varaq — chaqiruvchi uni roʻyxatga qoʻshadi. */
export type LiveScanResult = {
  /** Varaqdagi QR raqami — sinf roʻyxatidagi tartib. */
  studentRef: number;
  examMode: boolean;
  testRef: number;
  classRef: number;
  answers: SheetAnswers;
};

type Props = {
  questionCount: number;
  /** Shu testning QR belgisi — begona varaqni ajratish uchun. */
  expectedTestRef: number;
  /** Varaq raqami → oʻquvchi ismi (ekranda darhol koʻrsatiladi). */
  nameByRef: Map<number, string>;
  /** Allaqachon oʻqilgan raqamlar — takrorini qabul qilmaymiz. */
  scannedRefs: Set<number>;
  onScanned: (result: LiveScanResult) => void;
  onClose: () => void;
};

/** Toʻgʻrilangan tasvir tomoni. 600 — tezlik va aniqlik muvozanati. */
const WARP_SIZE = 600;
/** Ishlov beriladigan kadr eni. Kamera undan katta bersa kichraytiriladi. */
const PROCESS_W = 1080;
const VOTE_FRAMES = 3;
/** QR yoʻqda sekinroq (telefon qizimasin), topilganda tezroq. */
const IDLE_INTERVAL = 140;
const ACTIVE_INTERVAL = 30;

export default function LiveScanner({
  questionCount,
  expectedTestRef,
  nameByRef,
  scannedRefs,
  onScanned,
  onClose,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState("Kamera ochilmoqda...");
  const [hint, setHint] = useState<string | null>(null);
  const [fatal, setFatal] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [count, setCount] = useState(0);
  const [flash, setFlash] = useState<string | null>(null);

  /* Kadrlar orasida yashaydigan holat REF'da — `state` boʻlsa har
     oʻzgarishda komponent qayta chizilardi va sikl uzilardi. */
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const runningRef = useRef(true);
  const voteRef = useRef<{ key: string; reads: SheetAnswers[] }>({ key: "", reads: [] });
  const buffersRef = useRef<{ gray: CvImage; warped: CvImage; thres: CvImage } | null>(null);
  const scannedRef = useRef(scannedRefs);
  scannedRef.current = scannedRefs;
  const onScannedRef = useRef(onScanned);
  onScannedRef.current = onScanned;

  const beep = useCallback(() => {
    if (navigator.vibrate) navigator.vibrate([180, 60, 180]);
  }, []);

  useEffect(() => {
    runningRef.current = true;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    let raf = 0;
    let lastFrame = 0;
    let hasQr = false;

    /* Buferlar BIR MARTA ajratiladi va qayta ishlatiladi. Har kadrda
       600×600 lik uchta massiv yaratish axlat yigʻishni ishga solib,
       oqimni tutib-tutib qoldirardi. */
    function ensureBuffers(w: number, h: number) {
      const total = w * h;
      const current = buffersRef.current;
      if (current && current.gray.data.length === total) {
        current.gray.width = w;
        current.gray.height = h;
        return current;
      }
      const fresh = {
        gray: new CvImage(w, h, new Uint8Array(total)),
        warped: new CvImage(WARP_SIZE, WARP_SIZE, new Uint8Array(WARP_SIZE * WARP_SIZE)),
        thres: new CvImage(WARP_SIZE, WARP_SIZE, new Uint8Array(WARP_SIZE * WARP_SIZE)),
      };
      buffersRef.current = fresh;
      return fresh;
    }

    function processFrame(video: HTMLVideoElement) {
      if (!ctx) return;
      const scale = video.videoWidth > PROCESS_W ? video.videoWidth / PROCESS_W : 1;
      const w = Math.round(video.videoWidth / scale);
      const h = Math.round(video.videoHeight / scale);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      ctx.drawImage(video, 0, 0, w, h);
      const frame = ctx.getImageData(0, 0, w, h);

      /* QR ni avval yuqori-chap qismida qidiramiz — u har doim
         sarlavhada. Toʻliq kadrni har safar tekshirish toʻrt barobar
         sekin, shuning uchun u faqat zaxira yoʻl. */
      const roiW = Math.round(w * 0.6);
      const roiH = Math.round(h * 0.55);
      const roi = ctx.getImageData(0, 0, roiW, roiH);
      let qr = jsQR(roi.data, roiW, roiH, { inversionAttempts: "dontInvert" });
      if (!qr) {
        qr = jsQR(frame.data, w, h, { inversionAttempts: "attemptBoth" });
      }

      if (!qr) {
        hasQr = false;
        voteRef.current = { key: "", reads: [] };
        setStatus("Varaqni kameraga tuting");
        setHint("QR belgisi koʻrinib tursin");
        return;
      }
      hasQr = true;

      const parsed = parseSheetQr(qr.data);
      if (!parsed) return;

      if (parsed.testRef !== expectedTestRef) {
        setStatus("Bu varaq boshqa testdan");
        setHint("Toʻgʻri testning varagʻini tuting");
        voteRef.current = { key: "", reads: [] };
        return;
      }
      if (!parsed.examMode && scannedRef.current.has(parsed.studentRef)) {
        setStatus(`${nameByRef.get(parsed.studentRef) ?? `#${parsed.studentRef}`} — allaqachon oʻqilgan`);
        setHint("Keyingi varaqqa oʻting");
        voteRef.current = { key: "", reads: [] };
        return;
      }

      const corners = findSheetCorners(
        { data: frame.data, width: w, height: h },
        qr.location,
        questionCount
      );
      if (!corners) {
        setStatus("Varaqni toʻliq kadrga joylang");
        setHint("Toʻrt burchak ham koʻrinsin");
        voteRef.current = { key: "", reads: [] };
        return;
      }

      const bufs = ensureBuffers(w, h);
      const src = frame.data;
      const gray = bufs.gray.data;
      for (let i = 0, j = 0; i < src.length; i += 4, j++) {
        // Butun sonli kulranglashtirish — suzuvchi nuqtadan ~2x tez.
        gray[j] = (src[i] * 77 + src[i + 1] * 150 + src[i + 2] * 29) >> 8;
      }

      warp(bufs.gray, bufs.warped, corners, WARP_SIZE);
      // `adaptiveThreshold` manbani buzadi — nusxa ustida ishlaymiz,
      // xom tasvir esa yorugʻlik oʻlchash uchun kerak.
      const rawCopy = new CvImage(WARP_SIZE, WARP_SIZE, bufs.warped.data.slice());
      adaptiveThreshold(rawCopy, bufs.thres, 15, 7);

      const answers = readBubbles(bufs.thres, bufs.warped, WARP_SIZE, questionCount);
      if (!answers) {
        voteRef.current = { key: "", reads: [] };
        return;
      }

      const key = `${parsed.classRef}_${parsed.studentRef}_${parsed.examMode ? "e" : "c"}`;
      const vote = voteRef.current;
      if (vote.key !== key) {
        voteRef.current = { key, reads: [answers] };
        setStatus(nameByRef.get(parsed.studentRef) ?? "Varaq topildi");
        setHint("Barqaror ushlang… 1/3");
        return;
      }

      const last = vote.reads[vote.reads.length - 1];
      if (last && !answersMatch(last, answers, questionCount)) {
        // Kelishmovchilik = harakat yoki chegaradagi katak. Qaytadan.
        voteRef.current = { key, reads: [answers] };
        setHint("Barqaror ushlang… 1/3");
        return;
      }

      vote.reads.push(answers);
      if (vote.reads.length < VOTE_FRAMES) {
        setHint(`Barqaror ushlang… ${vote.reads.length}/${VOTE_FRAMES}`);
        return;
      }

      // Uch kadr kelishdi — qabul qilinadi.
      voteRef.current = { key: "", reads: [] };
      const name = nameByRef.get(parsed.studentRef) ?? `Varaq #${parsed.studentRef}`;
      const answered = Object.values(answers).filter(Boolean).length;
      setFlash(`${name} — ${answered}/${questionCount} javob`);
      setCount((c) => c + 1);
      beep();
      setTimeout(() => setFlash(null), 1800);
      onScannedRef.current({
        studentRef: parsed.studentRef,
        examMode: parsed.examMode,
        testRef: parsed.testRef,
        classRef: parsed.classRef,
        answers,
      });
    }

    function loop(ts: number) {
      if (!runningRef.current) return;
      raf = requestAnimationFrame(loop);
      const video = videoRef.current;
      if (!video || video.readyState < video.HAVE_ENOUGH_DATA) return;
      const interval = hasQr ? ACTIVE_INTERVAL : IDLE_INTERVAL;
      if (ts - lastFrame < interval) return;
      lastFrame = ts;
      try {
        processFrame(video);
      } catch {
        // Bitta kadr xatosi oqimni toʻxtatmasin.
      }
    }

    async function start() {
      /* Telefonlar cheklovlarni turlicha qabul qiladi — eng yaxshisidan
         eng oddiysigacha ketma-ket sinaymiz. `focusMode` boshlangʻich
         soʻrovda boʻlishi muhim: baʼzi Android'lar keyin qoʻyilganini
         eʼtiborsiz qoldiradi va fokus qotib qoladi. */
      const attempts: MediaStreamConstraints[] = [
        {
          audio: false,
          video: {
            facingMode: { exact: "environment" },
            width: { min: 720, ideal: 1920 },
            height: { min: 480, ideal: 1080 },
            frameRate: { ideal: 20, max: 30 },
            // @ts-expect-error — focusMode standart tiplarda yoʻq
            focusMode: { ideal: "continuous" },
          },
        },
        { audio: false, video: { facingMode: { exact: "environment" }, width: { ideal: 1280 } } },
        { audio: false, video: { facingMode: "environment" } },
      ];

      let stream: MediaStream | null = null;
      for (const constraints of attempts) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          break;
        } catch {
          // keyingisini sinaymiz
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
      if (track) {
        const caps = track.getCapabilities?.() ?? {};
        setHasTorch("torch" in caps);
        const advanced: MediaTrackConstraintSet[] = [];
        const focus = (caps as { focusMode?: string[] }).focusMode;
        if (focus?.includes("continuous")) {
          advanced.push({ focusMode: "continuous" } as MediaTrackConstraintSet);
        }
        if (advanced.length > 0) {
          await track.applyConstraints({ advanced }).catch(() => undefined);
        }
      }

      setStatus("Varaqni kameraga tuting");
      setHint("QR belgisi koʻrinib tursin");
      raf = requestAnimationFrame(loop);
    }

    void start();

    // Tozalashda ref emas, effekt ichida ushlangan element ishlatiladi
    // — komponent yopilgunicha ref boshqa narsaga ishora qilishi mumkin.
    const videoEl = videoRef.current;
    return () => {
      runningRef.current = false;
      cancelAnimationFrame(raf);
      // Kamerani BUTUNLAY oʻchiramiz: aks holda telefonda yashil
      // "kamera yoqiq" indikatori qolib ketadi va batareya yeyiladi.
      trackRef.current?.stop();
      if (videoEl) videoEl.srcObject = null;
    };
  }, [questionCount, expectedTestRef, nameByRef, beep]);

  async function toggleTorch() {
    const track = trackRef.current;
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] });
      setTorchOn(next);
    } catch {
      setHasTorch(false);
    }
  }

  /** Ekranga bosish — fokusni qaytadan qidirishga majburlaydi.

      Baʼzi telefonlar fokusni bir marta qulflab, keyin yangilamaydi;
      qoʻlda turtki berish yagona yoʻl. */
  async function refocus() {
    const track = trackRef.current;
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ focusMode: "manual" } as MediaTrackConstraintSet] });
      setTimeout(() => {
        track
          .applyConstraints({ advanced: [{ focusMode: "continuous" } as MediaTrackConstraintSet] })
          .catch(() => undefined);
      }, 200);
    } catch {
      // fokus boshqaruvi yoʻq — muhim emas
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        onClick={refocus}
        className="absolute inset-0 size-full object-cover"
      />

      {/* Moslash ramkasi — oʻqituvchi varaqni shu ichiga joylaydi. */}
      <div className="pointer-events-none absolute inset-x-[4%] top-[8%] bottom-[16%] rounded-2xl border border-dashed border-white/30" />

      <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 bg-gradient-to-b from-black/70 to-transparent px-4 py-3">
        <span className="rounded-full border border-emerald-400/40 bg-emerald-400/15 px-3 py-1 text-sm font-semibold text-emerald-300">
          {count} ta oʻqildi
        </span>
        <div className="flex items-center gap-2">
          {hasTorch && (
            <Button
              size="icon"
              variant={torchOn ? "default" : "secondary"}
              aria-label="Chiroq"
              onClick={toggleTorch}
            >
              <Flashlight className="size-4" />
            </Button>
          )}
          <Button size="icon" variant="secondary" aria-label="Yopish" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-8 pt-6 text-center">
        {fatal ? (
          <p className="text-sm font-medium text-red-300">{fatal}</p>
        ) : (
          <>
            <p className="text-sm font-semibold text-white">{status}</p>
            {hint && <p className="mt-1 text-xs text-white/60">{hint}</p>}
          </>
        )}
      </div>

      {/* Qabul qilingan varaq — qisqa tasdiq. */}
      {flash && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-3 rounded-2xl border-2 border-emerald-400 bg-slate-900/90 px-6 py-4 text-white shadow-2xl">
            <Check className="size-6 text-emerald-400" />
            <span className="text-base font-semibold">{flash}</span>
          </div>
        </div>
      )}

      {!fatal && count === 0 && status === "Kamera ochilmoqda..." && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Loader2 className="size-8 animate-spin text-white/70" />
        </div>
      )}
    </div>
  );
}
