"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { SegmentedToggle } from "@/components/ui/segmented-toggle";
import { useDoskaStore } from "@/lib/doska/store";
import type { DoskaWidget } from "@/lib/doska/types";
import { SettingsSection, SettingsStepper, SettingsSwitch } from "../SettingsFields";
import { playBell, unlockDoskaSound } from "../sounds";
import { WidgetButton } from "./WidgetButton";

/* ════════════════════════════════════════════════════════════════════
   SHOVQIN OʻLCHAGICH — sinf ovozi mikrofon orqali
   (docs/doska-referens-koriklari.md R413).

   Faqat brauzerda (Web Audio): ovoz hech qayerga yuborilmaydi va
   yozilmaydi, faqat daraja hisoblanadi.

   Daraja 0–100: mikrofon signalining oʻrtacha kvadrat ildizi (RMS),
   logarifmik shkalada — quloq ham shunday eshitadi. SILLIQLASH: yoʻtal
   yoki tushib ketgan qalam bir lahzalik — ular chegaradan oshmasin.
   Chegara (`limit`) oshsa: ustun qizil, sanoq +1, ovoz yoqilgan boʻlsa
   qoʻngʻiroq — keyingisi kamida 10 soniyadan keyin.

   ⚠️ Mikrofon FAQAT «Boshlash» bosilganda soʻraladi — vidjet
   qoʻyilishi bilan brauzer ruxsat oynasini ochmaydi. Mikrofon holati
   saqlanmaydi: sahifa yangilansa qayta «Boshlash» kerak (brauzer
   baribir qayta soʻraydi). Oʻchirilganda yoki vidjet olib tashlanganda
   mikrofon yopiladi.
   ════════════════════════════════════════════════════════════════════ */

export type NoiseSmooth = "live" | "medium" | "smooth";

/** Har kadrda yangi qiymatning ulushi — kichigi silliqroq. */
const SMOOTHING: Record<NoiseSmooth, number> = { live: 0.5, medium: 0.12, smooth: 0.04 };
const BELL_GAP_MS = 10_000;

function readNoise(state: DoskaWidget["state"]) {
  const smooth: NoiseSmooth = state.smooth === "live" || state.smooth === "smooth" ? state.smooth : "medium";
  const limit = Math.min(95, Math.max(10, Number(state.limit) || 60));
  return { smooth, limit, sound: state.sound === true, overs: Math.max(0, Number(state.overs) || 0) };
}

type MicStatus = "idle" | "starting" | "on" | "denied" | "unsupported";

