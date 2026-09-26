import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { gamesTicket } from "@/server/lessonlab/games-sso";
import { isGameFile, resolveGamesBase, type GameFile } from "@/lib/games";
import GamesPanel from "../_components/GamesPanel";

/* ════════════════════════════════════════════════════════════════════
   /dashboard/games — OʻYINLAR Ustozona'ning OʻZ qobigʻi ichida

   Ilgari oʻyinlar `/games` da alohida sahifa edi: tepada Ustozona'ning
   yupqa sarlavhasi, ichida esa oʻyinlarning oʻz yon paneli va sarlavhasi
   — «ikki qavat». Endi oʻqituvchi uchun oʻyinlar dashboard ichida:
   Ustozona'ning haqiqiy yon paneli, sarlavhasi va yoʻl koʻrsatkichi
   qoladi, oʻyinlar tomonidagi panel esa yashiriladi (`eg-embed.js`).

   Oʻyinlar LessonLab serverida qoladi (iframe) — jonli oʻyin
   WebSocket'i, QR kamera va savollar bazasi oʻz domenida ishlaydi
   (`src/lib/games.ts`).

   Avtomatik kirish: oʻqituvchi Telegram'ni bogʻlagan boʻlsa, oʻyinlarda
   qayta kirish shart emas — `server/lessonlab/games-sso.ts`.

   Ochiq `/games` — mehmon va oʻquvchi uchun (PIN bilan qoʻshilish);
   kirgan oʻqituvchi u yerdan shu sahifaga yoʻnaltiriladi.
   ════════════════════════════════════════════════════════════════════ */

export const metadata: Metadata = {
  title: "Oʻyinlar — Ustozona",
  robots: { index: false },
};

export default async function DashboardGamesPage({
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

  const pin = typeof query?.pin === "string" && /^\d{6}$/.test(query.pin) ? query.pin : null;
  const identity = await gamesTicket();

  return (
    <GamesPanel
      base={resolveGamesBase(process.env.LESSONLAB_GAMES_BASE)}
      initialGame={game}
      pin={pin}
      ticket={identity.state === "ticket" ? identity.ticket : null}
      notLinked={identity.state === "not_linked"}
    />
  );
}
