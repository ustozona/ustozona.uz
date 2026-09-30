import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getSession } from "@/server/session";
import { isTeacher } from "@/lib/auth-roles";
import { gameFrameUrl, gamePath, gameSeo, isGameFile, resolveGamesBase, type GameFile } from "@/lib/games";
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
   mehmon katalogni koʻradi. Oʻqituvchining test/OMR ish maydoni —
   Topshiriqlar boʻlimi («Darsda oʻtkazish» / «Uyga berish»;
   `/baholash` arxivlandi).

   KIRGAN OʻQITUVCHI esa `/dashboard/games` ga yoʻnaltiriladi: u yerda
   oʻyinlar Ustozona'ning oʻz yon paneli va sarlavhasi ichida ochiladi
   va Telegram bogʻlangan boʻlsa avtomatik kiradi. Eski havolalar
   (landing, xatlar, LessonLab yon paneli — `ustozona.uz/games`)
   shu tufayli oʻzgartirishsiz ishlayveradi.
   ════════════════════════════════════════════════════════════════════ */

const catalogMetadata: Metadata = {
  title: "Ustozona-Games — ta'limiy o'yinlar",
  description:
    "Arqon tortish, Poyga, Jonli o'yin (PIN), Xotira, Krossvord — testdan o'yin yarating va sinfda o'ynang.",
  alternates: { canonical: "/games" },
  icons: { icon: "/ustozona-games.svg" },
};

/* Har oʻyin oʻz sarlavha, tavsif va canonical bilan (`GAME_SEO`): ilgari
   hamma `/games/<oʻyin>` sahifasi bitta katalog metadatasini olib,
   `canonical` ni `/games` ga qaratgan edi — chuqur sahifalar qidiruvda
   alohida koʻrinmasdi. PIN, mezbon va Poyga koʻrinishi sahifalari `noindex`. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ game?: string[] }>;
}): Promise<Metadata> {
  const { game: segments } = await params;
  const name = segments?.length === 1 ? segments[0] : undefined;
  if (!isGameFile(name)) return catalogMetadata;

  const seo = gameSeo(name);
  if (!seo) {
    return { title: catalogMetadata.title, icons: catalogMetadata.icons, robots: { index: false } };
  }
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: gamePath(name) },
    icons: catalogMetadata.icons,
  };
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

  const pin = typeof query?.pin === "string" && /^\d{6}$/.test(query.pin) ? query.pin : null;
  const session = await getSession();
  if (session && isTeacher(session.user)) {
    redirect(gamePath(game, "/dashboard/games") + (pin ? `?pin=${pin}` : ""));
  }

  const base = resolveGamesBase(process.env.LESSONLAB_GAMES_BASE);
  return (
    <GamesFrame
      base={base}
      initialGame={game}
      src={gameFrameUrl(base, game, pin, await getLocale())}
      homeHref="/"
      signedIn={!!session}
    />
  );
}