export function NoiseWidget({ widget }: { widget: DoskaWidget }) {
  const patch = useDoskaStore((s) => s.patchWidgetState);
  const t = useTranslations("Doska.noise");
  const { smooth, limit, sound, overs } = readNoise(widget.state);
  const [status, setStatus] = React.useState<MicStatus>("idle");
  const [level, setLevel] = React.useState(0);
  const stopRef = React.useRef<(() => void) | null>(null);

  // Oʻlchash davrida oʻzgaradigan sozlamalar — davrni qayta boshlamasdan.
  const live = React.useRef({ smooth, limit, sound, overs });
  React.useEffect(() => {
    live.current = { smooth, limit, sound, overs };
  });

  // Ruxsat oynasi ochiq turganda vidjet olib tashlansa — kelgan oqim darhol yopiladi.
  const mounted = React.useRef(true);
  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      stopRef.current?.();
    };
  }, []);

  async function start() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported");
      return;
    }
    if (live.current.sound) unlockDoskaSound();
    setStatus("starting");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false } });
    } catch {
      setStatus("denied");
      return;
    }
    if (!mounted.current) {
      stream.getTracks().forEach((tr) => tr.stop());
      return;
    }
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    ctx.createMediaStreamSource(stream).connect(analyser);
    const buf = new Float32Array(analyser.fftSize);

    let value = 0;
    let above = false;
    let lastBell = 0;
    let frame = 0;
    let shown = -1;
    const tick = () => {
      analyser.getFloatTimeDomainData(buf);
      let sum = 0;
      for (const x of buf) sum += x * x;
      const rms = Math.sqrt(sum / buf.length);
      // −60 dB … 0 dB → 0 … 100.
      const db = 20 * Math.log10(Math.max(rms, 1e-6));
      const raw = Math.min(100, Math.max(0, ((db + 60) / 60) * 100));
      const cfg = live.current;
      value += (raw - value) * SMOOTHING[cfg.smooth];

      const over = value >= cfg.limit;
      if (over && !above) {
        patch(widget.id, { overs: cfg.overs + 1 });
        const now = performance.now();
        if (cfg.sound && now - lastBell >= BELL_GAP_MS) {
          lastBell = now;
          playBell();
        }
      }
      above = over;

      const rounded = Math.round(value);
      if (rounded !== shown) {
        shown = rounded;
        setLevel(rounded);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    stopRef.current = () => {
      cancelAnimationFrame(frame);
      stream.getTracks().forEach((tr) => tr.stop());
      void ctx.close();
      stopRef.current = null;
    };
    setStatus("on");
  }

  function stop() {
    stopRef.current?.();
    setStatus("idle");
    setLevel(0);
  }

  const over = status === "on" && level >= limit;
  const message =
    status === "denied" ? t("denied") : status === "unsupported" ? t("unsupported") : status === "on" ? (over ? t("tooLoud") : t("ok")) : t("hint");

  return (
    <div className="doska-card flex size-full flex-col gap-[3cqw] p-[4cqw]" data-card={over ? "done" : "slate"}>
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-[0.75rem] bg-current/10">
        <div
          className="absolute inset-x-0 bottom-0 transition-[height] duration-100"
          style={{ height: `${level}%`, background: over ? "currentColor" : "var(--primary)", opacity: over ? 0.5 : 0.75 }}
        />
        {/* Chegara chizigʻi */}
        <div className="absolute inset-x-0 border-t-[3px] border-dashed border-current opacity-70" style={{ bottom: `${limit}%` }} />
        <p
          aria-live="polite"
          className="absolute inset-0 grid place-items-center px-[3cqw] text-center leading-tight font-semibold"
          style={{ fontSize: over ? "clamp(1rem, 9cqw, 4rem)" : "clamp(0.85rem, 5cqw, 2rem)" }}
        >
          {message}
        </p>
      </div>

      <div className="flex items-center justify-between gap-[2cqw]" style={{ fontSize: "clamp(0.75rem, 3.6cqw, 1.3rem)" }}>
        <span className="opacity-75">{t("overs", { count: overs })}</span>
        <WidgetButton
          tone={status === "on" ? "neutral" : "primary"}
          disabled={status === "starting"}
          onClick={status === "on" ? stop : start}
          className="px-[4cqw] py-[1.8cqw] font-semibold"
        >
          {status === "on" ? t("stop") : t("start")}
        </WidgetButton>
      </div>
    </div>
  );
}

/* ── Sozlama kartasi ─────────────────────────────────────────────── */

export function NoiseSettings({ widget }: { widget: DoskaWidget }) {
  const patch = useDoskaStore((s) => s.patchWidgetState);
  const t = useTranslations("Doska.noise");
  const { smooth, limit, sound, overs } = readNoise(widget.state);

  return (
    <>
      <SettingsSection label={t("limit")}>
        <SettingsStepper
          value={String(limit)}
          minusLabel={t("less")}
          plusLabel={t("more")}
          minusDisabled={limit <= 10}
          plusDisabled={limit >= 95}
          onMinus={() => patch(widget.id, { limit: limit - 5 })}
          onPlus={() => patch(widget.id, { limit: limit + 5 })}
        />
      </SettingsSection>

      <SettingsSection label={t("smooth")}>
        <SegmentedToggle
          aria-label={t("smooth")}
          value={smooth}
          options={[
            { value: "live", label: t("smoothLive") },
            { value: "medium", label: t("smoothMedium") },
            { value: "smooth", label: t("smoothSmooth") },
          ]}
          onValueChange={(v) => patch(widget.id, { smooth: v })}
        />
      </SettingsSection>

      <SettingsSwitch label={t("sound")} checked={sound} onChange={(on) => patch(widget.id, { sound: on })} />
      {overs > 0 && (
        <Button type="button" variant="outline" className="h-11 w-full" onClick={() => patch(widget.id, { overs: 0 })}>
          {t("resetOvers", { count: overs })}
        </Button>
      )}
    </>
  );
}
