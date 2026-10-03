"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ════════════════════════════════════════════════════════════════════
   STUDIYA YOʻL-KOʻRSATKICHI — qadam-baqadam, ishga xalaqit bermasdan.

   Loyiha egasining talabi (2026-10-03): oʻqituvchi uch ustunda
   adashmasin — har ustunda nima qilish kerakligini QISQA aytib tursin,
   oʻzi yorqin chiqsin, 10 soniyada oʻchsin va ishga xalaqit bermasin.

   Naqsh — «kontekstual maslahat» (coach mark), toʻliq ekranli tur EMAS:
     • fon qoraytirilmaydi, sahifa bloklanmaydi — faqat pufakchaning oʻzi
       bosiladi (`pointer-events` faqat unda);
     • har qadam oʻz VAQTIDA chiqadi: reja yoʻq → «1 · reja»; reja
       tayyor boʻldi → «2 · ssenariy»; blok tanlandi → «3 · tavsiyalar»;
       hammasi tayyor → «4 · boshlash»;
     • har qadam BIR MARTA (brauzer xotirasi) — keyin oʻqituvchini
       bezovta qilmaydi; «?» tugmasi bilan istalgan payt qayta koʻriladi;
     • 10 soniyada oʻzi yopiladi; sichqoncha ustida turganda taymer
       toʻxtaydi (oʻqib ulgurmagan oʻqituvchi uchun);
     • «Kam harakat» (OS sozlamasi) yoqilgan boʻlsa — animatsiyasiz.

   Langar — ustun yoki tugmadagi `data-guide="<qadam>"`.
   ════════════════════════════════════════════════════════════════════ */

export const GUIDE_STEPS = ["plan", "flow", "advice", "start"] as const;
export type GuideStep = (typeof GUIDE_STEPS)[number];

const STORAGE_KEY = "ustozona.studioGuide.v1";
const SHOW_MS = 10_000;
const EASE_STANDARD = [0.2, 0, 0, 1] as const;

function readSeen(): Set<GuideStep> {
  try {
    const raw = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return new Set(Array.isArray(raw) ? raw.filter((s): s is GuideStep => GUIDE_STEPS.includes(s)) : []);
  } catch {
    return new Set();
  }
}

function writeSeen(seen: Set<GuideStep>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen]));
  } catch {
    // Xotira yopiq (maxfiy oyna) — maslahat keyingi safar yana chiqadi, xolos.
  }
}

/** Qaysi qadam koʻrsatilyapti va qachon. */
export function useStudioGuide() {
  const [current, setCurrent] = useState<GuideStep | null>(null);
  const seen = useRef<Set<GuideStep> | null>(null);

  /** Qadamni taklif qilish — oldin koʻrilgan boʻlsa jim. */
  const offer = useCallback((step: GuideStep) => {
    seen.current ??= readSeen();
    if (seen.current.has(step)) return;
    seen.current.add(step);
    writeSeen(seen.current);
    setCurrent(step);
  }, []);

  /** «?» — koʻrilganiga qaramay qayta koʻrsatish. */
  const replay = useCallback((step: GuideStep) => setCurrent(step), []);
  const dismiss = useCallback(() => setCurrent(null), []);

  return { current, offer, replay, dismiss };
}

type Place = { top?: number; bottom?: number; left: number; width: number };

