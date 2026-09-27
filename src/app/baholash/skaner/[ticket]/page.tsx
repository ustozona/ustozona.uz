import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { verifyScanTicket } from "@/server/baholash/scan-ticket";
import { buildSheetPlan } from "@/server/dal/baholash-sheets";
import { isConfigured } from "@/server/lessonlab/baholash";
import ScanPanel from "@/components/scan/ScanPanel";

/* ════════════════════════════════════════════════════════════════════
   /baholash/skaner/<chipta> — TELEFONDAGI SAHIFA

   Noutbukdagi QR shu manzilga olib keladi. Bu yerda cookie sessiyasi
   YOʻQ va boʻlishi ham shart emas: chipta oʻzi kimlikni tashiydi
   (`server/baholash/scan-ticket.ts`). Telefonda parol kiritish —
   aynan qochmoqchi boʻlgan toʻsigʻimiz.

   Sahifa ATAYLAB yalangʻoch: bitta test, bitta sinf, bitta ish —
   varaqni suratga olish. Menyu ham, boshqa boʻlimga havola ham yoʻq,
   chunki chipta boshqa hech narsaga ruxsat bermaydi.

   Indekslanmaydi — havolada chipta bor.
   ════════════════════════════════════════════════════════════════════ */

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Varaqni skanerlash — Ustozona",
  robots: { index: false, follow: false },
};

export default async function ScannerPage({
  params,
  searchParams,
}: {
  params: Promise<{ ticket: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { ticket } = await params;
  // `?mode=cards` — Topshiriqlardagi «QR-kartalar» dan: karta skaneri
  // asosiy tugma boʻladi. Faqat koʻrinish tanlovi, ruxsat chiptada.
  const query = searchParams ? await searchParams : undefined;
  const mode = query?.mode === "cards" ? "cards" : "sheets";
  const parsed = verifyScanTicket(ticket);

  if (!parsed) {
    return (
      <Shell>
        <h1 className="text-xl font-semibold">Havola eskirgan</h1>
        <p className="text-muted-foreground">
          Skaner havolasi 2 soat amal qiladi. Kompyuterdagi Ustozona sahifasida
          «Telefonda skanerlash» ni qaytadan bosing va yangi QR ni oching.
        </p>
      </Shell>
    );
  }

  /* Dvigatel faqat VARAQ surati uchun kerak. QR-karta skaneri brauzerda
     ishlaydi (`lib/cards/detect.ts`) va javob `applyOmrScan` ga
     dvigatelsiz yoziladi — karta rejimini bu tekshiruv toʻsmasin. */
  if (mode !== "cards" && !isConfigured()) {
    return (
      <Shell>
        <h1 className="text-xl font-semibold">Skaner ulanmagan</h1>
        <p className="text-muted-foreground">
          LessonLab dvigateli sozlanmagan, shuning uchun varaq oʻqilmaydi.
        </p>
      </Shell>
    );
  }

  /* Chipta imzosi toʻgʻri boʻlsa ham maʼlumot qayta oʻqiladi: test
     oʻchirilgan yoki sinf oʻzgargan boʻlishi mumkin. Imzo «kim» degan
     savolga javob beradi, «hali ham bormi» degan savolga emas. */
  let plan;
  try {
    plan = await buildSheetPlan(parsed.setId, parsed.classId, parsed.teacherId);
  } catch {
    return (
      <Shell>
        <h1 className="text-xl font-semibold">Test topilmadi</h1>
        <p className="text-muted-foreground">
          Test yoki sinf oʻzgargan boʻlishi mumkin. Kompyuterdan qaytadan
          boshlang.
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex flex-col gap-1">
        <Badge variant="outline" className="w-fit text-muted-foreground">
          {mode === "cards" ? "QR-kartalar" : "Qogʻoz test"}
        </Badge>
        <h1 className="text-xl font-semibold">{plan.title}</h1>
        <p className="text-sm text-muted-foreground">
          {plan.className} · {plan.questionCount} savol · {plan.roster.length} oʻquvchi
        </p>
      </div>

      {/* Jonli skaner uchun hamma narsa SERVERDAN tayyor keladi —
          kamera ochilishidan oldin qoʻshimcha soʻrov boʻlmasin.
          Toʻgʻri javoblar bu yerga kirmaydi: ball serverda. */}
      <ScanPanel
        setId={parsed.setId}
        classId={parsed.classId}
        ticket={ticket}
        mode={mode}
        plan={{
          testRef: plan.testRef,
          questionCount: plan.questionCount,
          roster: plan.roster,
        }}
      />

      <p className="text-xs text-muted-foreground">
        Kiritilgan natija kompyuterdagi{" "}
        <Link href="/dashboard/assignments" className="underline underline-offset-2">
          Topshiriqlar
        </Link>{" "}
        boʻlimida ham koʻrinadi. Jurnalga yozish oʻsha yerda, bitta tugma bilan —
        u hech qachon avtomatik boʻlmaydi.
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-5 px-4 py-8">
      {children}
    </main>
  );
}
