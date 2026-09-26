import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSession } from "@/server/session";
import { isTeacher } from "@/lib/auth-roles";
import { DEFAULT_GAMES_BASE, gameFrameUrl, isGameFile, type GameFile } from "@/lib/games";
import GamesFrame from "../_components/GamesFrame";

/* ════════════════════════════════════════════════════════════════════
   /games — USTOZONA-GAMES

   LessonLab'ning oʻyinlar boʻlimi (Arqon, Poyga, Jonli oʻyin, Xotira…)
   endi Ustozona brendida: `ustozona.uz/games`. Oʻyinlar LessonLab
   serverida qoladi va shu sahifa ularni iframe orqali koʻrsatadi —
   jonli oʻyin WebSocket'i, QR kamera va savollar bazasi oʻz domenida
   ishlaydi, hech narsa proksi qilinmaydi (`src/lib/games.ts`).

   `/games/<oʻyin>` — toʻgʻridan-toʻgʻri oʻyin (havola ulashish, sahifani
   yangilash). Nom `GAME_FILES` roʻyxatidan tashqarida boʻlsa 404 —
   manzil orqali iframe'ga ixtiyoriy yoʻl yuborib boʻlmaydi.

   Sahifa OCHIQ (kirish shart emas): oʻquvchi PIN bilan qoʻshiladi,
   oʻqituvchi Telegram bot orqali kiradi — xuddi LessonLab'dagidek.
   Oʻqituvchining test/OMR ish maydoni `/baholash` da oʻzgarishsiz qoladi.
   ════════════════════════════════════════════════════════════════════ */

export const metadata: Metadata = {
  title: "Ustozona-Games — ta'limiy o'yinlar",
  description:
    "Arqon tortish, Poyga, Jonli o'yin (PIN), Xotira, Krossvord — testdan o'yin yarating va sinfda o'ynang.",
  alternates: { canonical: "/games" },
  icons: { icon: "/ustozona-games.svg" },
};

function gamesBase(): string {
  const raw = (process.env.LESSONLAB_GAMES_BASE ?? "").trim();
  try {
    // Faqat https (yoki lokal ishlab chiqishda http) — `javascript:` kabi
    // sxema env xatosi bilan iframe'ga tushmasin.
    const url = new URL(raw || DEFAULT_GAMES_BASE);
    if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("scheme");
    return url.toString().replace(/\/+$/, "");
  } catch {
    return DEFAULT_GAMES_BASE;
  }
}

export default async function GamesPage({
  params,
  searchParams,
}: {
  params: Promise<{ game?: string[] }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { game: segments } = await params;
  const query = searchParams ? await searchParams : undefined;

  let game: GameFile | null = null;
  if (segments && segments.length) {
    if (segments.length !== 1 || !isGameFile(segments[0])) notFound();
    game = segments[0];
  }

  const base = gamesBase();
  const pin = typeof query?.pin === "string" ? query.pin : null;
  const session = await getSession();

  return (
    <GamesFrame
      base={base}
      initialGame={game}
      src={gameFrameUrl(base, game, pin)}
      homeHref={session && isTeacher(session.user) ? "/dashboard" : "/"}
      signedIn={!!session}
    />
  );
}
