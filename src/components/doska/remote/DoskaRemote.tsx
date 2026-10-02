"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { Dialog, DialogDescription, DialogOverlay, DialogPortal, DialogTitle } from "@/components/ui/dialog";
import { Z_SHORTCUTS, Z_SHORTCUTS_SCRIM } from "@/lib/doska/layers";
import { useDoskaStore } from "@/lib/doska/store";
import { widgetMeta } from "@/lib/doska/registry";
import { presentationEntry, pultEntry, subscribePresentations } from "@/lib/doska/remote-bus";
import { PultRunner } from "@/components/launch/PultRunner";
import { lessonTitle } from "@/lib/doska/lesson-handoff";
import { quickTemplateText } from "@/lib/quick-check";
import {
  REMOTE_EVENTS, parseRemoteCommand, type RemoteScreen, type RemoteState,
} from "@/lib/doska/remote-protocol";
import type { RealtimeConfig } from "@/lib/live-session";
import { useRealtimeChannel } from "@/hooks/useRealtimeChannel";
import { sendRemoteToTelegramAction, startDoskaRemoteAction } from "@/server/actions/doska-remote";
import { BarIconButton } from "../BarGroup";
import { IconClose, IconPhone } from "../icons";

/* ════════════════════════════════════════════════════════════════════
   USTOZ PULTI — Doska tomoni (xost). docs/ustoz-pulti-spec.md.

   Tepadagi «Telefon» tugmasi QR koʻrsatadi; oʻqituvchi telefon kamerasi
   bilan skanerlaydi (yoki telefonda Ustozona'ga kirgan boʻlsa —
   `ustozona.uz/pult`). Shundan keyin telefon:
     • ekranlarni almashtiradi;
     • taqdimotda keyingi/oldingi qadam, «Javobni ochish»;
     • pardani yopadi/ochadi;
     • shu testni QR-karta / varaq skaneri bilan tekshiradi.

   HOKIMIYAT — DOSKA: holat shu yerda hisoblanadi va kanalga eʼlon
   qilinadi; telefon faqat buyruq yuboradi. Buyruqlar Doskaning
   MAVJUD amallari orqali bajariladi (`setActiveScreen`, vidjetning oʻz
   tugmalari — `remote-bus`), ikkinchi mantiq yoʻq.

   Kanal shu tab uchun saqlanadi (sessionStorage): sahifa yangilansa
   telefon uzilmaydi. Tab yopilsa — yangi QR.
   ════════════════════════════════════════════════════════════════════ */

type Session = { topic: string; url: string; qrSvg: string; config: RealtimeConfig; expiresAt: string };

const SESSION_KEY = "ustozona-doska-remote";
/** Telefon har 20 s da salomlashadi — shundan uzoq jim boʻlsa «kutilmoqda». */
const PHONE_FRESH_MS = 45_000;
const OPEN_REMOTE_EVENT = "doska:open-remote";
/** Oyna ochish soʻrovi pult tugmasi chizilishidan OLDIN kelishi mumkin
    (sozlama hali oʻqilmagan) — soʻrov eslab qolinadi. */
let openPending = false;

export function requestOpenRemote() {
  openPending = true;
  window.dispatchEvent(new Event(OPEN_REMOTE_EVENT));
}

function readSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    return new Date(s.expiresAt).getTime() > Date.now() + 60_000 ? s : null;
  } catch {
    return null;
  }
}

function saveSession(s: Session | null) {
  try {
    if (s) sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* saqlanmasa — faqat yangilanganda yangi QR kerak boʻladi */
  }
}

/** Ekranlar roʻyxatining qisqa kaliti — taymer soniyalari uni oʻzgartirmaydi. */
function screensKey(s: ReturnType<typeof useDoskaStore.getState>): string {
  return s.deck.screens
    .map((sc) => `${sc.id}:${sc.widgets.map((w) => `${w.kind}|${w.kind === "presentation.v1" ? String(w.state.setId ?? "") : ""}`).join(",")}`)
    .join(";");
}

