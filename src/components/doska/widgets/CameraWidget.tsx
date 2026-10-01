"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { useDoskaStore } from "@/lib/doska/store";
import type { DoskaWidget } from "@/lib/doska/types";
import { SettingsSwitch } from "../SettingsFields";
import { WidgetButton } from "./WidgetButton";

/* ════════════════════════════════════════════════════════════════════
   KAMERA — veb-kamera yoki hujjat kamerasi ekranda
   (docs/doska-referens-koriklari.md §2.5 D: «veb-kamera»).

   Darsda: oʻquvchi daftarini, tajribani yoki kitob sahifasini butun
   sinfga koʻrsatish. Tasvir faqat brauzerda — yozilmaydi, yuborilmaydi.

   «Toʻxtatish» — kadrni muzlatadi: daftar olib ketilsa ham ekranda
   qoladi, ustidan qalam bilan tushuntirish mumkin.

   ⚠️ Kamera FAQAT «Yoqish» bosilganda soʻraladi; holati saqlanmaydi.
   Vidjet olib tashlansa yoki ekran almashsa kamera yopiladi.
   ════════════════════════════════════════════════════════════════════ */

type CamStatus = "idle" | "starting" | "on" | "frozen" | "denied" | "unsupported";

export function CameraWidget({ widget }: { widget: DoskaWidget }) {
  const t = useTranslations("Doska.camera");
  const mirror = widget.state.mirror === true;
  const [status, setStatus] = React.useState<CamStatus>("idle");
  const [devices, setDevices] = React.useState<MediaDeviceInfo[]>([]);
  const [deviceIndex, setDeviceIndex] = React.useState(0);
  const [still, setStill] = React.useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  const release = React.useCallback(() => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
  }, []);

  // Ruxsat oynasi ochiq turganda vidjet olib tashlansa — kelgan oqim darhol yopiladi.
  const mounted = React.useRef(true);
  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      release();
    };
  }, [release]);

  async function start(index = deviceIndex) {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported");
      return;
    }
    release();
    setStill(null);
    setStatus("starting");
    const id = devices[index]?.deviceId;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: id ? { deviceId: { exact: id } } : { width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      if (!mounted.current) {
        stream.getTracks().forEach((tr) => tr.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      // Qurilmalar nomi faqat ruxsatdan KEYIN keladi.
      const all = await navigator.mediaDevices.enumerateDevices();
      setDevices(all.filter((d) => d.kind === "videoinput"));
      setStatus("on");
    } catch {
      setStatus("denied");
    }
  }

  // Kadr rasmga olinadi: oqim yopilgach baʼzi brauzerda video qorayadi.
  function freeze() {
    const v = videoRef.current;
    if (v && v.videoWidth) {
      const c = document.createElement("canvas");
      c.width = v.videoWidth;
      c.height = v.videoHeight;
      c.getContext("2d")?.drawImage(v, 0, 0);
      setStill(c.toDataURL("image/jpeg", 0.9));
    }
    release();
    setStatus("frozen");
  }

  function stop() {
    release();
    setStill(null);
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus("idle");
  }

  function nextCamera() {
    const next = (deviceIndex + 1) % devices.length;
    setDeviceIndex(next);
    void start(next);
  }

  const showVideo = status === "on" || status === "frozen";
  const message = status === "denied" ? t("denied") : status === "unsupported" ? t("unsupported") : t("hint");

  return (
    <div className="doska-card relative size-full overflow-hidden" data-card="slate">
      <video
        ref={videoRef}
        muted
        playsInline
        className="size-full bg-black object-contain"
        style={{ display: status === "on" ? "block" : "none", transform: mirror ? "scaleX(-1)" : undefined }}
      />
      {status === "frozen" && still && (
        // eslint-disable-next-line @next/next/no-img-element -- xotiradagi kadr, optimallashtirish kerak emas
        <img
          src={still}
          alt={t("frozenAlt")}
          className="size-full bg-black object-contain"
          style={{ transform: mirror ? "scaleX(-1)" : undefined }}
        />
      )}

      {!showVideo && (
        <div className="flex size-full flex-col items-center justify-center gap-[4cqw] p-[6cqw] text-center">
          <p className="leading-snug opacity-80" style={{ fontSize: "clamp(0.8rem, 5cqw, 1.75rem)" }}>
            {message}
          </p>
          <WidgetButton
            tone="primary"
            disabled={status === "starting"}
            onClick={() => void start()}
            className="min-h-11 px-[6cqw] py-[3cqw] font-semibold"
            style={{ fontSize: "clamp(0.85rem, 5cqw, 1.5rem)" }}
          >
            {t("start")}
          </WidgetButton>
        </div>
      )}

      {showVideo && (
        <div
          className="absolute inset-x-0 bottom-[2cqw] flex justify-center gap-[1.5cqw]"
          style={{ fontSize: "clamp(0.75rem, 3.4cqw, 1.2rem)" }}
        >
          <WidgetButton
            tone="primary"
            onClick={status === "frozen" ? () => void start() : freeze}
            className="px-[3.5cqw] py-[1.5cqw] shadow-md"
          >
            {status === "frozen" ? t("resume") : t("freeze")}
          </WidgetButton>
          {status === "on" && devices.length > 1 && (
            <WidgetButton onClick={nextCamera} className="bg-black/50 px-[3.5cqw] py-[1.5cqw] text-white shadow-md">
              {t("switch")}
            </WidgetButton>
          )}
          <WidgetButton onClick={stop} className="bg-black/50 px-[3.5cqw] py-[1.5cqw] text-white shadow-md">
            {t("stop")}
          </WidgetButton>
        </div>
      )}
    </div>
  );
}

/* ── Sozlama kartasi ─────────────────────────────────────────────── */

export function CameraSettings({ widget }: { widget: DoskaWidget }) {
  const patch = useDoskaStore((s) => s.patchWidgetState);
  const t = useTranslations("Doska.camera");
  return (
    <SettingsSwitch
      label={t("mirror")}
      checked={widget.state.mirror === true}
      onChange={(on) => patch(widget.id, { mirror: on })}
    />
  );
}
