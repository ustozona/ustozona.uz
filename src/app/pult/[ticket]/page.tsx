import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { verifyRemoteTicket } from "@/server/remote/remote-ticket";
import { realtimeConfig } from "@/server/realtime/config";
import { RemotePhone } from "@/components/remote/RemotePhone";

/* ════════════════════════════════════════════════════════════════════
   /pult/<chipta> — USTOZ PULTI, telefondagi sahifa.

   Doskadagi QR shu manzilga olib keladi. Cookie sessiyasi shart emas —
   chipta kimlikni tashiydi (`server/remote/remote-ticket.ts`). Telefonda
   Ustozona'ga kirgan oʻqituvchi esa `/pult` dan QR'siz shu yerga keladi.

   Indekslanmaydi — havolada chipta bor.
   ════════════════════════════════════════════════════════════════════ */

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Ustoz pulti — Ustozona",
  robots: { index: false, follow: false },
};

export default async function RemotePage({ params }: { params: Promise<{ ticket: string }> }) {
  const { ticket } = await params;
  const t = await getTranslations("Remote");
  const parsed = verifyRemoteTicket(decodeURIComponent(ticket));
  const config = realtimeConfig();

  if (!parsed || !config) {
    return (
      <main className="mx-auto flex min-h-svh w-full max-w-xl flex-col justify-center gap-3 px-4 py-8 text-center">
        <h1 className="text-headline text-foreground">{!parsed ? t("expiredTitle") : t("unavailableTitle")}</h1>
        <p className="text-body text-muted-foreground">{!parsed ? t("expiredHint") : t("unavailableHint")}</p>
        <Link href="/pult" className="text-body font-medium text-foreground underline underline-offset-4">
          {t("tryLoggedIn")}
        </Link>
      </main>
    );
  }

  return <RemotePhone ticket={decodeURIComponent(ticket)} topic={parsed.topic} config={config} />;
}