export function DoskaRemote() {
  const t = useTranslations("Doska.remote");
  const [open, setOpen] = React.useState(false);
  const [session, setSession] = React.useState<Session | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [phoneSeen, setPhoneSeen] = React.useState(0);
  const [lastScan, setLastScan] = React.useState<{ added: number; answers: number; at: number } | null>(null);
  const [now, setNow] = React.useState(0);
  /** Radio pult rejimi — telefondan ochiladi, kompyuterda Web Serial. */
  const [pultFor, setPultFor] = React.useState<{ setId: string; classId: string } | null>(null);
  /** «Telegramga yuborish» natijasi — oynada bir qator. */
  const [tg, setTg] = React.useState<"sending" | "sent" | "bot" | "not_linked" | "failed" | null>(null);

  async function sendToTelegram() {
    setTg("sending");
    try {
      const res = await sendRemoteToTelegramAction();
      setTg(res.ok ? "sent" : res.reason === "bot" || res.reason === "not_linked" ? res.reason : "failed");
    } catch {
      setTg("failed");
    }
  }

  React.useEffect(() => setSession(readSession()), []);

  // Dars rejimi ochilganda pult oynasi oʻzi ochiladi (`DoskaShell`).
  React.useEffect(() => {
    const onOpen = () => {
      openPending = false;
      setOpen(true);
    };
    if (openPending) onOpen();
    window.addEventListener(OPEN_REMOTE_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_REMOTE_EVENT, onOpen);
  }, []);

  // «Ulangan» belgisi vaqt bilan soʻnadi.
  React.useEffect(() => {
    if (!session) return;
    const id = window.setInterval(() => setNow(Date.now()), 10_000);
    return () => window.clearInterval(id);
  }, [session]);

  async function connect() {
    setBusy(true);
    setError(null);
    try {
      const res = await startDoskaRemoteAction();
      if (!res.ok) {
        setError(t("errorRealtime"));
        return;
      }
      const next: Session = { topic: res.topic, url: res.url, qrSvg: res.qrSvg, config: res.config, expiresAt: res.expiresAt };
      saveSession(next);
      setSession(next);
      setPhoneSeen(0);
    } catch {
      setError(t("errorLogin"));
    } finally {
      setBusy(false);
    }
  }

  function disconnect() {
    saveSession(null);
    setSession(null);
    setPhoneSeen(0);
  }

  /* ── Holat: ekranlar + faol ekrandagi taqdimot ── */
  const screensSig = useDoskaStore(screensKey);
  const activeId = useDoskaStore((s) => s.activeScreenId);
  const curtain = useDoskaStore((s) => s.curtain);
  const busVersion = React.useSyncExternalStore(
    subscribePresentations,
    () => busTick,
    () => 0,
  );

  const tw = useTranslations("Doska.widgets");
  const templateLabelRef = React.useRef(t("templateName"));
  React.useEffect(() => {
    templateLabelRef.current = t("templateName");
  }, [t]);

  const state = React.useMemo<RemoteState>(() => {
    void screensSig;
    void busVersion;
    const { deck } = useDoskaStore.getState();
    const active = deck.screens.find((s) => s.id === activeId);
    const pres = active?.widgets.find((w) => w.kind === "presentation.v1" && presentationEntry(w.id));
    const entry = pres ? presentationEntry(pres.id) : undefined;
    if (entry) titleCache.set(entry.status.setId, entry.status.title);

    const screens: RemoteScreen[] = deck.screens.map((sc) => {
      const p = sc.widgets.find((w) => w.kind === "presentation.v1" && w.state.setId);
      const known = p ? titleCache.get(String(p.state.setId)) : undefined;
      if (known) return { id: sc.id, label: known, labelIsKind: false };
      const first = p ?? sc.widgets.find((w) => !w.parked);
      return first
        ? { id: sc.id, label: tw(widgetMeta(first.kind).labelKey), labelIsKind: false }
        : { id: sc.id, label: "", labelIsKind: false };
    });

    return {
      screens,
      activeId,
      presentation: entry && pres ? { widgetId: pres.id, ...entry.status } : null,
      lessonTitle: lessonTitle(),
      curtain,
      pult: pultEntry()?.status ?? null,
      sentAt: 0,
    };
  }, [screensSig, busVersion, activeId, curtain, tw]);

  const stateRef = React.useRef(state);
  React.useEffect(() => {
    stateRef.current = state;
  });

  const onMessage = React.useCallback((event: string, payload: unknown, reply: (event: string, payload: unknown) => boolean) => {
    if (event === "__joined") {
      reply(REMOTE_EVENTS.state, { ...stateRef.current, sentAt: Date.now() });
      return;
    }
    if (event !== REMOTE_EVENTS.command) return;
    const cmd = parseRemoteCommand(payload);
    if (!cmd) return;
    const at = Date.now();
    setPhoneSeen(at);
    setNow(at);
    const store = useDoskaStore.getState();
    const screens = store.deck.screens;
    const index = screens.findIndex((s) => s.id === store.activeScreenId);
    const pres = stateRef.current.presentation;
    switch (cmd.type) {
      case "hello":
        reply(REMOTE_EVENTS.state, { ...stateRef.current, sentAt: Date.now() });
        return;
      case "screen": {
        const target = screens[index + (cmd.to === "next" ? 1 : -1)];
        if (target) store.setActiveScreen(target.id);
        return;
      }
      case "screen-goto":
        if (screens.some((s) => s.id === cmd.id)) store.setActiveScreen(cmd.id);
        return;
      case "step":
      case "reveal": {
        // Pult rejimi ochiq boʻlsa — buyruq unga (taqdimot orqada qoladi).
        const entry = pultEntry() ?? (pres ? presentationEntry(pres.widgetId) : undefined);
        if (!entry) return;
        if (cmd.type === "reveal") entry.control.reveal();
        else if (cmd.to === "next") entry.control.next();
        else entry.control.prev();
        return;
      }
      case "curtain":
        store.setCurtain(!store.curtain);
        return;
      case "pult":
        if (pres?.classId) setPultFor({ setId: pres.setId, classId: pres.classId });
        return;
      case "template": {
        // Tezkor tekshirish: oʻquvchi shu shablonni qogʻozga koʻchiradi.
        // Yangi ekran — joriy ekrandagi taqdimotga tegilmaydi.
        const background = screens[index]?.background ?? undefined;
        store.addTemplateScreen({
          id: "quick-template",
          background: background ?? "whiteboard",
          widgets: [
            {
              kind: "text.v1",
              initial: { text: quickTemplateText(cmd.count, templateLabelRef.current), paper: true },
              at: { x: 0.05, y: 0.04, w: 0.9, h: 0.88 },
            },
          ],
        });
        return;
      }
      case "scanned":
        setLastScan({ added: cmd.added, answers: cmd.answers, at });
        return;
    }
  }, []);

  const { connected, send } = useRealtimeChannel(session?.topic ?? null, session?.config ?? null, onMessage);

  // Holat oʻzgarsa — telefonga eʼlon.
  const stateSig = JSON.stringify(state);
  React.useEffect(() => {
    if (connected) send(REMOTE_EVENTS.state, { ...stateRef.current, sentAt: Date.now() });
  }, [stateSig, connected, send]);

  const phoneOnline = phoneSeen > 0 && now - phoneSeen < PHONE_FRESH_MS;
  const scanFresh = lastScan && now - lastScan.at < 60_000;

  return (
    <>
      <BarIconButton label={phoneOnline ? t("buttonConnected") : t("button")} onClick={() => setOpen(true)} className="relative">
        <IconPhone className="size-5" />
        {session && (
          <span
            aria-hidden="true"
            className={cn(
              "absolute right-1.5 top-1.5 size-2 rounded-full",
              phoneOnline ? "bg-success" : "bg-muted-foreground/50",
            )}
          />
        )}
      </BarIconButton>

      {pultFor && (
        <PultRunner
          setId={pultFor.setId}
          classId={pultFor.classId}
          onClose={() => setPultFor(null)}
          onSaved={() => setPultFor(null)}
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogPortal>
          <DialogOverlay style={{ zIndex: Z_SHORTCUTS_SCRIM }} />
          <DialogPrimitive.Content
            className="doska-bar doska-sheet fixed top-1/2 left-1/2 flex max-h-[calc(100vh-2rem)] w-[min(30rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col outline-none"
            style={{ zIndex: Z_SHORTCUTS }}
          >
            <div className="flex items-start gap-3 border-b px-5 py-4">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <DialogTitle className="text-base font-medium">{t("title")}</DialogTitle>
                <DialogDescription className="text-muted-foreground text-xs leading-relaxed">
                  {t("description")}
                </DialogDescription>
              </div>
              <DialogPrimitive.Close
                aria-label={t("close")}
                className="hover:bg-muted focus-visible:ring-ring -my-1 -mr-2 grid size-11 shrink-0 place-items-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                <IconClose className="size-5" />
              </DialogPrimitive.Close>
            </div>

            <div className="flex min-h-0 flex-col items-center gap-4 overflow-y-auto px-5 py-5 text-center">
              {!session ? (
                <>
                  <ul className="text-muted-foreground flex w-full flex-col gap-1.5 text-left text-sm">
                    {(["f1", "f2", "f3", "f4"] as const).map((k) => (
                      <li key={k} className="flex gap-2">
                        <span aria-hidden="true">•</span>
                        {t(`features.${k}`)}
                      </li>
                    ))}
                  </ul>
                  {error && <p className="text-destructive text-sm">{error}</p>}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void connect()}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 w-full rounded-lg px-4 text-sm font-medium transition-colors disabled:opacity-60"
                  >
                    {busy ? t("connecting") : t("connect")}
                  </button>
                </>
              ) : (
                <>
                  {/* QR serverda bizning havolamizdan chiziladi (`qrcode` paketi) — tashqi SVG emas. */}
                  <div
                    className="w-full max-w-64 rounded-xl bg-white p-3 [&_svg]:h-auto [&_svg]:w-full"
                    dangerouslySetInnerHTML={{ __html: session.qrSvg }}
                  />
                  <p className={cn("text-sm font-medium", phoneOnline ? "text-success" : "text-muted-foreground")}>
                    {phoneOnline ? t("statusOnline") : connected ? t("statusWaiting") : t("statusOffline")}
                  </p>
                  <p className="text-muted-foreground text-xs leading-relaxed">{t("scanHint")}</p>
                  <p className="text-muted-foreground text-xs leading-relaxed">{t("loggedInHint")}</p>
                  {/* Telegram — QR'dan ham tez: telefonda bildirishnoma, bitta bosish. */}
                  <button
                    type="button"
                    disabled={tg === "sending"}
                    onClick={() => void sendToTelegram()}
                    className="hover:bg-muted h-10 w-full rounded-lg border px-3 text-sm font-medium transition-colors disabled:opacity-60"
                  >
                    {tg === "sending" ? t("tgSending") : t("tgSend")}
                  </button>
                  {tg && tg !== "sending" && (
                    <p className={cn("text-xs", tg === "sent" ? "text-success" : "text-muted-foreground")}>
                      {t(`tg_${tg}`)}
                    </p>
                  )}
                  {scanFresh && (
                    <p className="bg-muted rounded-md px-3 py-1.5 text-xs">
                      {t("scanned", { added: lastScan!.added, answers: lastScan!.answers })}
                    </p>
                  )}
                  <div className="flex w-full gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void connect()}
                      className="hover:bg-muted h-10 flex-1 rounded-lg border px-3 text-sm transition-colors"
                    >
                      {t("newQr")}
                    </button>
                    <button
                      type="button"
                      onClick={disconnect}
                      className="hover:bg-muted text-muted-foreground h-10 flex-1 rounded-lg border px-3 text-sm transition-colors"
                    >
                      {t("disconnect")}
                    </button>
                  </div>
                </>
              )}
            </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </>
  );
}

/** Taqdimot nomlari (setId → nom) — boshqa ekranlardagi taqdimot vidjeti
    chizilmagan boʻladi, nomini oxirgi koʻrilganidan olamiz. */
const titleCache = new Map<string, string>();

/* Koʻprik versiyasi — `useSyncExternalStore` uchun barqaror snapshot. */
let busTick = 0;
subscribePresentationsOnce();
function subscribePresentationsOnce() {
  if (typeof window === "undefined") return;
  subscribePresentations(() => {
    busTick += 1;
  });
}
