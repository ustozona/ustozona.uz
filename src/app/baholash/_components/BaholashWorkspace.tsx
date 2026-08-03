"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Gamepad2, Info, Layers, Printer, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { startSessionAction } from "@/server/actions/assess-sessions";
import type { QuizSessionRow } from "@/server/db/schema";
import DeliveryPanel, { type Delivery } from "./DeliveryPanel";

/* ════════════════════════════════════════════════════════════════════
   USTOZONA BAHOLASH — oʻqituvchi ish maydoni

   Test BU YERDA TUZILMAYDI. Tuzish Topshiriqlar boʻlimida qoladi
   (`/dashboard/assignments`) — u yerda muharrir bor va uni ikkinchi
   marta yozish dublikat boʻlardi. Bu sahifa faqat YETKAZISHGA javob
   beradi: tayyor testni sinfga qanday berish.

   Uchta usul, uchtasi ham bir xil sessiyaga ulanadi va bir xil
   javob jadvaliga yozadi — natija jurnalda birlashadi:

     1. Jonli oʻyin   — LessonLab oʻyin qobigʻi (arqon, poyga, ...)
     2. Uy vazifasi   — oddiy roʻyxat ekrani (/play/KOD)
     3. Qogʻoz test   — OMR: chop etiladi, telefon kamerasi tekshiradi
   ════════════════════════════════════════════════════════════════════ */

export type ClassOption = { id: string; name: string };

export type SetOption = {
  id: string;
  classId: string;
  title: string;
  purpose: "formative" | "summative";
  itemCount: number;
};

type Props = {
  classes: ClassOption[];
  sets: SetOption[];
  /** LessonLab dvigateli sozlanganmi (kalitlar oʻrnatilganmi). */
  engineReady: boolean;
};

export default function BaholashWorkspace({ classes, sets, engineReady }: Props) {
  const [classId, setClassId] = useState<string>(classes[0]?.id ?? "");
  const [activeSet, setActiveSet] = useState<SetOption | null>(null);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [session, setSession] = useState<QuizSessionRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const classSets = useMemo(
    () => sets.filter((s) => s.classId === classId),
    [sets, classId]
  );

  async function choose(set: SetOption, mode: Delivery) {
    setError(null);
    setActiveSet(set);
    setDelivery(mode);
    setSession(null);
    // Qogʻoz test sessiyasiz ishlaydi — varaq chop etiladi, natija
    // keyinroq skanerdan keladi.
    if (mode === "paper") return;
    setBusy(true);
    try {
      setSession(await startSessionAction({ setId: set.id, classId: set.classId, title: set.title }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sessiya ochilmadi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-2">
        <Badge variant="outline" className="w-fit text-muted-foreground">
          Ustozona Baholash
        </Badge>
        <h1 className="text-2xl font-semibold sm:text-3xl">Testni sinfga berish</h1>
        <p className="text-muted-foreground">
          Test{" "}
          <Link href="/dashboard/assignments" className="underline underline-offset-2">
            Topshiriqlar
          </Link>{" "}
          boʻlimida tuziladi. Bu yerda uni qanday yetkazishni tanlaysiz — natija
          uchala usulda ham bitta jurnalga tushadi.
        </p>
      </header>

      {classes.length === 0 ? (
        <EmptyNote text="Avval sinf qoʻshing — testni kimga berishni shundan keyin tanlaysiz." />
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {classes.map((c) => (
              <Button
                key={c.id}
                size="sm"
                variant={c.id === classId ? "default" : "outline"}
                onClick={() => {
                  setClassId(c.id);
                  setActiveSet(null);
                  setDelivery(null);
                  setSession(null);
                }}
              >
                {c.name}
              </Button>
            ))}
          </div>

          {classSets.length === 0 ? (
            <EmptyNote
              text="Bu sinfda hali test yoʻq."
              action={
                <Button asChild size="sm" variant="outline">
                  <Link href={`/dashboard/assignments?class=${classId}`}>Test tuzish</Link>
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border">
              {classSets.map((set) => (
                <li key={set.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <Layers className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{set.title}</span>
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                    {set.purpose === "summative" ? "Summativ" : "Formativ"}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                    {set.itemCount} savol
                  </Badge>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" disabled={busy}
                            onClick={() => choose(set, "game")}>
                      <Gamepad2 className="size-3.5" /> Jonli oʻyin
                    </Button>
                    <Button size="sm" variant="outline" disabled={busy}
                            onClick={() => choose(set, "homework")}>
                      <Radio className="size-3.5" /> Uy vazifasi
                    </Button>
                    <Button size="sm" variant="outline" disabled={busy}
                            onClick={() => choose(set, "paper")}>
                      <Printer className="size-3.5" /> Qogʻoz test
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {activeSet && delivery && (
        <DeliveryPanel
          set={activeSet}
          delivery={delivery}
          session={session}
          busy={busy}
          engineReady={engineReady}
          onClose={() => {
            setActiveSet(null);
            setDelivery(null);
            setSession(null);
          }}
        />
      )}
    </main>
  );
}

function EmptyNote({ text, action }: { text: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3.5">
      <Info className="size-4 shrink-0 text-muted-foreground" />
      <p className="flex-1 text-sm text-muted-foreground">{text}</p>
      {action}
    </div>
  );
}
