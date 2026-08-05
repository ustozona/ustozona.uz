"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Info, Printer, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { QuizSessionRow } from "@/server/db/schema";
import type { SetOption } from "./BaholashWorkspace";
import { GAME_SHELLS, shellAvailability } from "@/lib/baholash-shells";
import ScanPanel from "./ScanPanel";

export type Delivery = "game" | "homework" | "paper";

type Props = {
  set: SetOption;
  delivery: Delivery;
  session: QuizSessionRow | null;
  busy: boolean;
  /** Imzo kalitlari bor — PDF/OMR chaqiruvlari ishlaydi. */
  engineReady: boolean;
  /** Oʻyin qobiqlari serveri manzili bor. */
  gamesReady: boolean;
  /** Yetkazish QAYSI sinfga — `set.classId` emas, oʻqituvchi tanlagani. */
  classId: string;
  onClose: () => void;
};

/* Yetkazish paneli — tanlangan usul boʻyicha oʻqituvchi nima qilishi
   kerakligini bitta ekranda koʻrsatadi.

   Qoida: hech bir usul «tayyor» deb koʻrsatilmaydi, agar u haqiqatda
   ishlamasa. Shuning uchun har blok oʻz sozlanish bayrogʻiga qaraydi
   (`engineReady` — imzo kalitlari, `gamesReady` — qobiq manzili) va
   sozlanmagan boʻlsa soxta tugma emas, sabab koʻrsatiladi. */