function placeFor(step: GuideStep): Place | null {
  const el = document.querySelector<HTMLElement>(`[data-guide="${step}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(340, Math.max(240, vw - 32));
  // Langar ekranda koʻrinmasa (telefonda ustunlar ustma-ust) — pastki markazga.
  const visible = r.bottom > 80 && r.top < vh - 140 && r.width > 0;
  if (!visible) return { bottom: 16, left: (vw - width) / 2, width };
  const small = r.height < 80; // tugma — pufakcha uning OSTIDA
  const top = small ? r.bottom + 10 : r.top + 52; // ustun — sarlavhasi ostida
  const left = Math.min(Math.max(16, small ? r.right - width : r.left + 12), vw - width - 16);
  return { top: Math.min(top, vh - 150), left, width: small ? width : Math.min(width, r.width - 24) };
}

/** Pufakcha: yorqin, qisqa, 10 soniyada oʻchadi, sahifani bloklamaydi. */
export function GuideBubble({
  step,
  onClose,
  onNext,
}: {
  step: GuideStep | null;
  onClose: () => void;
  /** Keyingi qadamga (qoʻlda tur) — oxirgi qadamda yoʻq. */
  onNext?: (step: GuideStep) => void;
}) {
  const t = useTranslations("LessonStudio.guide");
  const reduce = useReducedMotion();
  const [place, setPlace] = useState<Place | null>(null);
  const [paused, setPaused] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Joylashuv: langar oʻlchami, oyna va aylantirish oʻzgarsa — qayta.
  useLayoutEffect(() => {
    if (!step) return;
    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setPlace(placeFor(step)));
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [step]);

  // 10 soniya — sichqoncha ustida turganda toʻxtaydi.
  const left = useRef(SHOW_MS);
  useEffect(() => {
    left.current = SHOW_MS;
    setPaused(false);
  }, [step]);
  useEffect(() => {
    if (!step || paused) return;
    const started = Date.now();
    const id = window.setTimeout(onClose, left.current);
    return () => {
      window.clearTimeout(id);
      left.current = Math.max(0, left.current - (Date.now() - started));
    };
  }, [step, paused, onClose]);

  if (!mounted) return null;
  const index = step ? GUIDE_STEPS.indexOf(step) : -1;
  const next = index >= 0 && index < GUIDE_STEPS.length - 1 ? GUIDE_STEPS[index + 1] : null;

  return createPortal(
    <AnimatePresence>
      {step && place && (
        <motion.div
          key={step}
          role="status"
          aria-live="polite"
          initial={reduce ? false : { opacity: 0, y: -8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
          transition={{ duration: 0.25, ease: EASE_STANDARD }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          className="studio-guide pointer-events-auto fixed z-40 overflow-hidden rounded-xl bg-info text-info-foreground shadow-lg"
          style={{ top: place.top, bottom: place.bottom, left: place.left, width: place.width }}
        >
          <div className="flex items-start gap-3 p-3 pr-2">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-info-foreground/20 text-tag font-semibold tabular-nums">
              {index + 1}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="text-title-sm">{t(`${step}.title`)}</p>
              <p className="text-body opacity-90">{t(`${step}.body`)}</p>
              {next && onNext && (
                <button
                  type="button"
                  onClick={() => onNext(next)}
                  className="mt-1 inline-flex items-center gap-1 self-start text-caption font-semibold text-info-foreground underline-offset-4 hover:underline"
                >
                  {t("next")} <ArrowRight className="size-3.5" />
                </button>
              )}
            </div>
            <button
              type="button"
              aria-label={t("close")}
              onClick={onClose}
              className="flex size-7 shrink-0 items-center justify-center rounded-md text-info-foreground/80 transition-colors duration-fast hover:bg-info-foreground/15 hover:text-info-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
          {/* Qolgan vaqt — 10 soniyalik chiziq (sichqoncha ustida toʻxtaydi). */}
          <span
            key={`${step}-bar`}
            aria-hidden
            className={cn("studio-guide-bar block h-1 origin-left bg-info-foreground/45", paused && "[animation-play-state:paused]")}
          />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/**
 * Ustunni bir marta «yoritish» — halqa ikki marta yonib-oʻchadi.
 * `pulse` oʻzgarganda qayta ishlaydi (0 — hech narsa). Faqat `opacity`
 * animatsiya qilinadi (DESIGN.md §6).
 */
export function Spotlight({ pulse }: { pulse: number }) {
  const reduce = useReducedMotion();
  if (!pulse) return null;
  return (
    <motion.span
      key={pulse}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10 rounded-card ring-[3px] ring-info"
      initial={{ opacity: 0 }}
      animate={reduce ? { opacity: [0, 1, 0] } : { opacity: [0, 1, 0.25, 1, 0] }}
      transition={{ duration: reduce ? 1.2 : 1.6, ease: "easeInOut" }}
    />
  );
}

export type FlyPath = { key: number; from: { x: number; y: number }; to: { x: number; y: number } };

/**
 * Tanlangan blokdan tavsiyalar ustuniga «uchib» boradigan nuqta —
 * koʻz qayerga qarashini koʻrsatadi. Faqat `transform` + `opacity`.
 */
export function FlyDot({ path, onDone }: { path: FlyPath | null; onDone: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || !path) return null;
  const dx = path.to.x - path.from.x;
  const dy = path.to.y - path.from.y;
  return createPortal(
    <motion.span
      key={path.key}
      aria-hidden
      className="pointer-events-none fixed z-40 size-3.5 rounded-full bg-info shadow-lg ring-4 ring-info/25"
      style={{ left: path.from.x - 7, top: path.from.y - 7 }}
      initial={{ x: 0, y: 0, scale: 0.6, opacity: 0 }}
      animate={{
        x: [0, dx * 0.5, dx],
        y: [0, dy * 0.5 - 60, dy],
        scale: [0.6, 1.25, 0.8],
        opacity: [0, 1, 1, 0],
      }}
      transition={{
        duration: 0.65,
        ease: EASE_STANDARD,
        times: [0, 0.5, 1],
        opacity: { duration: 0.65, times: [0, 0.15, 0.85, 1] },
      }}
      onAnimationComplete={onDone}
    />,
    document.body,
  );
}
