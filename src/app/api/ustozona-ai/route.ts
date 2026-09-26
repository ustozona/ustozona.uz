import { requireTeacher } from "@/server/session";
import {
  consumeAiMessage,
  recordAiProvider,
  findAiDoc,
  listAiClassNames,
} from "@/server/dal/ai-usage";
import { visibleClassIds } from "@/server/workspace";
import { streamChat, configuredProviders, type AiChatMessage, type StreamChatArgs, type ProviderId } from "@/server/ai/providers";
import { buildClassContext, buildClassContexts } from "@/server/ai/class-context";
import {
  CALLOUT_KEYS,
  AI_CALLOUT_USAGE,
  NOTION_CALLOUT_COLORS,
} from "@/components/lesson-editor/callout-types";
import uzMessages from "../../../../messages/uz.json";

/* Callout turkodlari + yorliqlar — YAGONA MANBADAN (messages/uz.json,
   LessonEditorToolbar.calloutTypes) hosil qilinadi. Ilgari bu yerda qoʻlda
   takrorlangan edi: muharrir tomonidagi yorliq oʻzgarsa, AI eski nom bilan
   callout yasashda davom etardi. Prompt har doim oʻzbekcha boʻlgani uchun
   uz.json'dan toʻgʻridan-toʻgʻri olinadi (callout-extension.ts "use client"
   va lucide-react ni ortiqcha ilova qilib yuboradi, bu yerga kerak emas).

   ⚠️ YORLIQNING OʻZI YETARLI EMAS. Turkodlar Obsidian'dan meros va
   bizdagi pedagogik yorliq bilan ustma-ust tushmaydi — eng yomoni
   `bug` = «Uyga vazifa». Faqat "kod (yorliq)" berilsa, model inglizcha
   soʻzga tayanadi va uyga vazifani boshqa turga yozadi. Shuning uchun
   har turga QACHON ishlatish izohi qoʻshiladi (AI_CALLOUT_USAGE,
   callout-types.ts — u yerda `Record<CalloutType, …>` bilan yangi tur
   izohsiz qolmasligi kafolatlangan). */
const CALLOUT_LABELS = uzMessages.LessonEditorToolbar.calloutTypes as Record<
  string,
  string
>;
const CALLOUT_TYPE_LIST = CALLOUT_KEYS.map(
  (code) => `    - ${code} — «${CALLOUT_LABELS[code] ?? code}»: ${AI_CALLOUT_USAGE[code]}`
).join("\n");

/** Emojili blok fon ranglari — muharrir palitrasi bilan bir xil. */
const NOTION_COLOR_LIST = NOTION_CALLOUT_COLORS.join(", ");