export default function DeliveryPanel({
  set,
  delivery,
  session,
  busy,
  engineReady,
  gamesReady,
  classId,
  onClose,
}: Props) {
  // Qobiq mosligi kontentdan HISOBLANADI (`shellAvailability`), qoʻlda
  // shart yozilmaydi — qoida bitta joyda tursin.
  const shells = useMemo(
    () => GAME_SHELLS.map((shell) => ({ shell, state: shellAvailability(shell, set.content) })),
    [set.content]
  );
  const usable = shells.filter((s) => s.state.ok);
  const blocked = shells.filter((s) => !s.state.ok);

  // Standart tanlov — birinchi ISHLAYDIGAN qobiq. Aks holda oʻqituvchi
  // oʻchiq qobiq bilan sessiya ochib, havolani bekorga tarqatardi.
  const [picked, setPicked] = useState<string | null>(null);
  const shellId = picked ?? usable[0]?.shell.id ?? "";
  const [copied, setCopied] = useState(false);

  const joinCode = session?.joinCode ?? null;
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const playUrl = joinCode
    ? delivery === "game" && shellId
      ? `${origin}/play/${joinCode}?game=${encodeURIComponent(shellId)}`
      : `${origin}/play/${joinCode}`
    : null;

  function copy() {
    if (!playUrl) return;
    navigator.clipboard.writeText(playUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border p-5">
      <div className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 className="text-lg font-semibold">
            {delivery === "game" && "Jonli oʻyin"}
            {delivery === "homework" && "Uy vazifasi"}
            {delivery === "paper" && "Qogʻoz test (OMR)"}
          </h2>
          <p className="truncate text-sm text-muted-foreground">{set.title}</p>
        </div>
        <Button variant="ghost" size="icon" aria-label="Yopish" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      {delivery === "game" && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Oʻyin faqat qobiq: savol va ball Ustozonada qoladi, jurnalga faqat
            toʻgʻri/notoʻgʻri kiradi. Tezlik hech qachon bahoga taʼsir qilmaydi.
          </p>
          {usable.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {usable.map(({ shell }) => (
                <Button
                  key={shell.id}
                  size="sm"
                  variant={shell.id === shellId ? "default" : "outline"}
                  title={shell.description}
                  onClick={() => setPicked(shell.id)}
                >
                  {shell.name}
                </Button>
              ))}
            </div>
          )}

          {/* Mos kelmagan qobiq YASHIRILMAYDI — sababi bilan koʻrsatiladi.
              Oʻchiq tugma «nega?» degan savol qoldiradi, sabab esa
              oʻqituvchiga nima qilishni aytadi (savol qoʻshish, variant
              kamaytirish). */}
          {blocked.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {blocked.map(({ shell, state }) => (
                <li key={shell.id} className="flex gap-2 text-sm text-muted-foreground">
                  <span aria-hidden className="select-none">
                    ✕
                  </span>
                  <span>
                    <span className="font-medium text-foreground/70">{shell.name}</span>{" "}
                    — {state.ok ? "" : state.reason}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {usable.length === 0 && (
            <Note>
              Bu testga mos oʻyin qobigʻi yoʻq. Test baribir ishlaydi —
              oʻquvchilar oddiy ekranda topshiradi va natija jurnalga
              odatdagidek tushadi.
            </Note>
          )}
          {!gamesReady && (
            <Note>
              Oʻyin qobiqlari serveri hali ulanmagan (<code>LESSONLAB_GAMES_BASE</code>).
              Havola ishlaydi, lekin qobiq ochilmaydi.
            </Note>
          )}
        </div>
      )}

      {delivery === "homework" && (
        <p className="text-sm text-muted-foreground">
          Oʻquvchi havolani ochadi, roʻyxatdan oʻz ismini tanlaydi va oʻz
          tezligida ishlaydi. Akkaunt kerak emas.
        </p>
      )}

      {delivery === "paper" && (
        <PaperPanel set={set} classId={classId} engineReady={engineReady} />
      )}

      {delivery !== "paper" && (
        <div className="flex flex-col gap-2">
          {busy && <p className="text-sm text-muted-foreground">Sessiya ochilmoqda...</p>}
          {joinCode && (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline" className="font-mono text-base tracking-widest">
                  {joinCode}
                </Badge>
                <Button size="sm" variant="outline" onClick={copy}>
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  {copied ? "Nusxalandi" : "Havolani nusxalash"}
                </Button>
              </div>
              <p className="break-all text-xs text-muted-foreground">{playUrl}</p>
            </>
          )}
          {!busy && !joinCode && (
            <p className="text-sm text-muted-foreground">Sessiya hali ochilmadi.</p>
          )}
        </div>
      )}
    </section>
  );
}

/* Qogʻoz test — varaqlarni chop etish.

   Ikki rejim ataylab ajratilgan:
     • Sinf roʻyxati — har varaqda ism va QR bor, tekshirgich varaqni
       oʻzi kimnikiligini biladi.
     • Imtihon      — ismsiz bitta varaq, koʻpaytirib tarqatiladi.
       QR faqat testni koʻrsatadi, ismni oʻquvchi qoʻlda yozadi.

   Tugma bosilganda PDF serverdan keladi va shu yerda faylga aylanadi —
   sahifa almashmaydi, oʻqituvchi tanlagan testini yoʻqotmaydi. */
function PaperPanel({ set, classId, engineReady }:
                    { set: SetOption; classId: string; engineReady: boolean }) {
  const [busy, setBusy] = useState<"class" | "exam" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function print(mode: "class" | "exam") {
    setBusy(mode);
    setError(null);
    try {
      const res = await fetch("/api/baholash/answer-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setId: set.id, classId, mode }),
      });
      if (!res.ok) {
        const info = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(info?.message ?? `Varaq tayyorlanmadi (${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      // Yangi oynada ochamiz: oʻqituvchi darhol chop etadi, fayl
      // yuklamalar papkasida ortiqcha qolmaydi.
      const opened = window.open(url, "_blank");
      if (!opened) {
        // Popup bloklandi — oddiy yuklab olishga tushamiz.
        const a = document.createElement("a");
        a.href = url;
        a.download = "javob-varaqlari.pdf";
        a.click();
      }
      // Blob URL'ni darhol boʻshatib boʻlmaydi — yangi oyna hali
      // oʻqiyapti. Bir daqiqa yetarli, keyin xotira qaytariladi.
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Varaq tayyorlanmadi");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Har oʻquvchi uchun QR-belgili javob varagʻi chop etiladi. Oʻquvchi
        katakchani belgilaydi, oʻqituvchi telefon kamerasi bilan varaqni
        suratga oladi.
      </p>

      {engineReady ? (
        <>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={busy !== null} onClick={() => print("class")}>
              <Printer className="size-3.5" />
              {busy === "class" ? "Tayyorlanmoqda..." : "Sinf roʻyxati bilan"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy !== null}
              onClick={() => print("exam")}
            >
              {busy === "exam" ? "Tayyorlanmoqda..." : "Imtihon (ismsiz)"}
            </Button>
          </div>
          {error && (
            <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          )}
          <Note>
            Varaqdagi QR oʻquvchining sinf roʻyxatidagi TARTIB raqamini
            tashiydi. Chop etgandan keyin sinfga oʻquvchi qoʻshsangiz yoki
            oʻchirsangiz raqamlar suriladi — bunday holatda varaqlarni
            qaytadan chop eting.
          </Note>

          {/* Qaytish yoʻli — chop etish bilan BITTA panelda.

              Oʻqituvchi uchun bu bitta ish: «qogʻoz test». Varaqni bir
              joyda chop etib, natijani boshqa boʻlimda kiritish yoʻlni
              ikkiga boʻlardi va ikkinchi yarmi topilmay qolardi. */}
          <ScanPanel setId={set.id} classId={classId} />
        </>
      ) : (
        <Note>
          Skaner dvigateli hali ulanmagan (<code>LESSONLAB_PARTNER_KEY</code>).
          Sozlangandan keyin shu yerda «Varaqlarni chop etish» tugmasi
          ishlaydi.
        </Note>
      )}
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
      <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <p className="text-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}
