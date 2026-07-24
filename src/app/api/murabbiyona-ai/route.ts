import { eq, and, sql, inArray } from "drizzle-orm";
import { requireTeacher } from "@/server/session";
import { db } from "@/server/db/client";
import { aiUsage, aiDocs, classes } from "@/server/db/schema";
import { streamChat, configuredProviders, type AiChatMessage, type StreamChatArgs, type ProviderId } from "@/server/ai/providers";
import { buildClassContext, buildClassContexts } from "@/server/ai/class-context";

/**
 * Ustozona AI — dars muharriridagi AI yordamchi uchun streaming endpoint.
 * Provayder zanjiri (Gemini → Groq → Anthropic) src/server/ai/providers.ts da.
 * Soʻrov: { messages: {role,content}[], lesson?: {title, classes, unit, content} }
 * Javob: oddiy matn (text/plain) — boʻlak-boʻlak (streaming).
 * Kunlik kvota: AI_DAILY_LIMIT (default 30) xabar/foydalanuvchi.
 */

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM = `Sen — "Ustozona AI", Oʻzbekistondagi maktab oʻqituvchilari uchun yordamchisan.
Vazifang: oʻqituvchiga dars rejasi, topshiriqlar, mashqlar, materiallar tuzishda yordam berish;
mavjud darsni yaxshilash, savollar va baholash mezonlarini taklif qilish.

Qoidalar:
- Faqat oʻzbek tilida (lotin), tabiiy va aniq yoz.
- Apostrof oʻrniga toʻgʻri belgilardan foydalan: Oʻ/Gʻ uchun ʻ (U+02BB), tutuq belgisi uchun ʼ (U+02BC).
- Javobni Markdown formatida yoz: sarlavhalar (##), roʻyxatlar, qalin matn.
- Aniq, amaliy va oʻqituvchi darhol ishlatadigan koʻrinishda ber. Ortiqcha muqaddimasiz.
- Oʻquvchilarning ism-familiyasi kabi shaxsiy maʼlumotlarini soʻrama va javobda ishlatma.`;

/** Asia/Tashkent (UTC+5) boʻyicha YYYY-MM-DD. */
function todayTashkent(): string {
  return new Date(Date.now() + 5 * 3600_000).toISOString().slice(0, 10);
}

const DAILY_LIMIT = Math.max(1, Number(process.env.AI_DAILY_LIMIT) || 30);

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
      "Ustozona AI sozlanmagan: GEMINI_API_KEY (yoki GROQ_API_KEY / ANTHROPIC_API_KEY) .env.local faylida yoʻq.",
      { status: 503 }
    );
  }

  // ── Kunlik kvota (atomik: inkrement + qaytgan qiymat tekshiruvi — poyga yoʻq) ──
  const day = todayTashkent();
  const [usage] = await db
    .insert(aiUsage)
    .values({ id: `${userId}:${day}`, userId, day, count: 1 })
    .onConflictDoUpdate({
      target: [aiUsage.userId, aiUsage.day],
      set: { count: sql`${aiUsage.count} + 1` },
    })
    .returning({ count: aiUsage.count });
  if (usage.count > DAILY_LIMIT) {
    return new Response(
      `Bugungi AI limiti (${DAILY_LIMIT} xabar) tugadi. Ertaga yana urinib koʻring.`,
      { status: 429 }
    );
  }

  let body: {
    messages?: AiChatMessage[];
    lesson?: { title?: string; classes?: string; unit?: string; content?: string };
    /** Sinf statistikasi (anonim) kontekstga qoʻshilsinmi — panel toggle. */
    useClassData?: boolean;
    classIds?: string[];
    /** Hujjat rejimi — /api/murabbiyona-ai/doc dan qaytgan fayl. */
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
  const lessonCtx = L && (L.title || L.content || L.classes || L.unit)
    ? `\n\n— Joriy dars konteksti —\nSarlavha: ${L.title || "(nomsiz)"}\nSinf(lar): ${L.classes || "—"}\nBoʻlim: ${L.unit || "—"}\nMatn (HTML): ${(L.content || "").slice(0, 6000) || "(boʻsh)"}`
    : "";

  // Sinf statistikasi (anonim agregat) — faqat toggle yoqilganda.
  // Gemini: tool-calling (kerak paytda oʻzi soʻraydi, token tejaladi);
  // Groq/Anthropic fallback: tayyor blok system promptga qoʻshiladi.
  let classTools: StreamChatArgs["tools"];
  let classFallbackCtx = "";
  if (body.useClassData && Array.isArray(body.classIds) && body.classIds.length) {
    try {
      const ids = body.classIds
        .filter((id): id is string => typeof id === "string")
        .slice(0, 3);
      const own = await db
        .select({ id: classes.id, name: classes.name })
        .from(classes)
        .where(and(eq(classes.teacherId, userId), inArray(classes.id, ids)));
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
    const [owned] = await db
      .select({ uri: aiDocs.uri, mimeType: aiDocs.mimeType })
      .from(aiDocs)
      .where(and(eq(aiDocs.userId, userId), eq(aiDocs.uri, body.doc.uri)));
    if (owned) doc = { uri: owned.uri, mimeType: owned.mimeType };
  }
  const docCtx = doc
    ? `\n\n— Hujjat rejimi —\nSenga "${(body.doc?.name || "hujjat").slice(0, 120)}" nomli hujjat biriktirilgan. Savollarga FAQAT shu hujjat mazmuni asosida javob ber. Javob hujjatda boʻlmasa, ochiq ayt: "Bu maʼlumot yuklangan hujjatda topilmadi" — taxmin qilma. Iloji boricha qaysi boʻlim/sahifaga tayanganingni koʻrsat.`
    : "";

  // Premium: Anthropic (Claude) zanjir boshida; tekin: Gemini → Groq
  const chainOverride: ProviderId[] | undefined =
    teacher.plan === "premium" ? ["anthropic", "gemini", "groq"] : undefined;

  // Telemetriya: javob bergan provayderni sanaymiz (fire-and-forget)
  const recordProvider = (id: ProviderId) => {
    db.update(aiUsage)
      .set({
        providers: sql`jsonb_set(coalesce(${aiUsage.providers}, '{}'::jsonb), array[${id}::text], to_jsonb(coalesce((${aiUsage.providers}->>${id})::int, 0) + 1))`,
      })
      .where(and(eq(aiUsage.userId, userId), eq(aiUsage.day, day)))
      .catch((err) => console.warn("[ustozona-ai] telemetriya xatosi:", err));
  };

  const abort = new AbortController();
  const iterator = streamChat({
    system: SYSTEM + lessonCtx + docCtx,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    signal: abort.signal,
    doc,
    tools: classTools,
    fallbackContext: classFallbackCtx || undefined,
    chainOverride,
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
      "X-AI-Remaining": String(Math.max(0, DAILY_LIMIT - usage.count)),
    },
  });
}
