import { ProductPage } from "@/components/landing/ProductPage";
import { getSession } from "@/server/session";
import { isTeacher } from "@/lib/auth-roles";
import { listSets, summarizeSetContent } from "@/server/dal/assess/sets";
import { getGradesPayload } from "@/server/dal/grades";
import { isConfigured, isGamesConfigured } from "@/server/lessonlab/baholash";
import { getImportReport } from "@/server/dal/lessonlab-import";
import BaholashWorkspace from "./_components/BaholashWorkspace";

export const metadata = {
  title: "Ustozona Baholash — onlayn test tuzish, sinfda kviz",
  description:
    "Onlayn test tuzish, sinfda interaktiv kviz, qogʻoz test skaneri (OMR) va QR-kartalar — bittasi bahoga, hammasi jurnalga.",
  alternates: { canonical: "/baholash" },
};

/* ════════════════════════════════════════════════════════════════════
   /baholash — IKKI YUZLI SAHIFA

   • Mehmon (kirmagan) uchun — mahsulot sahifasi (`ProductPage`, `live`
     rejimi): bugun nima ishlashi va roʻyxatdan oʻtish tugmasi. Roʻyxatda
     faqat ishlaydigan imkoniyatlar turadi — marketing oltin qoidasi.
   • Oʻqituvchi (kirgan) uchun — HAQIQIY ish maydoni: test tanlanadi va
     uchta yetkazish usulidan biri bilan sinfga beriladi.

   Nega bitta manzil: oʻqituvchi «Ustozona Baholash» deb eshitgan narsani
   izlaganda aynan shu yerga keladi. Ikkinchi manzil oʻrgatish — ortiqcha
   yuk.
   ════════════════════════════════════════════════════════════════════ */

export default async function BaholashPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const session = await getSession();

  if (session && isTeacher(session.user)) {
    const [sets, classMap] = await Promise.all([listSets(), getGradesPayload()]);
    // Qobiq mosligi kontentga bogʻliq (shakl + variant soni), shuning
    // uchun xulosa shu yerda hisoblanib panelga tayyor holda beriladi.
    const contentBySet = await summarizeSetContent(sets);
    const classes = Object.values(classMap)
      .filter((c) => !c.info.archivedAt)
      .map((c) => ({ id: c.info.id, name: c.info.name }));

    /* Import tafsiloti — `?report=<id>` bo'lsa. `getImportReport()`
       o'z ichida `teacherId` bo'yicha filtrlaydi, ya'ni begona id
       yozilsa `null` qaytadi va sahifa avvalgidek ishlaydi. */
    const reportId = typeof params?.report === "string" ? params.report : "";
    const importDetails = reportId
      ? (await getImportReport(reportId))?.details ?? []
      : [];

    return (
      <BaholashWorkspace
        importStatus={{
          state: typeof params?.import === "string" ? params.import : null,
          classes: Number(params?.classes ?? 0) || 0,
          students: Number(params?.students ?? 0) || 0,
          tests: Number(params?.tests ?? 0) || 0,
          updated: Number(params?.updated ?? 0) || 0,
          // Tafsilot — NOMI va SABABI bilan. URL'da faqat id ketadi;
          // nomlar bazadan va FAQAT o'z hisobotidan o'qiladi.
          details: importDetails,
          conflicts: Number(params?.conflicts ?? 0) || 0,
          skipped: Number(params?.skipped ?? 0) || 0,
        }}
        classes={classes}
        sets={sets.map((s) => ({
          id: s.id,
          classId: s.classId,
          title: s.title,
          // Sxemada `purpose` — matn ustuni (CHECK bilan cheklangan).
          // Ko'r-ko'rona cast qilmasdan aniq toraytiramiz: kutilmagan
          // qiymat kelsa formativ deb qaraladi, ya'ni jurnalga
          // avtomatik ko'chmaydi — xavfsiz tomon.
          purpose: s.purpose === "summative" ? "summative" : "formative",
          itemCount: s.items.length,
          content: contentBySet.get(s.id) ?? {
            countByShape: {},
            minOptions: null,
            maxOptions: null,
          },
        }))}
        engineReady={isConfigured()}
        gamesReady={isGamesConfigured()}
      />
    );
  }

  return (
    <ProductPage
      slug="baholash"
      capabilities={[
        "Yangi test tuzasiz yoki avval tuzgan testingizni bankdan olasiz — test topshiriqqa biriktirilishi bilan jurnalda uning ustuni paydo boʻladi",
        "Jonli oʻtkazish: oʻquvchilar oʻz telefonidan PIN yoki QR orqali qoʻshiladi",
        "Uyga vazifa: muddat bilan, oʻquvchi har savoldan keyin natijasini darhol koʻradi",
        "Qogʻoz test: javob varaqlarini chop etasiz va telefon kamerasi bilan tekshirasiz",
        "Telefonsiz sinf uchun QR-kartalar — kamerani sinfga qaratsangiz, barcha javoblar bir zumda oʻqiladi",
        "Interaktiv taqdimot: slaydlar orasida test, soʻrovnoma, soʻz buluti va ochiq javob",
      ]}
      differentiator="Sinfingizda nima boʻlsa — oʻquvchi telefoni, kompyuter sinfi, projektor yoki faqat qogʻoz — test shu bilan oʻtadi. Qaysi yoʻl bilan oʻtkazmang, natija bitta jurnalga tushadi, qaysi test yakuniy bahoga kirishini esa oʻzingiz belgilaysiz."
    />
  );
}
