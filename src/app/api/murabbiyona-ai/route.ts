import Anthropic from "@anthropic-ai/sdk";
import { getSession } from "@/server/session";

/**
 * Ustozona AI — dars muharriridagi AI yordamchi uchun streaming endpoint.
 * Claude (claude-opus-4-8) bilan ishlaydi. Kalit serverda: ANTHROPIC_API_KEY.
 * Soʻrov: { messages: {role,content}[], lesson?: {title, class, unit, content} }
 * Javob: oddiy matn (text/plain) — boʻlak-boʻlak (streaming).
 */

export const runtime = "nodejs";
export const maxDuration = 60;

type ChatMessage = { role: "user" | "assistant"; content: string };

const SYSTEM = `Sen — "Ustozona AI", Oʻzbekistondagi maktab oʻqituvchilari uchun yordamchisan.
Vazifang: oʻqituvchiga dars rejasi, topshiriqlar, mashqlar, materiallar tuzishda yordam berish;
mavjud darsni yaxshilash, savollar va baholash mezonlarini taklif qilish.

Qoidalar:
- Faqat oʻzbek tilida (lotin), tabiiy va aniq yoz.
- Apostrof oʻrniga toʻgʻri belgilardan foydalan: Oʻ/Gʻ uchun ʻ (U+02BB), tutuq belgisi uchun ʼ (U+02BC).
- Javobni Markdown formatida yoz: sarlavhalar (##), roʻyxatlar, qalin matn.
- Aniq, amaliy va oʻqituvchi darhol ishlatadigan koʻrinishda ber. Ortiqcha muqaddimasiz.`;

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return new Response("Kirish talab qilinadi", { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      "Ustozona AI sozlanmagan: ANTHROPIC_API_KEY topilmadi. .env.local fayliga kalitni qoʻshing.",
      { status: 503 }
    );
  }

  let body: { messages?: ChatMessage[]; lesson?: { title?: string; classes?: string; unit?: string; content?: string } };
  try {
    body = await req.json();
  } catch {
    return new Response("Notoʻgʻri soʻrov", { status: 400 });
  }

  const messages = (body.messages ?? []).filter((m) => m.content?.trim());
  if (!messages.length) return new Response("Boʻsh soʻrov", { status: 400 });

  // Dars konteksti — "Ask about your lesson" uchun
  const L = body.lesson;
  const lessonCtx = L && (L.title || L.content || L.classes || L.unit)
    ? `\n\n— Joriy dars konteksti —\nSarlavha: ${L.title || "(nomsiz)"}\nSinf(lar): ${L.classes || "—"}\nBoʻlim: ${L.unit || "—"}\nMatn (HTML): ${(L.content || "").slice(0, 6000) || "(boʻsh)"}`
    : "";

  const client = new Anthropic();

  const stream = client.messages.stream({
    model: "claude-opus-4-8",
    max_tokens: 4096,
    system: SYSTEM + lessonCtx,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        stream.on("text", (delta) => controller.enqueue(encoder.encode(delta)));
        await stream.finalMessage();
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "AI xatosi";
        controller.enqueue(encoder.encode(`\n\n[Xatolik: ${msg}]`));
        controller.close();
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
