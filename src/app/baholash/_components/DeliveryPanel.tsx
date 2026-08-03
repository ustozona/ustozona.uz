"use client";

import { useState } from "react";
import { Check, Copy, Info, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { QuizSessionRow } from "@/server/db/schema";
import type { SetOption } from "./BaholashWorkspace";
import { GAME_SHELLS } from "@/lib/baholash-shells";

export type Delivery = "game" | "homework" | "paper";

type Props = {
  set: SetOption;
  delivery: Delivery;
  session: QuizSessionRow | null;
  busy: boolean;
  engineReady: boolean;
  onClose: () => void;
};

/* Yetkazish paneli — tanlangan usul boʻyicha oʻqituvchi nima qilishi
   kerakligini bitta ekranda koʻrsatadi.

   Qoida: hech bir usul «tayyor» deb koʻrsatilmaydi, agar u haqiqatda
   ishlamasa. Qogʻoz test dvigateli hali qurilmoqda — shuning uchun u
   ochiq holat bloki bilan chiqadi, soxta tugma bilan emas. */

export default function DeliveryPanel({
  set,
  delivery,
  session,
  busy,
  engineReady,
  onClose,
}: Props) {
  const [shellId, setShellId] = useState(GAME_SHELLS[0]?.id ?? "");
  const [copied, setCopied] = useState(false);

  const joinCode = session?.joinCode ?? null;
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const playUrl = joinCode
    ? delivery === "game"
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
          <div className="flex flex-wrap gap-2">
            {GAME_SHELLS.map((shell) => {
              const tooFew = set.itemCount < shell.minQuestions;
              return (
                <Button
                  key={shell.id}
                  size="sm"
                  variant={shell.id === shellId ? "default" : "outline"}
                  disabled={tooFew}
                  title={
                    tooFew
                      ? `Bu oʻyin uchun kamida ${shell.minQuestions} savol kerak`
                      : shell.description
                  }
                  onClick={() => setShellId(shell.id)}
                >
                  {shell.name}
                </Button>
              );
            })}
          </div>
          {!engineReady && (
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
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Har oʻquvchi uchun QR-belgili javob varagʻi chop etiladi. Oʻquvchi
            katakchani belgilaydi, oʻqituvchi telefon kamerasi bilan varaqni
            suratga oladi — natija oʻz-oʻzidan jurnalga tushadi.
          </p>
          <Note>
            <strong className="text-foreground">Bu qism hali tayyor emas.</strong>{" "}
            Skaner dvigateli serverga koʻchirilmoqda: varaq geometriyasi va
            oʻqish mantigʻi tayyor, qolgani — hamkor endpointi. Tayyor boʻlganda
            shu yerda «Varaqlarni chop etish» tugmasi paydo boʻladi.
          </Note>
        </div>
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

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
      <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <p className="text-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}
