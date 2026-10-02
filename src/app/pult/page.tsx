import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/server/session";
import { myActiveRemoteAction } from "@/server/actions/doska-remote";

/* ════════════════════════════════════════════════════════════════════
   /pult — QR'SIZ ULANISH (telefonda Ustozona'ga kirgan oʻqituvchi).

   Doskada «Telefon» bosilganda oxirgi pult chiptasi oʻqituvchi
   sozlamasiga yoziladi (`startDoskaRemoteAction`). Telefonda (ilova,
   brauzer, Telegram) kirgan oʻqituvchi shu sahifani ochsa — QR
   skanerlamasdan oʻsha Doskaga ulanadi.
   ════════════════════════════════════════════════════════════════════ */

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Ustoz pulti — Ustozona",
  robots: { index: false, follow: false },
};

export default async function RemoteEntryPage() {
  const t = await getTranslations("Remote");
  const session = await getSession();
  let ticket: string | null = null;
  if (session) {
    try {
      ticket = await myActiveRemoteAction();
    } catch {
      ticket = null;
    }
  }
  if (ticket) redirect(`/pult/${encodeURIComponent(ticket)}`);

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-xl flex-col justify-center gap-3 px-4 py-8 text-center">
      <h1 className="text-headline text-foreground">{t("entryTitle")}</h1>
      <p className="text-body text-muted-foreground">{session ? t("entryNoBoard") : t("entryLogin")}</p>
      {!session && (
        <Link href="/login" className="text-body font-medium text-foreground underline underline-offset-4">
          {t("login")}
        </Link>
      )}
    </main>
  );
}