/**
 * Ustozona AI — dars muharriridagi AI yordamchi uchun streaming endpoint.
 * Provayder zanjiri (Gemini → Groq → OpenRouter) src/server/ai/providers.ts da.
 * Soʻrov: { messages: {role,content}[], lesson?: {title, classes, unit, content} }
 * Javob: oddiy matn (text/plain) — boʻlak-boʻlak (streaming).
 * Kvota: taʼrifga bogʻliq OYLIK kredit (`src/lib/ai-limits.ts`).
 */

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM = `Sen — "Ustozona AI", Oʻzbekistondagi maktab oʻqituvchilari uchun yordamchisan.
Vazifang: oʻqituvchiga dars rejasi, topshiriqlar, mashqlar, materiallar tuzishda yordam berish;
mavjud darsni yaxshilash, savollar va baholash mezonlarini taklif qilish.

Qoidalar:
- Faqat oʻzbek tilida (lotin), tabiiy va aniq yoz.
- Apostrof oʻrniga toʻgʻri belgilardan foydalan: Oʻ/Gʻ uchun ʻ (U+02BB), tutuq belgisi uchun ʼ (U+02BC).
- Javobni Markdown formatida yoz. Javob "Darsga qoʻshish" tugmasi bilan dars muharririga TOʻGʻRIDAN-TOʻGʻRI tushadi, shuning uchun FAQAT quyidagilarni ishlat — roʻyxatda yoʻq narsa muharrirda yoʻqoladi yoki oddiy matnga aylanadi:
  - Sarlavhalar: ## va ### — bosqich/boʻlim nomlari uchun. Darsning oʻz sarlavhasi alohida maydonda, shuning uchun # ishlatma.
  - Roʻyxatlar: "- " (nuqtali), "1. " (raqamli), ichma-ich joylash mumkin (2 boʻshliq bilan).
  - Vazifa roʻyxati: "- [ ] bajarilmagan" va "- [x] bajarilgan" — muharrirda haqiqiy belgilanadigan katakcha boʻladi. Oʻquvchi/oʻqituvchi belgilab boradigan qadamlar uchun aynan shuni ishlat.
  - Matn ichi: **qalin**, *kursiv*, ~~oʻchirilgan~~, \`kod\`.
  - Jadval (GFM): "| ustun | ustun |" va ostida "| --- | --- |" — mezon/rubrika, taqqoslash, vaqt jadvali uchun.
  - Havola: [koʻrinadigan matn](https://...) — FAQAT haqiqatan bilgan manzilingni yoz. Havola oʻylab topma; ishonchli manba boʻlmasa umuman havola qoʻyma.
  - Kod bloki: uch teskari tirnoq bilan ochib-yopiladi — informatika darsi yoki namunaviy matn uchun.
  - Ajratuvchi chiziq: alohida qatorda "---" — yirik boʻlimlar orasida, kam ishlat.
  - Oddiy iqtibos: "> " bilan boshlangan qator (quyidagi callout sintaksisiga tushmasa) — sitata/parcha uchun.
  - Formulalar: $...$ (qator ichi) yoki $$...$$ (alohida qator), LaTeX sintaksisi. Muharrirda KaTeX bilan chiroyli chiziladi, shuning uchun matematik/kimyoviy ifodani oddiy matn bilan emas, aynan shu bilan yoz.
  - Emoji: oddiy unicode emoji toʻgʻridan-toʻgʻri matnga yoziladi va muharrirda yagona uslubdagi chiroyli belgi sifatida koʻrinadi. Sarlavhada, roʻyxat boshida yoki callout ichida ishlatsa boʻladi — bosqichlarni koʻzga tashlanadigan qilish uchun foydali (mas. "### 🎯 Maqsad", "### ⏱️ Kirish qismi"). Meʼyorida: bitta sarlavhaga bittadan koʻp emas, jadval ichida va rasmiy hujjat ohangini buzadigan joyda ishlatma.
  - Callout — rangli, ikonli maʼlumot bloki. Darsning eng muhim joylarini koʻzga tashlantiradi, shuning uchun har javobda mos oʻrinlarda ishlat (lekin ketma-ket 5-6 ta emas: blok koʻpaysa ajralib turishdan toʻxtaydi). Ikki xili bor va ular ARALASHTIRILMAYDI:

    1) PEDAGOGIK TUR — qatʼiy roʻyxatdan tur tanlanadi, ikon va rang shu turdan avtomatik keladi.
       Format: "> [!turkod] Sarlavha" qatori, keyin har qatori "> " bilan boshlanadigan matn.
       ⚠️ TURKOD INGLIZCHA SOʻZ, LEKIN MAʼNOSI BOSHQA. Kodning inglizcha maʼnosiga tayanma — quyidagi izohga tayan. Ayniqsa: bug = uyga vazifa (dasturlash xatosi EMAS), danger = xavfsizlik qoidasi, info = taʼrif.
${CALLOUT_TYPE_LIST}
       SARLAVHA QOIDALARI (ikkala tur uchun ham bir xil):
       - Sarlavha QISQA boʻlsin — 2-5 soʻz, gap emas, nuqta qoʻyilmaydi. Butun fikrni sarlavhaga sigʻdirma: u blok tanasiga, keyingi "> " qatorlariga yoziladi.
       - Sarlavha ALLAQACHON qalin chiqadi — uni ** ** bilan oʻrama. "> [!warning] **Eslatma**" NOTOʻGʻRI, "> [!warning] Eslatma" TOʻGʻRI.
       - Sarlavha yorliqni takrorlamasin: "> [!abstract] Maqsad" emas, "> [!abstract] Bugun nimani oʻrganamiz".
       Blok tanasida oddiy matndan tashqari roʻyxat, **qalin** va formulalar ishlaydi — har qator "> " bilan boshlansa boʻldi.
       Masalan:
       > [!abstract] Bugun nimani oʻrganamiz
       > - Fotosintez bosqichlarini ayta oladi
       > - Tenglamani $6CO_2 + 6H_2O$ koʻrinishida yoza oladi

    2) EMOJILI BLOK — qatʼiy tur yoʻq, emoji va rangni OʻZING tanlaysan. Roʻyxatdagi turlardan birortasi ham mos kelmaganda ishlatiladi: qiziqarli fakt, motivatsion soʻz, umumiy maslahat, mavzuga kirish.
       Format: "> [!free:EMOJI|rang] Sarlavha", keyin xuddi yuqoridagidek "> " bilan davom etadigan matn.
       EMOJI — mavzuga mos bitta emoji (mas. 💡, 🎯, ⭐, 🔥, 🔬, 📚).
       rang — ixtiyoriy, mumkin boʻlganlari: ${NOTION_COLOR_LIST}. Yozilmasa gray boʻladi; rangni mazmunga qarab tanla (mas. qiziqarli fakt — amber, tadqiqot — cyan, ogohlantirmaydigan eslatma — gray).
       Masalan:
       > [!free:🔥|amber] Qiziqarli fakt
       > Bir dona bargda milliondan ortiq xloroplast bor.
       ⚠️ "note" bilan "free"ni aralashtirma: pedagogik maʼnosi bor blok — 1-tur, erkin/norasmiy blok — 2-tur.
       ⚠️ "> [!free:...]" ichida turkod yozma, "> [!turkod]" ichida esa emoji/rang yozma — ikkala sintaksis alohida.
- ISHLATMA (muharrir buni qabul qilmaydi va javob buzilib tushadi): HTML teglari (<div>, <br>, <span> va h.k.); rasm qoʻyish (![]() — sen fayl yuklay olmaysan); matn rangi, fon rangi, markazga tekislash, shrift oʻlchami; izohlar (footnote); HTML jadval. Rang va tekislash muharrirdagi tugmalar bilan qoʻlda qoʻyiladi.
- Formatni bezak uchun emas, MAʼNO uchun ishlat: har bosqich — sarlavha, har qadam — roʻyxat elementi, har mezon — jadval qatori. Bir xil narsani ikki xil formatda takrorlama (masalan sarlavha ostiga yana qalin sarlavha yozma).
- Aniq, amaliy va oʻqituvchi darhol ishlatadigan koʻrinishda ber. Ortiqcha muqaddimasiz.
- Oʻquvchilarning ism-familiyasi kabi shaxsiy maʼlumotlarini soʻrama va javobda ishlatma.
- Dars rejasi soʻralganda (foydalanuvchi aynan qanday soʻz bilan soʻrashidan qatʼi nazar) quyidagi ikkita maʼlumot HAR DOIM, SOʻRALMASDAN hisobga olinadi:
  - "Dars davomiyligi" berilgan boʻlsa, reja ANIQ shu vaqtga (bosqichlarga ajratilgan daqiqalar yigʻindisi mos kelishi kerak) moʻljallansin.
  - "Biriktirilgan standartlar" berilgan boʻlsa, reja va topshiriqlar ANIQ shu standartlarga (har bir standart kodiga alohida ishora qilib) asoslansin — ular berilmagan yoki mavzuga aloqasiz standart oʻylab topma. Bular berilmagan boʻlsa, standartlarsiz oddiy reja tuz.
- Oʻqituvchi quyidagi dars-rejalashtirish metodikalaridan birini nomlab soʻrasa, aynan shu bosqichlar/tuzilma boʻyicha javob ber:
  - "Backward Design" (Wiggins & McTighe, teskari loyihalash): 1) Kutilgan natijalar (standart/maqsad), 2) Baholash dalili (qanday bilamiz oʻrganilganini), 3) Oʻqitish rejasi/faoliyati — shu tartibda, har bosqichni sarlavha qilib.
  - "5E modeli": Engage (Jalb qilish) → Explore (Tadqiq qilish) → Explain (Tushuntirish) → Elaborate (Chuqurlashtirish) → Evaluate (Baholash) — har biri alohida bosqich, taxminiy vaqt bilan.
  - "SMART maqsad": har bir maqsadni Specific/Measurable/Achievable/Relevant/Time-bound (Aniq/Oʻlchanadigan/Erishish mumkin/Dolzarb/Muddatli) mezonlariga mos, bitta-ikkita gapda yoz.`;

export async function POST(req: Request) {
  let teacher;
  try {
    teacher = await requireTeacher();
  } catch {
    return new Response("Kirish talab qilinadi", { status: 401 });
  }
  const userId = teacher.id;

  if (!configuredProviders().length) {
    return new Response(
      "Ustozona AI sozlanmagan: GEMINI_API_KEY (yoki GROQ_API_KEY / OPENROUTER_API_KEY) .env.local faylida yoʻq.",
      { status: 503 }
    );
  }

  // ── Oylik kredit (sarflash + tekshirish DAL ichida) ──
  const quota = await consumeAiMessage(userId, teacher.plan);
  if (!quota.allowed) {
    return new Response(
      `Bu oyning AI krediti (${quota.credit} xabar) tugadi. Keyingi oy boshida yangilanadi.`,
      { status: 429 }
    );
  }

  let body: {
    messages?: AiChatMessage[];
    lesson?: { title?: string; classes?: string; unit?: string; content?: string; standards?: { id?: string; desc?: string }[]; durationMin?: number };
    /** Sinf statistikasi (anonim) kontekstga qoʻshilsinmi — panel toggle. */
    useClassData?: boolean;
    classIds?: string[];
    /** Hujjat rejimi — /api/ustozona-ai/doc dan qaytgan fayl. */
    doc?: { uri?: string; mimeType?: string; name?: string };
  };
  try {
    body = await req.json();
  } catch {
    return new Response("Notoʻgʻri soʻrov", { status: 400 });
  }

  // Kirish cheklovlari: oxirgi 20 xabar, har biri ≤ 4000 belgi (token-suiisteʼmolga qarshi)
  const messages = (body.messages ?? [])
    .filter((m) => m.content?.trim())
    .slice(-20)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
  if (!messages.length) return new Response("Boʻsh soʻrov", { status: 400 });

  // Dars konteksti — "Ask about your lesson" uchun
  const L = body.lesson;
  const standardsList = (L?.standards ?? []).filter(
    (s): s is { id: string; desc: string } => !!s?.id && !!s?.desc
  );
  const standardsCtx = standardsList.length
    ? `\nBiriktirilgan standartlar:\n${standardsList.map((s) => `- ${s.id}: ${s.desc}`).join("\n")}`
    : "";
  const durationCtx = L?.durationMin ? `\nDars davomiyligi: ${L.durationMin} daqiqa` : "";
  const lessonCtx = L && (L.title || L.content || L.classes || L.unit || standardsList.length || L.durationMin)
    ? `\n\n— Joriy dars konteksti —\nSarlavha: ${L.title || "(nomsiz)"}\nSinf(lar): ${L.classes || "—"}\nBoʻlim: ${L.unit || "—"}${durationCtx}${standardsCtx}\nMatn (HTML): ${(L.content || "").slice(0, 6000) || "(boʻsh)"}`
    : "";

  // Sinf statistikasi (anonim agregat) — faqat toggle yoqilganda.
  // Gemini: tool-calling (kerak paytda oʻzi soʻraydi, token tejaladi);
  // Groq/OpenRouter fallback: tayyor blok system promptga qoʻshiladi.
  let classTools: StreamChatArgs["tools"];
  let classFallbackCtx = "";
  if (body.useClassData && Array.isArray(body.classIds) && body.classIds.length) {
    try {
      const ids = body.classIds
        .filter((id): id is string => typeof id === "string")
        .slice(0, 3);
      const allowed = new Set(await visibleClassIds("data"));
      const scoped = ids.filter((id) => allowed.has(id));
      const own = await listAiClassNames(scoped);
      if (own.length) {
        classTools = {
          declarations: [
            {
              name: "get_class_stats",
              description:
                "Sinfning anonim statistikasini qaytaradi (oʻquvchilar soni, oʻrtacha oʻzlashtirish, toifalar boʻyicha koʻrsatkichlar, davomat, xulq). Oʻqituvchi sinfga moslashtirilgan reja/mashq/tahlil soʻraganda ALBATTA chaqir.",
              parameters: {
                type: "object",
                properties: {
                  className: {
                    type: "string",
                    enum: own.map((c) => c.name),
                    description: "Statistikasi kerak boʻlgan sinf nomi",
                  },
                },
                required: ["className"],
              },
            },
          ],
          execute: async (name, toolArgs) => {
            if (name !== "get_class_stats") return "Nomaʼlum vosita";
            const cls = own.find((c) => c.name === toolArgs.className) ?? own[0];
            return (
              (await buildClassContext(userId, cls.id)) ??
              "Bu sinf boʻyicha statistika topilmadi"
            );
          },
        };
        classFallbackCtx = await buildClassContexts(userId, ids);
      }
    } catch (err) {
      console.warn("[ustozona-ai] sinf-kontekst xatosi (davom etamiz):", err);
    }
  }

  // Hujjat rejimi (darslik/PDF) — faqat berilgan hujjat asosida javob.
  // Egalik tekshiruvi: uri aynan shu foydalanuvchi yuklagan fayl boʻlishi shart.
  let doc: { uri: string; mimeType: string } | undefined;
  if (body.doc?.uri) {
    const owned = await findAiDoc(userId, body.doc.uri);
    if (owned) doc = { uri: owned.uri, mimeType: owned.mimeType };
  }
  const docCtx = doc
    ? `\n\n— Hujjat rejimi —\nSenga "${(body.doc?.name || "hujjat").slice(0, 120)}" nomli hujjat biriktirilgan. Savollarga FAQAT shu hujjat mazmuni asosida javob ber. Javob hujjatda boʻlmasa, ochiq ayt: "Bu maʼlumot yuklangan hujjatda topilmadi" — taxmin qilma. Iloji boricha qaysi boʻlim/sahifaga tayanganingni koʻrsat.`
    : "";

  /* Zanjir hamma uchun bir xil: Gemini → Groq → OpenRouter (hammasi tekin
     tarif). Ilgari premium reja Anthropic'ni zanjir boshiga qoʻyardi, lekin
     ANTHROPIC_API_KEY hech qachon sozlanmagan — chainOverride jimgina
     Gemini'ga tushib, premium tekindan farq qilmasdi. Premium uchun alohida
     model kerak boʻlsa, uni AI_PROVIDER_CHAIN emas, per-request model
     tanlovi orqali qaytarish kerak. */

  // Telemetriya: javob bergan provayderni sanaymiz (fire-and-forget)
  const recordProvider = (id: ProviderId) => {
    recordAiProvider(userId, quota.day, id).catch((err) =>
      console.warn("[ustozona-ai] telemetriya xatosi:", err)
    );
  };

  const abort = new AbortController();
  const iterator = streamChat({
    system: SYSTEM + lessonCtx + docCtx,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    signal: abort.signal,
    doc,
    tools: classTools,
    fallbackContext: classFallbackCtx || undefined,
    onProvider: recordProvider,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const delta of iterator) {
          controller.enqueue(encoder.encode(delta));
        }
        controller.close();
      } catch (err) {
        if (abort.signal.aborted) {
          controller.close();
          return;
        }
        console.error("[ustozona-ai] stream xatosi:", err);
        controller.enqueue(
          encoder.encode("\n\n[Xatolik: AI javob bera olmadi. Birozdan soʻng qayta urinib koʻring.]")
        );
        controller.close();
      }
    },
    cancel() {
      abort.abort();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      /* Oyning oxirigacha qolgan kredit (panel shuni koʻrsatadi).
         Nomi orqaga mos saqlandi — klient shu sarlavhani oʻqiydi. */
      "X-AI-Remaining": String(Math.max(0, quota.credit - quota.used)),
    },
  });
}
